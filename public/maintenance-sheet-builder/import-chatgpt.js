;(function () {
  const EXPECTED_FORMAT = 'RP-FICHAS-V1'
  const EXPECTED_TYPE = 'mantenimiento'

  function $(selector, root) {
    return (root || document).querySelector(selector)
  }

  function normalizeImportedValue(value) {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return ''
  }

  function stripMarkdownFence(text) {
    let value = String(text || '').trim()
    const fence = value.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
    if (fence) return fence[1].trim()
    value = value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    return value
  }

  function extractJsonObject(text) {
    const value = String(text || '')
    const start = value.indexOf('{')
    if (start < 0) return ''
    let depth = 0
    let inString = false
    let escaped = false

    for (let i = start; i < value.length; i += 1) {
      const ch = value[i]
      if (inString) {
        if (escaped) escaped = false
        else if (ch === '\\') escaped = true
        else if (ch === '"') inString = false
        continue
      }
      if (ch === '"') {
        inString = true
        continue
      }
      if (ch === '{') depth += 1
      if (ch === '}') {
        depth -= 1
        if (depth === 0) return value.slice(start, i + 1)
      }
    }
    return ''
  }

  function parseImportedJson(text) {
    const original = String(text || '').trim()
    if (!original) throw new Error("No s'ha pogut interpretar el JSON.")

    const attempts = [original, stripMarkdownFence(original)]
    const extracted = extractJsonObject(attempts[1])
    if (extracted) attempts.push(extracted)

    for (const attempt of attempts) {
      if (!attempt) continue
      try {
        return JSON.parse(attempt)
      } catch (_) {}
    }
    throw new Error("No s'ha pogut interpretar el JSON.")
  }

  function normalizeTipoFicha(value) {
    const type = String(value || '').trim().toLowerCase()
    if (type === 'manteniment') return 'mantenimiento'
    return type
  }

  function validatePayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error("No s'ha pogut interpretar el JSON.")
    }
    if (payload.formato !== EXPECTED_FORMAT) {
      throw new Error('El contingut no correspon al format RP-FICHAS-V1.')
    }
    const type = normalizeTipoFicha(payload.tipoFicha)
    if (!type) throw new Error('Falta el camp tipoFicha.')
    if (type !== EXPECTED_TYPE) {
      throw new Error('Aquest JSON correspon a una fitxa tècnica. Obre la fitxa tècnica per importar-lo.')
    }
  }

  function importedQuantity(item) {
    const tipo = normalizeImportedValue(item && item.tipo)
    const cantidad = normalizeImportedValue(item && item.cantidadUnidad)
    return tipo && !cantidad ? 'Según necesidad' : cantidad
  }

  function setValueById(id, value) {
    const field = document.getElementById(id)
    if (!field) return
    const normalized = normalizeImportedValue(value)
    if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
      field.checked = Boolean(value)
    } else if ('value' in field) {
      field.value = normalized
    } else {
      field.textContent = normalized
    }
    if (field instanceof HTMLTextAreaElement && typeof window.autoResize === 'function') {
      window.autoResize(field)
    }
    try {
      field.dispatchEvent(new Event('input', { bubbles: true }))
      field.dispatchEvent(new Event('change', { bubbles: true }))
    } catch (_) {}
  }

  function hasSignificantContent() {
    const selectors = [
      '#tipoMantenimiento',
      '#tipoMaquina',
      '#marcaModelo',
      '#codigoInterno',
      '#matricula',
      '#bastidor',
      '#horasKm',
      '#observacionesGenerales',
      '#responsable',
      '#fechaFirma',
      '#operaciones tbody textarea',
      '#filtrosMateriales tbody textarea',
    ]
    return selectors.some((selector) => {
      return Array.from(document.querySelectorAll(selector)).some((field) => {
        if ('value' in field) return String(field.value || '').trim()
        return String(field.textContent || '').trim()
      })
    })
  }

  function createImportedOperation(operation) {
    const row = document.createElement('tr')
    const textCell = document.createElement('td')
    const checkCell = document.createElement('td')
    const deleteCell = document.createElement('td')
    const textarea = document.createElement('textarea')
    const checkbox = document.createElement('input')
    const button = document.createElement('button')

    textarea.className = 'texto-operacion'
    textarea.placeholder = 'Descripción de la operación'
    textarea.value = normalizeOperationDescription(operation && operation.descripcion, operation && operation.__index)
    textarea.addEventListener('input', () => {
      if (typeof window.autoResize === 'function') window.autoResize(textarea)
    })

    checkbox.type = 'checkbox'
    checkbox.checked = Boolean(operation && operation.realizada)

    checkCell.className = 'check'
    deleteCell.className = 'delete-cell'
    button.type = 'button'
    button.className = 'delete-btn'
    button.textContent = 'X'
    button.addEventListener('click', () => {
      if (typeof window.deleteOperacion === 'function') window.deleteOperacion(button)
      else row.remove()
    })

    textCell.appendChild(textarea)
    checkCell.appendChild(checkbox)
    deleteCell.appendChild(button)
    row.appendChild(textCell)
    row.appendChild(checkCell)
    row.appendChild(deleteCell)
    return row
  }

  function normalizeOperationDescription(value, index) {
    const text = normalizeImportedValue(value).trim()
    if (!text) return ''
    if (/^\d+\s*(?:-|\.-|\.)\s*/.test(text)) return text
    return `${index}- ${text}`
  }

  function createImportedMaterial(item) {
    const row = document.createElement('tr')
    const typeCell = document.createElement('td')
    const qtyCell = document.createElement('td')
    const deleteCell = document.createElement('td')
    const type = document.createElement('textarea')
    const qty = document.createElement('textarea')
    const button = document.createElement('button')

    type.className = 'material-tipo'
    type.placeholder = 'Filtro / material'
    type.value = normalizeImportedValue(item && item.tipo)
    type.addEventListener('input', () => {
      if (typeof window.autoResize === 'function') window.autoResize(type)
    })

    qty.className = 'cantidad-unidad'
    qty.rows = 1
    qty.placeholder = 'Cantidad / unidad'
    qty.value = importedQuantity(item)
    qty.addEventListener('input', () => {
      if (typeof window.autoResize === 'function') window.autoResize(qty)
    })

    deleteCell.className = 'delete-cell'
    button.type = 'button'
    button.className = 'delete-btn'
    button.textContent = 'X'
    button.addEventListener('click', () => {
      if (typeof window.deleteFiltroMaterial === 'function') window.deleteFiltroMaterial(button)
      else row.remove()
    })

    typeCell.appendChild(type)
    qtyCell.appendChild(qty)
    deleteCell.appendChild(button)
    row.appendChild(typeCell)
    row.appendChild(qtyCell)
    row.appendChild(deleteCell)
    return row
  }

  function rebuildOperations(items) {
    const tbody = $('#operaciones tbody')
    if (!tbody) return
    tbody.innerHTML = ''
    const safeItems = Array.isArray(items) && items.length ? items : [{ descripcion: '', realizada: false }]
    safeItems.forEach((item, index) => tbody.appendChild(createImportedOperation({ ...(item || {}), __index: index + 1 })))
  }

  function rebuildMaterials(items) {
    const tbody = $('#filtrosMateriales tbody')
    if (!tbody) return
    tbody.innerHTML = ''
    const safeItems = Array.isArray(items) && items.length ? items : [{ tipo: '', cantidadUnidad: '' }]
    safeItems.forEach((item) => tbody.appendChild(createImportedMaterial(item)))
  }

  function applyImport(payload) {
    const page = $('.page')
    const snapshot = page ? page.innerHTML : ''
    try {
      const mantenimiento = normalizeImportedValue(payload.mantenimiento)
      const maquina = payload.maquina || {}

      setValueById('codigoInterno', maquina.codigoInterno)
      try {
        if (typeof window.actualizarIntervalosMantenimientoPorCodigo === 'function') {
          window.actualizarIntervalosMantenimientoPorCodigo(normalizeImportedValue(maquina.codigoInterno))
        }
      } catch (_) {}

      setValueById('tipoMantenimiento', mantenimiento)
      setValueById('tipoMaquina', maquina.tipoMaquina)
      setValueById('marcaModelo', maquina.marcaModelo)
      setValueById('matricula', maquina.matricula)
      setValueById('bastidor', maquina.bastidorSerie)
      setValueById('horasKm', maquina.horasTrabajoKilometros)
      setValueById('observacionesGenerales', payload.observacionesGenerales)
      setValueById('responsable', 'Eduardo Noguero Modrego')
      setValueById('fechaFirma', payload.fecha)

      rebuildOperations(payload.operaciones)
      rebuildMaterials(payload.filtrosMateriales)

      document.querySelectorAll('textarea').forEach((el) => {
        if (el.classList.contains('rp-chatgpt-import-textarea')) return
        if (typeof window.autoResize === 'function') window.autoResize(el)
      })
      if (typeof window.syncTipoMantenimientoPrint === 'function') window.syncTipoMantenimientoPrint()
      if (typeof window.preparePrintFooter === 'function') window.preparePrintFooter()
    } catch (err) {
      if (page && snapshot) page.innerHTML = snapshot
      throw err
    }
  }

  function ensureStyles() {
    if (document.getElementById('rp-chatgpt-import-styles')) return
    const style = document.createElement('style')
    style.id = 'rp-chatgpt-import-styles'
    style.textContent = `
      .rp-import-overlay{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;background:rgba(15,23,42,.38);overflow:hidden;}
      .rp-import-overlay.is-open{display:flex;}
      .rp-import-dialog{width:min(900px,95vw);height:min(650px,calc(100vh - 40px));max-height:85vh;display:grid;grid-template-rows:auto minmax(0,1fr) auto;border:1px solid rgba(242,169,0,.55);border-radius:14px;background:#fff;box-shadow:0 24px 80px rgba(15,23,42,.22);overflow:hidden;color:#1f2937;font-family:inherit;box-sizing:border-box;}
      .rp-import-header{min-height:0;padding:16px 18px;border-bottom:1px solid #eef0f3;background:linear-gradient(90deg,#fff,#fff8e8);}
      .rp-import-header h2{margin:0;font-size:18px;line-height:1.2;}
      .rp-import-header p{margin:6px 0 0;color:#6b7280;font-size:13px;}
      .rp-import-body{min-height:0;overflow:hidden;padding:12px;box-sizing:border-box;}
      .rp-chatgpt-import-textarea{display:block;width:100% !important;height:100% !important;min-height:0 !important;max-height:100% !important;box-sizing:border-box;border:1px solid #d1d5db;border-radius:10px;padding:12px;font:13px/1.45 Consolas,Monaco,monospace;resize:none !important;overflow-y:auto !important;overflow-x:auto !important;white-space:pre;}
      .rp-import-error{min-height:20px;margin-top:8px;color:#b91c1c;font-size:13px;font-weight:700;}
      .rp-import-actions{display:flex;justify-content:flex-end;gap:8px;padding:12px;border-top:1px solid #eef0f3;background:#fff;flex-shrink:0;}
      .rp-import-actions button,.rp-import-btn{border:1px solid #d1d5db;background:#fff;color:#111827;border-radius:999px;padding:8px 12px;font-weight:800;cursor:pointer;}
      .rp-import-actions .rp-primary,.rp-import-btn{border-color:#f2a900;background:#f2a900;color:#000;}
      .rp-import-toast{position:fixed;right:18px;bottom:18px;z-index:10000;display:none;border:1px solid rgba(242,169,0,.4);border-radius:999px;background:#fff;padding:10px 14px;box-shadow:0 12px 34px rgba(15,23,42,.16);font-size:13px;font-weight:800;color:#1f2937;}
      .rp-import-toast.is-open{display:block;}
    `
    document.head.appendChild(style)
  }

  function ensureModal() {
    let modal = document.getElementById('rp-chatgpt-import-modal')
    if (modal) return modal
    modal = document.createElement('div')
    modal.id = 'rp-chatgpt-import-modal'
    modal.className = 'rp-import-overlay no-print'
    modal.innerHTML = `
      <div class="rp-import-dialog" role="dialog" aria-modal="true" aria-labelledby="rp-import-title">
        <div class="rp-import-header">
          <h2 id="rp-import-title">Importar dades de ChatGPT</h2>
          <p>Enganxa aquí el bloc RP-FICHAS-V1 generat per ChatGPT.</p>
        </div>
        <div class="rp-import-body">
          <textarea class="rp-chatgpt-import-textarea" spellcheck="false"></textarea>
          <div class="rp-import-error" role="alert"></div>
        </div>
        <div class="rp-import-actions">
          <button type="button" data-rp-clear>Vaciar</button>
          <button type="button" data-rp-cancel>Cancelar</button>
          <button type="button" class="rp-primary" data-rp-import>Importar</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    $('[data-rp-cancel]', modal).addEventListener('click', closeModal)
    $('[data-rp-clear]', modal).addEventListener('click', () => {
      $('.rp-chatgpt-import-textarea', modal).value = ''
      $('.rp-import-error', modal).textContent = ''
      $('.rp-chatgpt-import-textarea', modal).removeAttribute('style')
      $('.rp-chatgpt-import-textarea', modal).focus()
    })
    const textarea = $('.rp-chatgpt-import-textarea', modal)
    ;['beforeinput', 'input', 'change', 'paste', 'keyup'].forEach((eventName) => {
      textarea.addEventListener(eventName, (event) => {
        textarea.style.height = ''
        textarea.style.minHeight = ''
        textarea.style.maxHeight = ''
        event.stopPropagation()
      })
    })
    $('[data-rp-import]', modal).addEventListener('click', runImport)
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal()
    })
    return modal
  }

  function resetImportTextareaSize() {
    const textarea = document.querySelector('.rp-chatgpt-import-textarea')
    if (!textarea) return
    textarea.style.height = ''
    textarea.style.minHeight = ''
    textarea.style.maxHeight = ''
    textarea.style.overflowY = ''
    textarea.style.resize = ''
  }

  function openModal() {
    ensureStyles()
    const modal = ensureModal()
    $('.rp-import-error', modal).textContent = ''
    const textarea = $('.rp-chatgpt-import-textarea', modal)
    if (textarea) textarea.removeAttribute('style')
    resetImportTextareaSize()
    window.__rpImportPreviousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    modal.classList.add('is-open')
    setTimeout(() => $('.rp-chatgpt-import-textarea', modal).focus(), 0)
  }

  function closeModal() {
    const modal = document.getElementById('rp-chatgpt-import-modal')
    if (modal) modal.classList.remove('is-open')
    if (window.__rpImportPreviousBodyOverflow !== undefined) {
      document.body.style.overflow = window.__rpImportPreviousBodyOverflow
      window.__rpImportPreviousBodyOverflow = undefined
    }
  }

  function showError(message) {
    const modal = ensureModal()
    $('.rp-import-error', modal).textContent = message
  }

  function showToast(message) {
    let toast = document.getElementById('rp-chatgpt-import-toast')
    if (!toast) {
      toast = document.createElement('div')
      toast.id = 'rp-chatgpt-import-toast'
      toast.className = 'rp-import-toast no-print'
      document.body.appendChild(toast)
    }
    toast.textContent = message
    toast.classList.add('is-open')
    clearTimeout(window.__rpImportToastTimer)
    window.__rpImportToastTimer = setTimeout(() => toast.classList.remove('is-open'), 2600)
  }

  function runImport() {
    const modal = ensureModal()
    const text = $('.rp-chatgpt-import-textarea', modal).value
    let payload
    try {
      payload = parseImportedJson(text)
      validatePayload(payload)
    } catch (err) {
      showError(err && err.message ? err.message : "No s'ha pogut interpretar el JSON.")
      return
    }

    const autosave = window.rpFichasAutosaveMantenimiento || null
    if (autosave && typeof autosave.suspendAutosave === 'function') autosave.suspendAutosave()
    try {
      applyImport(payload)
    } catch (err) {
      showError(err && err.message ? err.message : "No s'ha pogut importar la fitxa.")
      return
    } finally {
      if (autosave && typeof autosave.resumeAutosave === 'function') autosave.resumeAutosave()
    }

    closeModal()
    showToast('Fitxa importada correctament.')
    setTimeout(() => {
      if (autosave && typeof autosave.saveNow === 'function') autosave.saveNow()
    }, 0)
  }

  function ensureButton() {
    const bar = $('.acciones-ficha')
    if (!bar || document.getElementById('btnImportChatGPT')) return
    const button = document.createElement('button')
    button.type = 'button'
    button.id = 'btnImportChatGPT'
    button.className = 'rp-import-btn'
    button.textContent = 'Importar ChatGPT'
    button.addEventListener('click', openModal)
    bar.insertBefore(button, document.getElementById('btnGuardarPDF') || null)
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureStyles()
    setTimeout(ensureButton, 0)
    setTimeout(ensureButton, 200)
    setTimeout(ensureButton, 700)
    ensureModal()
  })

  window.rpChatGptImporterMantenimiento = {
    parseImportedJson,
    validatePayload,
    applyImport,
    hasSignificantContent,
    closeModal,
    showError,
    showToast,
  }
  window.addEventListener('load', resetImportTextareaSize)
})()
