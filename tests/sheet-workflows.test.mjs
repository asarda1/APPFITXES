import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { JSDOM, VirtualConsole } from 'jsdom'

async function editor(t, type) {
  const maintenance = type === 'mantenimiento'
  const root = new URL(maintenance ? '../public/maintenance-sheet-builder/' : '../public/machinery-spec-sheet-builder/', import.meta.url)
  const html = readFileSync(new URL(maintenance ? 'fichas.html' : 'ficha-tecnica.html', root), 'utf8')
  const errors = []
  const virtualConsole = new VirtualConsole()
  virtualConsole.on('jsdomError', (error) => { if (error.type !== 'css-parsing') errors.push(error.message) })
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole })
  const w = dom.window
  w.HTMLElement.prototype.scrollIntoView = function () {}
  w.confirm = () => assert.fail('Import must finish in one click without a confirmation dialog')
  w.fetch = async () => ({ ok: false })
  const observers = []
  const Observer = w.MutationObserver
  w.MutationObserver = class extends Observer { constructor(callback) { super(callback); observers.push(this) } }
  t.after(() => {
    observers.forEach((observer) => observer.disconnect())
    w.close()
    assert.deepEqual(errors, [])
  })
  for (const script of w.document.scripts) {
    if (script.type === 'module') continue
    if (!script.src) w.eval(script.textContent)
    else if (!/maquinaria_completa|mantenimientos(?:_modelos)?\.js/.test(script.src)) {
      w.eval(readFileSync(new URL(script.getAttribute('src').split('?')[0], root), 'utf8'))
    }
  }
  await new Promise((resolve) => w.addEventListener('load', resolve, { once: true }))
  await new Promise((resolve) => w.setTimeout(resolve, 0))
  return w
}

function payload(type) {
  return type === 'tecnica' ? {
    formato: 'RP-FICHAS-V1', tipoFicha: type,
    cabecera: { maquina: 'TRACTOR', codigoInterno: 'TEST-IMPORT' },
    caracteristicasGenerales: { numeroSerieBastidor: 'SERIE-TEST' },
    grupos: [{ titulo: 'MOTOR', filas: [{ caracteristica: 'CILINDROS', valor: '6' }] }],
    filtrosMateriales: [{ tipo: 'ACEITE', cantidadUnidad: '10 L' }],
  } : {
    formato: 'RP-FICHAS-V1', tipoFicha: type, mantenimiento: '500 h',
    maquina: { tipoMaquina: 'TRACTOR', codigoInterno: 'TEST-IMPORT', bastidorSerie: 'SERIE-TEST' },
    operaciones: [{ descripcion: 'REVISAR MOTOR', realizada: true }],
    filtrosMateriales: [{ tipo: 'ACEITE', cantidadUnidad: '10 L' }],
  }
}

for (const type of ['tecnica', 'mantenimiento']) {
  test(`${type}: import validates and replaces existing data with one click`, async (t) => {
    const w = await editor(t, type)
    const code = w.document.getElementById(type === 'tecnica' ? 'tec_codigoInterno' : 'codigoInterno')
    code.value = 'ANTIGUO'
    w.document.getElementById('btnImportChatGPT').click()
    const modal = w.document.getElementById('rp-chatgpt-import-modal')
    modal.querySelector('textarea').value = '```json\n' + JSON.stringify(payload(type)) + '\n```'
    const button = modal.querySelector('[data-rp-import]')
    assert.equal(button.textContent, 'Importar')
    button.click()
    assert.equal(code.value, 'TEST-IMPORT')
    assert.equal(modal.classList.contains('is-open'), false)
    assert.equal(modal.querySelector('.rp-import-summary'), null)
    if (type === 'mantenimiento') {
      assert.match(w.document.querySelector('#operaciones textarea').value, /REVISAR MOTOR/)
      assert.equal(w.document.querySelector('#operaciones input[type="checkbox"]').checked, true)
    }
  })

  test(`${type}: malformed or wrong-type imports leave the sheet unchanged`, async (t) => {
    const w = await editor(t, type)
    const code = w.document.getElementById(type === 'tecnica' ? 'tec_codigoInterno' : 'codigoInterno')
    code.value = 'CONSERVAR'
    w.document.getElementById('btnImportChatGPT').click()
    const modal = w.document.getElementById('rp-chatgpt-import-modal')
    for (const text of ['{JSON INVALIDO', JSON.stringify(payload(type === 'tecnica' ? 'mantenimiento' : 'tecnica'))]) {
      modal.querySelector('textarea').value = text
      modal.querySelector('[data-rp-import]').click()
      assert.equal(code.value, 'CONSERVAR')
      assert.equal(modal.classList.contains('is-open'), true)
      assert.ok(modal.querySelector('.rp-import-error').textContent)
    }
  })
}

test('maintenance toolbar exposes two contextual row actions and removes retired exports', async (t) => {
  const w = await editor(t, 'mantenimiento')
  const bar = w.document.querySelector('.acciones-ficha')
  assert.equal(bar.querySelectorAll('#btnAddFila, #btnRemoveFila').length, 2)
  assert.doesNotMatch(bar.textContent, /Añadir operación|Quitar filtro|Quitar operación|Vaciar tabla|proyecto|Vista impresión|Guardar HTML/)
  assert.equal(w.guardarHTMLFicha, undefined)
  assert.equal(w.rpProjectFileMantenimiento, undefined)
  assert.equal(w.rpPrintPreviewMantenimiento, undefined)
  assert.equal(w.document.getElementById('codigoInterno').hasAttribute('placeholder'), false)
  for (const id of ['operaciones', 'filtrosMateriales']) {
    const table = w.document.getElementById(id)
    const first = table.querySelector('tbody tr')
    const fields = first.querySelectorAll('textarea')
    fields[0].value = 'CONSERVAR ' + id
    fields[0].focus()
    w.document.getElementById('btnAddFila').focus()
    w.addActiveMaintenanceRow()
    assert.equal(table.querySelectorAll('tbody tr').length, 2)
    const row = first.nextElementSibling
    assert.equal(row.querySelectorAll('textarea').length, id === 'operaciones' ? 1 : 2)
    w.document.getElementById('btnRemoveFila').focus()
    w.removeActiveMaintenanceRow()
    assert.equal(table.querySelectorAll('tbody tr').length, 1)
    assert.equal(fields[0].value, 'CONSERVAR ' + id)
  }
})

test('maintenance can delete every material row, add again and recover quantities and checkboxes', async (t) => {
  const w = await editor(t, 'mantenimiento')
  const material = w.document.querySelector('#filtrosMateriales textarea')
  material.focus()
  w.removeActiveMaintenanceRow()
  assert.equal(w.document.querySelectorAll('#filtrosMateriales tbody tr').length, 0)
  const autosave = w.rpFichasAutosaveMantenimiento
  const empty = autosave.collectDraftData()
  autosave.restoreDraftData(empty)
  assert.equal(w.document.querySelectorAll('#filtrosMateriales tbody tr').length, 0)
  w.document.querySelector('#operaciones textarea').focus()
  w.addActiveMaintenanceRow()
  const fields = w.document.querySelector('#operaciones tr.is-active-row')
  fields.querySelector('textarea').value = 'COMPROBAR'
  fields.querySelector('input[type="checkbox"]').checked = true
  const data = autosave.collectDraftData()
  autosave.restoreDraftData(data)
  assert.ok(Array.from(w.document.querySelectorAll('#operaciones tbody tr')).some((row) => row.querySelector('textarea').value === 'COMPROBAR' && row.querySelector('input').checked))
})
