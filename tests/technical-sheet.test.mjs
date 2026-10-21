import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { JSDOM, VirtualConsole } from 'jsdom'

const root = new URL('../public/machinery-spec-sheet-builder/', import.meta.url)
const html = readFileSync(new URL('ficha-tecnica.html', root), 'utf8')

async function editor(t) {
  const errors = []
  const virtualConsole = new VirtualConsole()
  virtualConsole.on('jsdomError', (error) => {
    if (error.type !== 'css-parsing') errors.push(error.message)
  })
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole })
  const w = dom.window
  const observers = []
  const Observer = w.MutationObserver
  w.MutationObserver = class extends Observer {
    constructor(callback) { super(callback); observers.push(this) }
  }
  t.after(() => {
    observers.forEach((observer) => observer.disconnect())
    w.close()
    assert.deepEqual(errors, [])
  })
  w.HTMLElement.prototype.scrollIntoView = function () {}
  w.prompt = () => 'MOTOR'
  w.confirm = () => true
  w.alert = (message) => assert.fail(message)
  for (const script of w.document.scripts) {
    if (script.type === 'module') continue
    if (!script.src) w.eval(script.textContent)
    else if (!script.src.includes('maquinaria_completa')) {
      w.eval(readFileSync(new URL(script.getAttribute('src').split('?')[0], root), 'utf8'))
    }
  }
  await new Promise((resolve) => w.addEventListener('load', resolve, { once: true }))
  return w
}

const groups = (w) => Array.from(w.document.querySelectorAll('#tec-groups > [data-group]'))
const titles = (w) => groups(w).map((group) => group.querySelector('.section-title').textContent)
const rows = (group) => group.querySelector('[data-rows]').children

test('direct row buttons and print, without clear, project or preview controls', async (t) => {
  const w = await editor(t)
  const bar = w.document.querySelector('.acciones-ficha')
  assert.equal(bar.textContent.includes('Repuestos'), false)
  assert.equal(bar.textContent.includes('proyecto'), false)
  assert.equal(bar.textContent.includes('Vista impresión'), false)
  assert.equal(bar.textContent.includes('Vaciar'), false)
  assert.equal(bar.querySelector('[onclick="addRowToActiveGroup()"]').closest('[data-menu]'), null)
  assert.equal(bar.querySelector('[onclick="removeActiveRow()"]').closest('[data-menu]'), null)
  assert.equal(w.rpProjectFileTecnica, undefined)
  let calls = 0
  w.print = () => { calls++ }
  w.imprimirPDF()
  w.guardarPDF()
  assert.equal(calls, 2)
})

test('cursor selects the group and unified rows work in all group types', async (t) => {
  const w = await editor(t)
  for (const group of groups(w)) {
    const field = group.querySelector('[data-rows] textarea')
    const initial = rows(group).length
    field.focus()
    assert.equal(w.getActiveGroup(), group)
    const source = field.closest('tr')
    w.addRowToActiveGroup()
    assert.equal(rows(group).length, initial + 1)
    const added = source.nextElementSibling
    assert.equal(w.getActiveRow(), added)
    assert.equal(added.querySelectorAll('textarea').length, 2)
    assert.equal(Boolean(added.querySelector('.material-tipo')), group.dataset.groupKind === 'materials')
    w.removeActiveRow()
    assert.equal(rows(group).length, initial)
    assert.equal(source.isConnected, true)
  }
  w.addGroup()
  const custom = w.getActiveGroup()
  w.addRowToActiveGroup()
  assert.equal(rows(custom).length, 2)
  w.removeActiveRow()
  w.removeActiveRow()
  assert.equal(rows(custom).length, 0)
  w.addRowToActiveGroup()
  assert.equal(rows(custom).length, 1)
})

test('new groups precede materials and manual order can be moved, restored and undone', async (t) => {
  const w = await editor(t)
  const materials = w.getMaterialsGroup()
  assert.equal(groups(w).at(-1), materials)
  w.setActiveGroup(materials)
  w.addGroup()
  const motor = w.getActiveGroup()
  assert.equal(motor.nextElementSibling, materials)
  const before = titles(w)
  w.moveActiveGroup(-1)
  assert.notDeepEqual(titles(w), before)
  assert.equal(w.restoreUndoSnapshot(), true)
  assert.deepEqual(titles(w), before)
  w.setActiveGroup(w.getMaterialsGroup())
  w.moveActiveGroup(-1)
  const ordered = titles(w)
  const data = w.rpFichasAutosaveTecnica.collectDraftData({ includeMedia: true })
  w.rpFichasAutosaveTecnica.restoreDraftData(data)
  assert.deepEqual(titles(w), ordered)
})

test('draft restores added/deleted general rows and empty materials without losing values', async (t) => {
  const w = await editor(t)
  w.document.getElementById('tec_marca').focus()
  w.removeActiveRow()
  w.addRowToActiveGroup()
  const fields = w.getActiveRow().querySelectorAll('textarea')
  fields[0].value = 'TRANSMISION'
  fields[1].value = 'AUTOMATICA'
  w.setActiveGroup(w.getMaterialsGroup())
  w.removeActiveRow()
  const data = w.rpFichasAutosaveTecnica.collectDraftData({ includeMedia: true })
  w.rpFichasAutosaveTecnica.restoreDraftData(data)
  assert.equal(w.document.getElementById('tec_marca'), null)
  assert.equal(rows(w.getMaterialsGroup()).length, 0)
  const restored = w.rpFichasAutosaveTecnica.collectDraftData({ includeMedia: true })
  const general = restored.layout.find((item) => item.kind === 'general')
  const added = general.filas.find((row) => row.caracteristica === 'TRANSMISION')
  assert.equal(added.valor, 'AUTOMATICA')
  assert.equal(JSON.stringify(restored), JSON.stringify(data))
})

test('exact PDF restoration recreates deleted built-in groups with their values', async (t) => {
  const w = await editor(t)
  const autosave = w.rpFichasAutosaveTecnica
  w.document.getElementById('tec_marca').value = 'MARCA DEL PDF'
  w.document.querySelector('.material-tipo').value = 'MATERIAL DEL PDF'
  const data = autosave.collectDraftData({ includeMedia: true })
  w.document.querySelector('[data-group-kind="general"]').remove()
  w.getMaterialsGroup().remove()
  autosave.restoreDraftData(data, { exactLayout: true })
  assert.equal(w.document.getElementById('tec_marca').value, 'MARCA DEL PDF')
  assert.equal(w.document.querySelector('.material-tipo').value, 'MATERIAL DEL PDF')
  assert.equal(JSON.stringify(autosave.collectDraftData({ includeMedia: true })), JSON.stringify(data))
})

test('exact PDF restoration does not add groups absent from the imported layout', async (t) => {
  const w = await editor(t)
  const autosave = w.rpFichasAutosaveTecnica
  const data = autosave.collectDraftData({ includeMedia: true })
  data.layout = data.layout.filter((item) => item.kind !== 'general' && item.kind !== 'materials')
  autosave.restoreDraftData(data, { exactLayout: true })
  assert.equal(w.document.querySelector('[data-group-kind="general"]'), null)
  assert.equal(w.getMaterialsGroup(), null)
  assert.ok(groups(w).length > 0)
})

test('imports put materials last', async (t) => {
  const w = await editor(t)
  w.rpChatGptImporterTecnica.applyImport({
    cabecera: {}, caracteristicasGenerales: {},
    grupos: [{ titulo: 'MOTOR', filas: [{ caracteristica: 'CILINDROS', valor: '6' }] }],
    filtrosMateriales: [{ tipo: 'ACEITE', cantidadUnidad: '10 L' }],
  })
  assert.equal(groups(w).at(-1), w.getMaterialsGroup())
  assert.ok(titles(w).includes('MOTOR'))
})

test('autosave retains structural edits and custom general data on otherwise empty sheets', async (t) => {
  const w = await editor(t)
  const autosave = w.rpFichasAutosaveTecnica
  autosave.saveNow()
  assert.equal(w.localStorage.getItem(autosave.draftKey), null)
  w.setActiveGroup(w.getMaterialsGroup())
  w.moveActiveGroup(-1)
  autosave.saveNow()
  assert.ok(w.localStorage.getItem(autosave.draftKey))
  w.document.getElementById('tec_marca').focus()
  w.addRowToActiveGroup()
  const fields = w.getActiveRow().querySelectorAll('textarea')
  fields[0].value = 'DATO PERSONALIZADO'
  fields[1].value = 'VALOR PERSONALIZADO'
  autosave.saveNow()
  const draft = JSON.parse(w.localStorage.getItem(autosave.draftKey))
  const general = draft.data.layout.find((item) => item.kind === 'general')
  assert.ok(general.filas.some((row) => row.valor === 'VALOR PERSONALIZADO'))
})

test('general group keeps its identity when all original rows are removed', async (t) => {
  const w = await editor(t)
  const general = w.document.querySelector('[data-group-kind="general"]')
  w.setActiveGroup(general)
  while (rows(general).length) w.removeActiveRow()
  w.addRowToActiveGroup()
  w.getActiveRow().querySelectorAll('textarea')[0].value = 'CAMPO NUEVO'
  w.getActiveRow().querySelectorAll('textarea')[1].value = 'VALOR NUEVO'
  const data = w.rpFichasAutosaveTecnica.collectDraftData({ includeMedia: true })
  w.rpFichasAutosaveTecnica.restoreDraftData(data)
  const restored = w.document.querySelector('[data-group-kind="general"]')
  assert.equal(rows(restored).length, 1)
  assert.equal(restored.querySelectorAll('textarea')[1].value, 'VALOR NUEVO')
})

test('older drafts move materials to the end without losing their contents', async (t) => {
  const w = await editor(t)
  w.document.querySelector('.material-tipo').value = 'ACEITE EXISTENTE'
  w.setActiveGroup(w.getMaterialsGroup())
  w.moveActiveGroup(-1)
  const data = w.rpFichasAutosaveTecnica.collectDraftData({ includeMedia: true })
  delete data.layoutVersion
  w.rpFichasAutosaveTecnica.restoreDraftData(data)
  assert.equal(groups(w).at(-1), w.getMaterialsGroup())
  assert.equal(w.document.querySelector('.material-tipo').value, 'ACEITE EXISTENTE')
})

test('print uses current values, flat groups and repeatable headings, leaving editor intact', async (t) => {
  const w = await editor(t)
  w.document.getElementById('tec_marca').value = 'MARCA ACTUAL'
  w.document.getElementById('tec_serie').value = 'BASTIDOR-PDF-001'
  const source = w.document.querySelector('.page').innerHTML
  w.dispatchEvent(new w.Event('beforeprint'))
  const output = w.document.getElementById('technical-print-document')
  assert.ok(output)
  assert.match(output.textContent, /MARCA ACTUAL/)
  assert.match(output.querySelector('.tec-header').textContent, /BASTIDOR-PDF-001/)
  assert.equal(output.querySelectorAll('input, textarea, select, [contenteditable], [data-rows], [data-group], [id]').length, 0)
  const tables = output.querySelectorAll('.technical-print-group')
  assert.equal(tables.length, groups(w).length)
  for (const table of tables) {
    assert.ok(table.tHead.querySelector('.section-title'))
    assert.equal(table.querySelector('table'), null)
  }
  assert.equal(w.document.querySelector('.page').innerHTML, source)
  w.dispatchEvent(new w.Event('afterprint'))
  assert.equal(w.document.getElementById('technical-print-document'), null)
})

test('bastidor is below the internal code, saved and imported with the existing data format', async (t) => {
  const w = await editor(t)
  const field = w.document.getElementById('tec_serie')
  assert.equal(field.closest('table').className, 'tec-header')
  assert.equal(field.closest('tr').previousElementSibling.querySelector('#tec_codigoInterno')?.id, 'tec_codigoInterno')
  assert.equal(field.closest('td').previousElementSibling.textContent, 'Nº bastidor/serie')
  assert.equal(w.document.querySelectorAll('#tec_serie').length, 1)
  w.rpChatGptImporterTecnica.applyImport({
    cabecera: {}, caracteristicasGenerales: { numeroSerieBastidor: 'VIN-IMPORTADO-001' }, grupos: [], filtrosMateriales: [],
  })
  assert.equal(field.value, 'VIN-IMPORTADO-001')
  const autosave = w.rpFichasAutosaveTecnica
  const data = autosave.collectDraftData({ includeMedia: true })
  field.value = ''
  autosave.restoreDraftData(data)
  assert.equal(field.value, 'VIN-IMPORTADO-001')
  assert.equal(w.document.querySelector('[data-group-kind="general"] #tec_serie'), null)
})

test('older general bastidor rows migrate to the header without duplicates or data loss', async (t) => {
  const w = await editor(t)
  const autosave = w.rpFichasAutosaveTecnica
  const data = autosave.collectDraftData({ includeMedia: true })
  delete data.caracteristicasGenerales.numeroSerieBastidor
  data.layout.find((item) => item.kind === 'general').filas.splice(2, 0, {
    caracteristica: 'NUMERO DE SERIE/BASTIDOR', valor: 'BASTIDOR-ANTERIOR-001', fieldId: 'tec_serie', editable: false,
  })
  autosave.restoreDraftData(data)
  assert.equal(w.document.querySelectorAll('#tec_serie').length, 1)
  assert.equal(w.document.querySelector('.tec-header #tec_serie').value, 'BASTIDOR-ANTERIOR-001')
  assert.equal(rows(w.document.querySelector('[data-group-kind="general"]')).length, 8)
  assert.equal(autosave.collectDraftData().caracteristicasGenerales.numeroSerieBastidor, 'BASTIDOR-ANTERIOR-001')
})
