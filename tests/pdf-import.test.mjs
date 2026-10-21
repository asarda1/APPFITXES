import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { openPdf, extractPage } from '../public/pdf-import/extract.mjs'
import { parseSheetPdf } from '../public/pdf-import/parser.mjs'

const cache = new Map()
async function geometry(name) {
  if (!cache.has(name)) cache.set(name, (async () => {
    const bytes = new Uint8Array(await readFile(new URL('./fixtures/pdf-import/' + name + '.pdf', import.meta.url)))
    const task = await openPdf(bytes)
    try {
      const pdf = await task.promise, pages = []
      for (let n = 1; n <= pdf.numPages; n++) pages.push(await extractPage(await pdf.getPage(n)))
      return pages
    } finally { await task.destroy() }
  })())
  return cache.get(name)
}

test('real technical PDF restores the header, custom fields, multiline values and all continuation rows', async () => {
  const pages = await geometry('tecnica')
  assert.ok(pages.length > 1)
  const { data } = parseSheetPdf(pages, 'tecnica')
  assert.equal(data.cabecera.codigoInterno, 'PDF-TEC-001')
  assert.equal(data.cabecera.matricula, '1234 ABC')
  assert.equal(data.cabecera.anyo, '2026')
  assert.equal(data.caracteristicasGenerales.numeroSerieBastidor, 'VIN-TEC-2026')
  const groups = data.grupos.filter((group) => group.titulo === 'MOTOR PERSONALIZADO')
  assert.equal(groups.length, 1)
  assert.equal(groups[0].filas.length, 42)
  assert.equal(groups[0].filas.at(-1).valor, 'VALOR MOTOR 41')
  const custom = data.layout.find((item) => item.kind === 'general').filas.at(-1)
  assert.equal(custom.caracteristica, 'CAMPO PERSONALIZADO')
  assert.equal(custom.valor, 'Línea uno\nLínea dos')
  assert.equal(data.filtrosMateriales.length, 2)
  assert.equal(data.filtrosMateriales[1].cantidadUnidad, '20 L\nReferencia 123')
})

test('real technical photos are recognized without importing the watermark', async () => {
  const pages = await geometry('tecnica')
  const result = parseSheetPdf(pages, 'tecnica')
  assert.equal(result.media.length, 2)
  assert.equal(result.media.filter((image) => image.primary).length, 1)
  for (const image of result.media) assert.ok(pages[image.pageIndex].images[image.imageIndex].alpha >= 0.8)
})

test('real maintenance PDF restores checkbox states, date, responsible and signature', async () => {
  const pages = await geometry('mantenimiento')
  assert.ok(pages.length > 1)
  const { data, media } = parseSheetPdf(pages, 'mantenimiento')
  assert.equal(data.mantenimiento, '1.500h')
  assert.equal(data.maquina.codigoInterno, 'PDF-MAN-001')
  assert.equal(data.maquina.horasTrabajoKilometros, '12.345 h')
  assert.equal(data.operaciones.length, 42)
  assert.deepEqual(data.operaciones.map((row) => row.realizada), Array.from({ length: 42 }, (_, i) => i % 2 === 0))
  assert.equal(data.operaciones[0].descripcion, 'OPERACIÓN 0\nDetalle de la revisión')
  assert.equal(data.observacionesGenerales, 'OBSERVACIÓN DEL PDF\nSegunda línea')
  assert.equal(data.responsable, 'RESPONSABLE DEL PDF')
  assert.equal(data.fecha, '2026-10-19')
  assert.equal(media.filter((item) => item.signature).length, 1)
})

test('repeated maintenance headers underneath an orphaned table title are never material rows', async () => {
  const result = parseSheetPdf(await geometry('mantenimiento'), 'mantenimiento')
  assert.deepEqual(result.data.filtrosMateriales, [
    { tipo: 'FILTRO AIRE', cantidadUnidad: '1 unidad' }, { tipo: 'ACEITE MOTOR', cantidadUnidad: '25 L' },
  ])
})

test('wrong sheet types are rejected explicitly in both directions', async () => {
  const technical = await geometry('tecnica'), maintenance = await geometry('mantenimiento')
  assert.throws(() => parseSheetPdf(technical, 'mantenimiento'), /fitxa tècnica/)
  assert.throws(() => parseSheetPdf(maintenance, 'tecnica'), /fitxa de manteniment/)
})

test('a genuine PDF with a different format is rejected', async () => {
  const pages = await geometry('unsupported')
  assert.throws(() => parseSheetPdf(pages, 'tecnica'), /no correspon al format/)
})

test('scanned, empty and title-only lookalikes are not imported', async () => {
  assert.throws(() => parseSheetPdf([{ texts: [], shapes: [], images: [] }], 'tecnica'), /escanejada/)
  const pages = structuredClone(await geometry('tecnica'))
  pages[0].shapes = []
  assert.throws(() => parseSheetPdf(pages, 'tecnica'), /taules/)
  const noFields = structuredClone(await geometry('tecnica'))
  noFields[0].shapes = noFields[0].shapes.filter((shape) => !shape.stroke)
  assert.throws(() => parseSheetPdf(noFields, 'tecnica'), /capçalera/)
})

test('invalid PDF bytes fail cleanly before a sheet can be parsed', async () => {
  const task = await openPdf(new TextEncoder().encode('%PDF-1.7\ncorrupt document'))
  try { await assert.rejects(task.promise) } finally { await task.destroy() }
})
