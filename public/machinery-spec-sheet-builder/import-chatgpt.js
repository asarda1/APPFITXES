;(function () {
  const EXPECTED_FORMAT = 'RP-FICHAS-V1'
  const EXPECTED_TYPE = 'tecnica'

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
      throw new Error('Aquest JSON correspon a una fitxa de manteniment. Obre la fitxa de manteniment per importar-lo.')
    }
  }

  function normalizeTitle(value) {
    return normalizeImportedValue(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
  }

  function getLegacyRows(payload, titleOptions) {
    if (!Array.isArray(payload.grupos)) return []
    const accepted = titleOptions.map(normalizeTitle)
    const found = payload.grupos.find((group) => accepted.includes(normalizeTitle(group && group.titulo)))
    return found && Array.isArray(found.filas) ? found.filas : []
  }

  function getTechnicalRows(payload, canonicalKey, titleOptions) {
    return getLegacyRows(payload, titleOptions)
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
    if (field instanceof HTMLTextAreaElement && typeof window.autoGrowTextarea === 'function') {
      window.autoGrowTextarea(field)
    }
    try {
      field.dispatchEvent(new Event('input', { bubbles: true }))
      field.dispatchEvent(new Event('change', { bubbles: true }))
    } catch (_) {}
  }

  function hasSignificantContent() {
    const selectors = [
      '#tec_tipoMaquina',
      '#tec_codigoInterno',
      '#tec_marcaModelo',
      '#tec_matricula',
      '#tec_anyo',
      '#tec_marca',
      '#tec_modelo',
      '#tec_serie',
      '#tec_fecha_compra',
      '#tec_valor_compra',
      '#tec_motor',
      '#tec_potencia',
      '#tec_consumo_estimado',
      '#tec_estado',
      '#tec-groups [data-rows] textarea',
    ]
    return selectors.some((selector) => {
      return Array.from(document.querySelectorAll(selector)).some((field) => {
        if ('value' in field) return String(field.value || '').trim()
        return String(field.textContent || '').trim()
      })
    })
  }

  function createKeyValueRow(item) {
    const row = document.createElement('tr')
    const th = document.createElement('th')
    const td = document.createElement('td')
    const key = document.createElement('textarea')
    const val = document.createElement('textarea')

    th.style.width = '35%'
    key.className = 'kv-key-input autogrow'
    key.rows = 1
    key.placeholder = 'Característica'
    val.className = 'autogrow'
    val.rows = 1
    val.placeholder = 'Valor'

    key.value = normalizeImportedValue(item && item.caracteristica)
    val.value = normalizeImportedValue(item && item.valor)

    th.appendChild(key)
    td.appendChild(val)
    row.appendChild(th)
    row.appendChild(td)
    return row
  }

  function findTechnicalGroupByTitle(titleOptions) {
    const accepted = titleOptions.map(normalizeTitle)
    return Array.from(document.querySelectorAll('#tec-groups [data-group]')).find((group) => {
      const title = group.querySelector('.section-title')
      return title && accepted.includes(normalizeTitle(title.textContent))
    })
  }

  function getGroupTitleKey(group) {
    const title = group ? group.querySelector('.section-title') : null
    return normalizeTitle(title ? title.textContent : '')
  }

  function isGeneralTechnicalGroup(group) {
    return Boolean(group && (group.getAttribute('data-group-kind') === 'general' || group.querySelector('#tec_marca, #tec_modelo, #tec_serie')))
  }

  function isDimensionsTechnicalGroup(group) {
    return getGroupTitleKey(group) === 'DIMENSIONES'
  }

  function isMaterialsTitleKey(key) {
    return key === 'FILTRO Y MATERIALES' || key === 'FILTROS Y MATERIALES'
  }

  function isMaterialsTechnicalGroup(group) {
    return Boolean(group && (group.getAttribute('data-group-kind') === 'materials' || isMaterialsTitleKey(getGroupTitleKey(group))))
  }

  function isElectricalTechnicalGroup(group) {
    return getGroupTitleKey(group) === 'SISTEMA ELECTRICO'
  }

  function isFixedTechnicalGroup(group) {
    if (!group) return false
    return isGeneralTechnicalGroup(group) || isDimensionsTechnicalGroup(group) || isMaterialsTechnicalGroup(group) || isElectricalTechnicalGroup(group)
  }

  function getMaterialsTechnicalGroup(container) {
    const root = container || document
    return typeof window.getMaterialsGroup === 'function' ? window.getMaterialsGroup() : $('[data-group-kind="materials"]', root)
  }

  function reorderTechnicalGroups(dynamicGroups, options) {
    const container = document.getElementById('tec-groups')
    if (!container) return

    const config = options || {}
    if (!Array.isArray(dynamicGroups)) {
      const materials = getMaterialsTechnicalGroup(container)
      if (materials) container.appendChild(materials)
      return
    }
    const dimensionsGroup = config.dimensionsGroup || findTechnicalGroupByTitle(['DIMENSIONES'])
    const materialsGroup = config.materialsGroup || getMaterialsTechnicalGroup(container)
    const electricalGroup = config.electricalGroup || findTechnicalGroupByTitle(['SISTEMA ELECTRICO'])
    const dynamicList = Array.isArray(dynamicGroups)
      ? dynamicGroups
      : Array.from(container.querySelectorAll('[data-group]')).filter((group) => {
          return (
            !isGeneralTechnicalGroup(group) &&
            !isDimensionsTechnicalGroup(group) &&
            !isMaterialsTechnicalGroup(group) &&
            !isElectricalTechnicalGroup(group)
          )
        })

    const seen = new Set()
    ;[dimensionsGroup, ...dynamicList, electricalGroup, materialsGroup].forEach((group) => {
      if (!group || seen.has(group)) return
      seen.add(group)
      container.appendChild(group)
    })
  }

  function createImportedTechnicalGroup(title) {
    const table = document.createElement('table')
    table.className = 'no-page-break group'
    table.setAttribute('data-group', '')

    const titleRow = document.createElement('tr')
    const titleCell = document.createElement('td')
    titleCell.className = 'section-title'
    titleCell.contentEditable = 'true'
    titleCell.spellcheck = false
    titleCell.textContent = normalizeImportedValue(title).trim().toUpperCase() || 'NUEVO GRUPO'
    titleRow.appendChild(titleCell)

    const wrapperRow = document.createElement('tr')
    const wrapperCell = document.createElement('td')
    const innerTable = document.createElement('table')
    const tbody = document.createElement('tbody')
    innerTable.setAttribute('style', 'margin:0;border:none;')
    tbody.setAttribute('data-rows', '')
    tbody.appendChild(createKeyValueRow({ caracteristica: '', valor: '' }))

    innerTable.appendChild(tbody)
    wrapperCell.appendChild(innerTable)
    wrapperRow.appendChild(wrapperCell)
    table.appendChild(titleRow)
    table.appendChild(wrapperRow)
    return table
  }

  function fillKeyValueGroup(group, rows) {
    const tbody = group ? $('[data-rows]', group) : null
    if (!tbody) return
    tbody.innerHTML = ''
    const safeRows = Array.isArray(rows) && rows.length ? rows : [{ caracteristica: '', valor: '' }]
    safeRows.forEach((row) => tbody.appendChild(createKeyValueRow(row)))
  }

  function normalizeGroupList(payload) {
    if (Array.isArray(payload.grupos)) {
      return payload.grupos
        .filter((group) => group && typeof group === 'object')
        .map((group) => ({
          titulo: normalizeImportedValue(group.titulo).trim() || 'NUEVO GRUPO',
          filas: Array.isArray(group.filas) ? group.filas : [],
        }))
    }

    const groups = []
    if (Array.isArray(payload.dimensiones)) {
      groups.push({ titulo: 'DIMENSIONES', filas: payload.dimensiones })
    } else {
      const dimensiones = getTechnicalRows(payload, 'dimensiones', ['DIMENSIONES'])
      if (dimensiones.length) groups.push({ titulo: 'DIMENSIONES', filas: dimensiones })
    }

    if (Array.isArray(payload.sistemaElectrico)) {
      groups.push({ titulo: 'SISTEMA ELÉCTRICO', filas: payload.sistemaElectrico })
    } else {
      const sistemaElectrico = getTechnicalRows(payload, 'sistemaElectrico', ['SISTEMA ELECTRICO', 'SISTEMA ELÉCTRICO'])
      if (sistemaElectrico.length) groups.push({ titulo: 'SISTEMA ELÉCTRICO', filas: sistemaElectrico })
    }

    return groups
  }

  function rebuildVariableGroups(groups) {
    const container = document.getElementById('tec-groups')
    if (!container) return

    const existingByTitle = new Map()
    Array.from(container.querySelectorAll('[data-group]')).forEach((group) => {
      if (isGeneralTechnicalGroup(group) || isMaterialsTechnicalGroup(group)) return
      const key = normalizeTitle(group.querySelector('.section-title')?.textContent || '')
      if (key && !existingByTitle.has(key)) {
        existingByTitle.set(key, group)
        group.remove()
      } else {
        group.remove()
      }
    })

    const materialsGroup = getMaterialsTechnicalGroup(container)
    const used = new Set()
    const dynamicGroups = []
    let dimensionsGroup = null
    let electricalGroup = null
    const safeGroups = Array.isArray(groups) ? groups : []

    safeGroups.forEach((groupData) => {
      const title = normalizeImportedValue(groupData && groupData.titulo).trim() || 'NUEVO GRUPO'
      const key = normalizeTitle(title)
      if (isMaterialsTitleKey(key)) return
      if (used.has(key)) return
      used.add(key)

      let group = existingByTitle.get(key)
      if (!group) {
        group = createImportedTechnicalGroup(title)
      }
      const titleCell = group.querySelector('.section-title')
      if (titleCell) titleCell.textContent = title.toUpperCase()
      fillKeyValueGroup(group, groupData && groupData.filas)

      if (key === 'DIMENSIONES') {
        dimensionsGroup = group
      } else if (key === 'SISTEMA ELECTRICO') {
        electricalGroup = group
      } else {
        dynamicGroups.push(group)
      }
    })

    if (!dimensionsGroup) {
      dimensionsGroup = existingByTitle.get('DIMENSIONES') || createImportedTechnicalGroup('DIMENSIONES')
      fillKeyValueGroup(dimensionsGroup, [])
    }
    if (!electricalGroup) {
      electricalGroup = existingByTitle.get('SISTEMA ELECTRICO') || createImportedTechnicalGroup('SISTEMA ELECTRICO')
      fillKeyValueGroup(electricalGroup, [])
    }

    reorderTechnicalGroups(dynamicGroups, {
      dimensionsGroup,
      materialsGroup,
      electricalGroup,
    })
  }

  function createMaterialRow(item) {
    const row = document.createElement('tr')
    const tdType = document.createElement('td')
    const tdQty = document.createElement('td')
    const type = document.createElement('textarea')
    const qty = document.createElement('textarea')

    type.className = 'material-tipo texto-operacion'
    type.placeholder = 'Filtro / material'
    qty.className = 'autogrow cantidad-unidad'
    qty.rows = 1
    qty.placeholder = 'Cantidad / unidad'
    const tipo = normalizeImportedValue(item && item.tipo)
    const cantidad = normalizeImportedValue(item && item.cantidadUnidad)
    type.value = tipo
    qty.value = tipo && !cantidad ? 'Según necesidad' : cantidad

    tdType.appendChild(type)
    tdQty.appendChild(qty)
    row.appendChild(tdType)
    row.appendChild(tdQty)
    return row
  }

  function dedupeMaterials(items) {
    const source = Array.isArray(items) ? items : []
    const seen = new Set()
    const result = []
    source.forEach((item) => {
      const tipo = normalizeImportedValue(item && item.tipo)
      const cantidad = normalizeImportedValue(item && item.cantidadUnidad)
      const key = `${tipo.trim().toLowerCase()}|${cantidad.trim().toLowerCase()}`
      if (!tipo.trim() && !cantidad.trim()) return
      if (seen.has(key)) return
      seen.add(key)
      result.push(item)
    })
    return result
  }

  function rebuildMaterials(items) {
    const group = typeof window.getMaterialsGroup === 'function' ? window.getMaterialsGroup() : $('[data-group-kind="materials"]')
    const tbody = group ? $('[data-rows]', group) : null
    if (!tbody) return
    tbody.innerHTML = ''
    const deduped = dedupeMaterials(items)
    const safeItems = deduped.length ? deduped : [{ tipo: '', cantidadUnidad: '' }]
    safeItems.forEach((item) => tbody.appendChild(createMaterialRow(item)))
  }

  function normalizeTechnicalPayload(payload) {
    return {
      cabecera: payload.cabecera || {},
      caracteristicasGenerales: payload.caracteristicasGenerales || {},
      grupos: normalizeGroupList(payload),
      filtrosMateriales: Array.isArray(payload.filtrosMateriales) ? payload.filtrosMateriales : [],
    }
  }

  function applyImport(payload) {
    const page = $('.page')
    const snapshot = page ? page.innerHTML : ''
    try {
      if (typeof window.saveUndoSnapshot === 'function') window.saveUndoSnapshot()

      const data = normalizeTechnicalPayload(payload)
      const cabecera = data.cabecera
      setValueById('tec_codigoInterno', cabecera.codigoInterno)
      setValueById('tec_tipoMaquina', cabecera.maquina)
      setValueById('tec_marcaModelo', cabecera.marcaModelo)
      setValueById('tec_matricula', cabecera.matricula)
      setValueById('tec_anyo', cabecera.anyo)

      const generales = data.caracteristicasGenerales
      setValueById('tec_marca', generales.marca)
      setValueById('tec_modelo', generales.modelo)
      setValueById('tec_serie', generales.numeroSerieBastidor)
      setValueById('tec_fecha_compra', generales.fechaCompra)
      setValueById('tec_valor_compra', generales.valorCompra)
      setValueById('tec_motor', generales.motor)
      setValueById('tec_potencia', generales.potencia)
      setValueById('tec_consumo_estimado', generales.consumoEstimado)
      setValueById('tec_estado', generales.estado)

      rebuildVariableGroups(data.grupos)
      rebuildMaterials(data.filtrosMateriales)
      reorderTechnicalGroups()

      document.querySelectorAll('textarea').forEach((el) => {
        if (el.classList.contains('rp-chatgpt-import-textarea')) return
        if (typeof window.autoGrowTextarea === 'function') window.autoGrowTextarea(el)
      })
      document.querySelectorAll('[data-photo]').forEach((el) => {
        if (typeof window.wirePhotoBlock === 'function') window.wirePhotoBlock(el)
      })
      if (typeof window.refreshPrintWatermarks === 'function') window.refreshPrintWatermarks()
    } catch (err) {
      if (page && snapshot) {
        page.innerHTML = snapshot
        document.querySelectorAll('[data-photo]').forEach((el) => {
          if (typeof window.wirePhotoBlock === 'function') window.wirePhotoBlock(el)
        })
      }
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

    const autosave = window.rpFichasAutosaveTecnica || null
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
    const before = bar.querySelector('button[onclick="imprimirPDF()"]')
    bar.insertBefore(button, before || null)
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureStyles()
    ensureButton()
    ensureModal()
  })

  window.rpChatGptImporterTecnica = {
    parseImportedJson,
    validatePayload,
    applyImport,
    hasSignificantContent,
    closeModal,
    showError,
    showToast,
  }
  window.reorderTechnicalGroups = reorderTechnicalGroups
  window.addEventListener('load', resetImportTextareaSize)
})()
