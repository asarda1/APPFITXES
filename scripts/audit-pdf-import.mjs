import assert from 'node:assert/strict'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright')
const base = process.env.AUDIT_URL || 'http://localhost:5173'
const output = path.resolve('docs/audit-pdf-import')
const fixtures = path.resolve('tests/fixtures/pdf-import')
await mkdir(output, { recursive: true })
await mkdir(fixtures, { recursive: true })
await copyFile(path.resolve('docs/audit-sheet-workflows/maintenance.pdf'), path.join(fixtures, 'mantenimiento.pdf'))
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = [], checks = []
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const unsupported = await context.newPage()
  await unsupported.setContent('<h1>Factura de prova</h1><p>Aquest PDF no correspon a una fitxa de l\'aplicacio.</p>')
  await unsupported.pdf({ path: path.join(fixtures, 'unsupported.pdf'), format: 'A4' })
  await unsupported.close()
  const source = await context.newPage()
  source.on('pageerror', (error) => errors.push(error.message))
  for (const type of ['tecnica', 'mantenimiento']) {
    const technical = type === 'tecnica'
    const url = base + (technical ? '/machinery-spec-sheet-builder/ficha-tecnica.html' : '/maintenance-sheet-builder/fichas.html')
    await source.goto(url)
    await source.getByRole('button', { name: technical ? 'Importar ficha técnica' : 'Importar ficha mantenimiento', exact: true }).waitFor()
    await source.evaluate((type) => {
      const canvas = document.createElement('canvas')
      canvas.width = 120; canvas.height = 60
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#e13939'; ctx.fillRect(0, 0, 120, 60)
      ctx.fillStyle = '#14a0cc'; ctx.fillRect(60, 0, 60, 60)
      const photo = canvas.toDataURL('image/png')
      ctx.clearRect(0, 0, 120, 60)
      ctx.strokeStyle = '#111'; ctx.lineWidth = 4
      ctx.beginPath(); ctx.moveTo(10, 40); ctx.lineTo(35, 10); ctx.lineTo(65, 45); ctx.lineTo(110, 15); ctx.stroke()
      const signature = canvas.toDataURL('image/png')
      if (type === 'tecnica') {
        const api = window.rpFichasAutosaveTecnica
        const data = api.collectDraftData({ includeMedia: true })
        data.cabecera = { maquina: 'EXCAVADORA ELÉCTRICA', codigoInterno: 'PDF-TEC-001', marcaModelo: 'ROMERO POLO TEST', matricula: '1234 ABC', anyo: '2026' }
        data.caracteristicasGenerales.numeroSerieBastidor = 'VIN-TEC-2026'
        const general = data.layout.find((item) => item.kind === 'general')
        general.filas.forEach((row, index) => { row.valor = 'VALOR GENERAL ' + index })
        general.filas.push({ caracteristica: 'CAMPO PERSONALIZADO', valor: 'Línea uno\nLínea dos', fieldId: '', editable: true })
        const motor = { titulo: 'MOTOR PERSONALIZADO', filas: Array.from({ length: 42 }, (_, index) => ({ caracteristica: 'DATO MOTOR ' + index, valor: 'VALOR MOTOR ' + index })) }
        data.grupos = [motor]
        data.filtrosMateriales = [{ tipo: 'FILTRO ACEITE', cantidadUnidad: '2 unidades' }, { tipo: 'ACEITE MOTOR', cantidadUnidad: '20 L\nReferencia 123' }]
        data.imagenPrincipal = { src: photo }
        data.layout = [general, { type: 'photo', photo: { src: photo } }, { type: 'group', kind: 'keyvalue', group: motor }, { type: 'group', kind: 'materials', title: 'FILTRO Y MATERIALES' }]
        api.restoreDraftData(data, { exactLayout: true })
      } else {
        window.rpFichasAutosaveMantenimiento.restoreDraftData({
          mantenimiento: '1.500h', maquina: { tipoMaquina: 'EXCAVADORA', marcaModelo: 'ROMERO POLO TEST', codigoInterno: 'PDF-MAN-001', matricula: '5678 DEF', bastidorSerie: 'VIN-MAN-2026', horasTrabajoKilometros: '12.345 h' },
          operaciones: Array.from({ length: 42 }, (_, index) => ({ descripcion: 'OPERACIÓN ' + index + '\nDetalle de la revisión', realizada: index % 2 === 0 })),
          filtrosMateriales: [{ tipo: 'FILTRO AIRE', cantidadUnidad: '1 unidad' }, { tipo: 'ACEITE MOTOR', cantidadUnidad: '25 L' }],
          observacionesGenerales: 'OBSERVACIÓN DEL PDF\nSegunda línea', responsable: 'RESPONSABLE DEL PDF', fecha: '2026-10-19', firma: signature,
        })
      }
    }, type)
    await source.waitForFunction(() => Array.from(document.querySelectorAll('.page img')).filter((img) => img.getAttribute('src')).every((img) => img.complete && img.naturalWidth > 0))
    if (!technical) {
      await source.evaluate(() => { window.print = () => {}; window.guardarPDF() })
      await source.waitForFunction(() => document.body.classList.contains('js-paginated'))
    }
    const pdfPath = path.join(output, type + '.pdf')
    await source.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true })
    await copyFile(pdfPath, path.join(fixtures, type + '.pdf'))

    const page = await context.newPage()
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(url)
    const recovery = page.getByRole('button', { name: 'Descartar', exact: true })
    if (await recovery.isVisible()) await recovery.click()
    const importButton = page.getByRole('button', { name: technical ? 'Importar ficha técnica' : 'Importar ficha mantenimiento', exact: true })
    await importButton.waitFor()
    await page.locator('#sheet-pdf-file').setInputFiles(pdfPath)
    await page.locator('.sheet-pdf-source').waitFor({ timeout: 30000 })
    const data = await page.evaluate((type) => (type === 'tecnica' ? window.rpFichasAutosaveTecnica : window.rpFichasAutosaveMantenimiento).collectDraftData({ includeMedia: true }), type)
    if (technical) {
      assert.equal(data.cabecera.codigoInterno, 'PDF-TEC-001')
      assert.equal(data.caracteristicasGenerales.numeroSerieBastidor, 'VIN-TEC-2026')
      assert.equal(data.grupos.find((group) => group.titulo === 'MOTOR PERSONALIZADO').filas.length, 42)
      assert.equal(data.layout.find((item) => item.kind === 'general').filas.at(-1).valor, 'Línea uno\nLínea dos')
      assert.match(data.imagenPrincipal.src, /^data:image\/png/)
      assert.equal(data.layout.filter((item) => item.type === 'photo' && item.photo.src).length, 1)
      assert.equal(data.filtrosMateriales[1].cantidadUnidad, '20 L\nReferencia 123')
      await page.locator('#tec_serie').fill('VIN-EDITADO')
      assert.equal(await page.locator('#tec_serie').inputValue(), 'VIN-EDITADO')
    } else {
      assert.equal(data.maquina.codigoInterno, 'PDF-MAN-001')
      assert.equal(data.mantenimiento, '1.500h')
      assert.equal(data.operaciones.length, 42)
      assert.deepEqual(data.filtrosMateriales, [{ tipo: 'FILTRO AIRE', cantidadUnidad: '1 unidad' }, { tipo: 'ACEITE MOTOR', cantidadUnidad: '25 L' }])
      assert.deepEqual(data.operaciones.map((row) => row.realizada), Array.from({ length: 42 }, (_, index) => index % 2 === 0))
      assert.equal(data.observacionesGenerales, 'OBSERVACIÓN DEL PDF\nSegunda línea')
      assert.equal(data.responsable, 'RESPONSABLE DEL PDF')
      assert.equal(data.fecha, '2026-10-19')
      assert.match(data.firma, /^data:image\/png/)
      await page.locator('#operaciones textarea').first().fill('OPERACIÓN EDITADA')
      assert.equal(await page.locator('#operaciones textarea').first().inputValue(), 'OPERACIÓN EDITADA')
    }
    await writeFile(path.join(output, type + '-imported.json'), JSON.stringify(data, null, 2))
    await page.screenshot({ path: path.join(output, type + '-desktop.png'), fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: path.join(output, type + '-mobile.png'), fullPage: true })
    await page.setViewportSize({ width: 1440, height: 1000 })
    const before = await page.evaluate((type) => JSON.stringify((type === 'tecnica' ? window.rpFichasAutosaveTecnica : window.rpFichasAutosaveMantenimiento).collectDraftData({ includeMedia: true })), type)
    await page.locator('#sheet-pdf-file').setInputFiles({ name: 'no-es-un-pdf.pdf', mimeType: 'application/pdf', buffer: Buffer.from('NOT A PDF') })
    await page.locator('.sheet-pdf-message.is-error').waitFor()
    assert.equal(await page.evaluate((type) => JSON.stringify((type === 'tecnica' ? window.rpFichasAutosaveTecnica : window.rpFichasAutosaveMantenimiento).collectDraftData({ includeMedia: true })), type), before)
    await page.getByRole('button', { name: 'Tancar', exact: true }).click()
    await page.waitForFunction(() => !document.getElementById('btnImportSheetPdf').disabled)
    await page.locator('#sheet-pdf-file').setInputFiles(path.join(fixtures, 'unsupported.pdf'))
    await page.locator('.sheet-pdf-message.is-error').waitFor()
    assert.match(await page.locator('.sheet-pdf-message').innerText(), /format/)
    assert.equal(await page.evaluate((type) => JSON.stringify((type === 'tecnica' ? window.rpFichasAutosaveTecnica : window.rpFichasAutosaveMantenimiento).collectDraftData({ includeMedia: true })), type), before)
    await page.getByRole('button', { name: 'Tancar', exact: true }).click()
    await page.waitForFunction(() => !document.getElementById('btnImportSheetPdf').disabled)
    await page.locator('#sheet-pdf-file').setInputFiles(path.join(fixtures, technical ? 'mantenimiento.pdf' : 'tecnica.pdf'))
    await page.locator('.sheet-pdf-message.is-error').waitFor()
    assert.match(await page.locator('.sheet-pdf-message').innerText(), technical ? /manteniment/ : /tècnica/)
    assert.equal(await page.evaluate((type) => JSON.stringify((type === 'tecnica' ? window.rpFichasAutosaveTecnica : window.rpFichasAutosaveMantenimiento).collectDraftData({ includeMedia: true })), type), before)
    await page.getByRole('button', { name: 'Tancar', exact: true }).click()
    await page.waitForFunction(() => !document.getElementById('btnImportSheetPdf').disabled)
    await page.evaluate((type) => {
      const key = (type === 'tecnica' ? window.rpFichasAutosaveTecnica : window.rpFichasAutosaveMantenimiento).draftKey
      const original = Storage.prototype.setItem
      window.__restorePdfStorage = () => { Storage.prototype.setItem = original }
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new DOMException('Quota exceeded', 'QuotaExceededError')
        return original.call(this, name, value)
      }
    }, type)
    await page.locator('#sheet-pdf-file').setInputFiles(pdfPath)
    await page.locator('.sheet-pdf-message.is-error').waitFor()
    assert.match(await page.locator('.sheet-pdf-message').innerText(), /espai/)
    assert.equal(await page.evaluate((type) => JSON.stringify((type === 'tecnica' ? window.rpFichasAutosaveTecnica : window.rpFichasAutosaveMantenimiento).collectDraftData({ includeMedia: true })), type), before)
    await page.evaluate(() => window.__restorePdfStorage())
    await page.getByRole('button', { name: 'Tancar', exact: true }).click()
    await page.reload()
    await page.getByRole('button', { name: 'Recuperar', exact: true }).click()
    assert.equal(await page.locator(technical ? '#tec_codigoInterno' : '#codigoInterno').inputValue(), technical ? 'PDF-TEC-001' : 'PDF-MAN-001')
    checks.push(type + ': multipage PDF imported with rows, media and editable data; invalid, wrong-format/type and storage failures preserve the sheet; reload recovery works')
    await page.close()
  }
  assert.deepEqual(errors, [])
  await writeFile(path.join(output, 'browser-audit.json'), JSON.stringify({ checks, errors }, null, 2))
  console.log(JSON.stringify({ checks, errors, output }, null, 2))
} finally {
  await browser.close()
}
