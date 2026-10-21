import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { JSDOM, VirtualConsole } from 'jsdom'

const root = new URL('../public/maintenance-sheet-builder/', import.meta.url)
const builtin = JSON.parse(readFileSync(new URL('plantillas_genericas.json', root), 'utf8'))
const TEMPLATE_KEY = 'rpFichasTemplatesMantenimientoV1'
const INTERVAL_KEY = 'rpMaintenanceIntervalsV1'
const defaults = ['Diario', 'Anual', 'Primeras 50h', '500h', '1.000h', '2.000h']

async function editor(t, storage = {}) {
  const errors = [], virtualConsole = new VirtualConsole()
  virtualConsole.on('jsdomError', (error) => { if (error.type !== 'css-parsing') errors.push(error.message) })
  const dom = new JSDOM(readFileSync(new URL('fichas.html', root), 'utf8'), {
    url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole,
  })
  const w = dom.window
  const observers = [], Observer = w.MutationObserver
  w.MutationObserver = class extends Observer { constructor(callback) { super(callback); observers.push(this) } }
  w.HTMLElement.prototype.scrollIntoView = function () {}
  w.confirm = () => true
  w.fetch = async (url) => ({ ok: url === 'plantillas_genericas.json', json: async () => structuredClone(builtin) })
  for (const [key, value] of Object.entries(storage)) w.localStorage.setItem(key, value)
  t.after(() => { observers.forEach((observer) => observer.disconnect()); w.close(); assert.deepEqual(errors, []) })
  for (const script of w.document.scripts) {
    if (script.type === 'module') continue
    if (!script.src) w.eval(script.textContent)
    else if (!/maquinaria_completa|mantenimientos(?:_modelos)?\.js/.test(script.src)) {
      w.eval(readFileSync(new URL(script.getAttribute('src').split('?')[0], root), 'utf8'))
    }
  }
  await new Promise((resolve) => w.addEventListener('load', resolve, { once: true }))
  await w.rpTemplatesMantenimiento.loadBuiltinTemplates()
  await new Promise((resolve) => w.setTimeout(resolve, 0))
  return w
}

function type(w, value) {
  const field = w.document.getElementById('tipoMantenimiento')
  field.focus()
  field.value = value
  field.setSelectionRange(value.length, value.length)
  field.dispatchEvent(new w.Event('input', { bubbles: true }))
  return field
}

function enter(w, field) { field.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })) }
function localTemplate(id) {
  return { id, nombre: id, data: { mantenimiento: '500h', maquina: {}, operaciones: [{ descripcion: 'ORIGINAL ' + id, realizada: false }], filtrosMateriales: [] } }
}

test('all packaged, old personal and new templates offer editing and deletion', async (t) => {
  const w = await editor(t, { [TEMPLATE_KEY]: JSON.stringify([localTemplate('ANTIGUA')]) })
  const api = w.rpTemplatesMantenimiento
  api.saveNewTemplate('NUEVA', false)
  api.openModal()
  const rows = w.document.querySelectorAll('.rp-templates-row')
  assert.equal(rows.length, builtin.plantillas.length + 2)
  for (const row of rows) {
    const labels = Array.from(row.querySelectorAll('button')).map((button) => button.textContent)
    assert.ok(labels.includes('EDITAR'))
    assert.ok(labels.includes('ELIMINAR'))
  }
})

test('packaged template edits persist as one override and restore the current sheet', async (t) => {
  const w = await editor(t), api = w.rpTemplatesMantenimiento
  const id = builtin.plantillas[0].id
  w.document.getElementById('codigoInterno').value = 'MI-FICHA'
  api.editarPlantilla(id)
  w.document.querySelector('#operaciones textarea').value = 'OPERACION MODIFICADA'
  const banner = w.document.querySelector('.rp-templates-editor-banner')
  Array.from(banner.querySelectorAll('button')).find((button) => button.textContent === 'Guardar cambios').click()
  assert.equal(w.document.getElementById('codigoInterno').value, 'MI-FICHA')
  assert.equal(api.findTemplateById(id).data.operaciones[0].descripcion, 'OPERACION MODIFICADA')
  assert.equal(api.getCombinedTemplates().filter((record) => record.id === id).length, 1)
  const reloaded = await editor(t, { [TEMPLATE_KEY]: w.localStorage.getItem(TEMPLATE_KEY) })
  assert.equal(reloaded.rpTemplatesMantenimiento.findTemplateById(id).data.operaciones[0].descripcion, 'OPERACION MODIFICADA')
})

test('deleting a packaged template survives reload and subsequent saves and imports', async (t) => {
  const w = await editor(t), api = w.rpTemplatesMantenimiento
  const id = builtin.plantillas[0].id
  api.eliminarPlantilla(id)
  api.saveNewTemplate('NUEVA', false)
  api.importarPlantillaTexto(JSON.stringify({ formato: api.formato, tipoFicha: 'mantenimiento', nombre: 'IMPORTADA', data: localTemplate('IM').data }))
  assert.equal(api.findTemplateById(id), null)
  const reloaded = await editor(t, { [TEMPLATE_KEY]: w.localStorage.getItem(TEMPLATE_KEY) })
  assert.equal(reloaded.rpTemplatesMantenimiento.findTemplateById(id), null)
  assert.ok(reloaded.rpTemplatesMantenimiento.getCombinedTemplates().some((record) => record.nombre === 'IMPORTADA'))
})

test('older personal templates remain editable and removable independently of the newest', async (t) => {
  const w = await editor(t, { [TEMPLATE_KEY]: JSON.stringify([localTemplate('ANTIGUA'), localTemplate('RECIENTE')]) })
  const api = w.rpTemplatesMantenimiento
  api.editarPlantilla('ANTIGUA')
  w.document.querySelector('#operaciones textarea').value = 'ANTIGUA EDITADA'
  w.document.querySelector('.rp-templates-editor-banner .primary').click()
  assert.equal(api.findTemplateById('ANTIGUA').data.operaciones[0].descripcion, 'ANTIGUA EDITADA')
  api.eliminarPlantilla('ANTIGUA')
  assert.equal(api.findTemplateById('ANTIGUA'), null)
  assert.ok(api.findTemplateById('RECIENTE'))
})

test('cancelling a packaged template edit preserves both the template and the sheet', async (t) => {
  const w = await editor(t), api = w.rpTemplatesMantenimiento
  const id = builtin.plantillas[0].id
  const original = JSON.stringify(api.findTemplateById(id))
  w.document.getElementById('codigoInterno').value = 'CONSERVAR'
  api.editarPlantilla(id)
  w.document.querySelector('#operaciones textarea').value = 'DESCARTAR'
  Array.from(w.document.querySelectorAll('.rp-templates-editor-banner button')).find((button) => button.textContent === 'Cancelar').click()
  assert.equal(JSON.stringify(api.findTemplateById(id)), original)
  assert.equal(w.document.getElementById('codigoInterno').value, 'CONSERVAR')
  assert.equal(api.isEditingTemplate(), false)
})

test('six defaults are ordered and dropdown only opens from its arrow with all options', async (t) => {
  const w = await editor(t), api = w.rpMaintenanceIntervals
  assert.deepEqual(Array.from(api.getOptions()), defaults)
  const field = type(w, 'D'), menu = w.document.getElementById('tipoMantenimientoOpciones')
  field.click()
  assert.equal(menu.hidden, true)
  assert.match(w.document.querySelector('.maintenance-interval-hint').textContent, /Diario/)
  w.document.querySelector('.maintenance-interval-toggle').click()
  assert.equal(menu.hidden, false)
  assert.deepEqual(Array.from(menu.querySelectorAll('[role="option"]')).map((item) => item.textContent), defaults)
  menu.querySelectorAll('[role="option"]')[5].click()
  assert.equal(field.value, '2.000h')
  assert.equal(menu.hidden, true)
})

test('Enter accepts every predefined prefix case-insensitively and allows custom typing', async (t) => {
  const w = await editor(t)
  for (const [prefix, expected] of [['d', 'Diario'], ['D', 'Diario'], ['a', 'Anual'], ['p', 'Primeras 50h'], ['5', '500h'], ['1', '1.000h'], ['2', '2.000h']]) {
    const field = type(w, prefix)
    assert.equal(field.value, prefix)
    enter(w, field)
    assert.equal(field.value, expected)
    assert.equal(w.document.getElementById('tipoMantenimientoPrint').textContent, expected)
  }
  const field = type(w, '1')
  assert.equal(field.value, '1')
  type(w, '1.500h')
  enter(w, field)
  assert.equal(field.value, '1.500h')
  assert.equal(w.document.querySelector('.maintenance-interval-save').hidden, false)
})

test('custom intervals are opt-in, persistent, deduplicated and retained after machine changes', async (t) => {
  const w = await editor(t)
  type(w, '1.500h')
  assert.equal(w.localStorage.getItem(INTERVAL_KEY), null)
  w.document.querySelector('.maintenance-interval-save').click()
  assert.deepEqual(Array.from(w.rpMaintenanceIntervals.getOptions()), defaults.concat('1.500h'))
  w.actualizarIntervalosMantenimientoPorCodigo('MAQUINA-DIFERENTE')
  assert.equal(w.document.getElementById('tipoMantenimiento').value, '1.500h')
  type(w, '1500H')
  assert.equal(w.document.querySelector('.maintenance-interval-save').hidden, true)
  const reloaded = await editor(t, { [INTERVAL_KEY]: w.localStorage.getItem(INTERVAL_KEY) })
  assert.deepEqual(Array.from(reloaded.rpMaintenanceIntervals.getOptions()), defaults.concat('1.500h'))
})

test('dropdown renders the full saved list, tolerates bad storage and preserves blank-sheet autosave', async (t) => {
  const extras = Array.from({ length: 35 }, (_, index) => (index + 3) + '.000h')
  const w = await editor(t, { [INTERVAL_KEY]: JSON.stringify(extras) })
  w.document.querySelector('.maintenance-interval-toggle').click()
  assert.equal(w.document.getElementById('tipoMantenimientoOpciones').children.length, defaults.length + extras.length)
  const clean = await editor(t, { [INTERVAL_KEY]: '{INVALIDO' })
  assert.deepEqual(Array.from(clean.rpMaintenanceIntervals.getOptions()), defaults)
  clean.rpFichasAutosaveMantenimiento.saveNow()
  assert.equal(clean.localStorage.getItem(clean.rpFichasAutosaveMantenimiento.draftKey), null)
})

test('typing after opening the list preserves custom text instead of committing an old highlighted option', async (t) => {
  const w = await editor(t)
  const field = type(w, 'd')
  assert.equal(w.document.querySelector('.maintenance-interval-save').hidden, true)
  w.document.querySelector('.maintenance-interval-toggle').click()
  type(w, '1.500h')
  enter(w, field)
  assert.equal(field.value, '1.500h')
  assert.equal(w.document.getElementById('tipoMantenimientoOpciones').hidden, true)
})

test('remove crosses delete custom intervals without selecting them or changing sheet data', async (t) => {
  const w = await editor(t, { [INTERVAL_KEY]: JSON.stringify(['1.500h', '4.000h']) })
  const field = type(w, 'Diario')
  w.document.querySelector('.maintenance-interval-toggle').click()
  const remove = Array.from(w.document.querySelectorAll('.maintenance-interval-remove')).find((button) => button.title === 'Quitar 1.500h del listado')
  assert.ok(remove)
  remove.click()
  assert.equal(field.value, 'Diario')
  assert.equal(w.document.getElementById('tipoMantenimientoOpciones').hidden, false)
  assert.deepEqual(Array.from(w.rpMaintenanceIntervals.getOptions()), defaults.concat('4.000h'))
  const reloaded = await editor(t, { [INTERVAL_KEY]: w.localStorage.getItem(INTERVAL_KEY) })
  assert.deepEqual(Array.from(reloaded.rpMaintenanceIntervals.getOptions()), defaults.concat('4.000h'))
})

test('predefined intervals can be removed persistently and restored without losing custom entries', async (t) => {
  const w = await editor(t, { [INTERVAL_KEY]: JSON.stringify(['1.500h']) })
  const field = type(w, 'Diario')
  w.document.querySelector('.maintenance-interval-toggle').click()
  w.document.querySelector('[aria-label="Quitar Diario del listado"]').click()
  assert.equal(field.value, 'Diario')
  assert.deepEqual(Array.from(w.rpMaintenanceIntervals.getOptions()), defaults.slice(1).concat('1.500h'))
  assert.equal(w.document.querySelector('.maintenance-interval-save').hidden, false)
  const reloaded = await editor(t, { [INTERVAL_KEY]: w.localStorage.getItem(INTERVAL_KEY) })
  assert.equal(reloaded.rpMaintenanceIntervals.getOptions().includes('Diario'), false)
  type(w, '6.000h')
  w.document.querySelector('.maintenance-interval-save').click()
  assert.deepEqual(Array.from(w.rpMaintenanceIntervals.getOptions()), defaults.slice(1).concat('1.500h', '6.000h'))
  type(w, 'diario')
  w.document.querySelector('.maintenance-interval-save').click()
  assert.deepEqual(Array.from(w.rpMaintenanceIntervals.getOptions()), defaults.concat('1.500h', '6.000h'))
  assert.equal(field.value, 'Diario')
})

test('removing every interval leaves a safe empty dropdown that still accepts new options', async (t) => {
  const w = await editor(t)
  const field = type(w, 'Anual')
  w.document.querySelector('.maintenance-interval-toggle').click()
  while (w.document.querySelector('.maintenance-interval-remove')) w.document.querySelector('.maintenance-interval-remove').click()
  assert.equal(w.rpMaintenanceIntervals.getOptions().length, 0)
  for (const key of ['ArrowDown', 'ArrowUp', 'Enter']) field.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true }))
  assert.equal(field.value, 'Anual')
  assert.equal(field.hasAttribute('aria-activedescendant'), false)
  type(w, '60.000km')
  w.document.querySelector('.maintenance-interval-save').click()
  assert.deepEqual(Array.from(w.rpMaintenanceIntervals.getOptions()), ['60.000km'])
})
