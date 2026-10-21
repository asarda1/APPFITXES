// APP FITXES - FEATURE - TEMPLATES
// Sistema de plantillas reutilizables para fichas de mantenimiento.
// Independiente de "Guardar proyecto/Abrir proyecto" (project-file.js) y de
// "Importar ChatGPT" (import-chatgpt.js): una plantilla es una base reutilizable
// (RP-FICHA-TEMPLATE-V1 / .rptemplate), un proyecto es una ficha concreta
// (RP-FICHA-PROJECT-V1 / .rpficha).
;(function () {
  const TEMPLATE_FORMAT = 'RP-FICHA-TEMPLATE-V1'
  const TEMPLATE_VERSION = 1
  const TEMPLATE_TYPE = 'mantenimiento'
  const STORAGE_KEY = 'rpFichasTemplatesMantenimientoV1'
  const STYLE_ID = 'rp-templates-styles-mantenimiento'
  const MODAL_ID = 'rp-templates-modal-mantenimiento'
  const SAVE_MODAL_ID = 'rp-templates-save-modal-mantenimiento'
  const BANNER_ID = 'rp-templates-editor-banner-mantenimiento'
  const FILE_INPUT_ID = 'rp-templates-file-input-mantenimiento'
  const STATUS_ID = 'rp-templates-status-mantenimiento'
  // APP FITXES - FEATURE - TEMPLATES: plantillas preinstaladas (builtin)
  const BUILTIN_FORMAT = 'RP-MAINTENANCE-TEMPLATES-V1'
  const BUILTIN_URL = 'plantillas_genericas.json'

  let editingTemplateId = null
  let editingSnapshot = null
  let builtinTemplates = []
  let builtinLoadPromise = null

  function $(selector, root) {
    return (root || document).querySelector(selector)
  }

  function $all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector))
  }

  function hasText(value) {
    return String(value || '').trim() !== ''
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value || {}))
  }

  function isDataImage(src) {
    return typeof src === 'string' && src.startsWith('data:image/')
  }

  function getAutosave() {
    return window.rpFichasAutosaveMantenimiento || null
  }

  function firmaSrc() {
    const img = document.getElementById('firmaImg')
    if (!img) return ''
    const src = img.getAttribute('src') || img.src || ''
    return isDataImage(src) ? src : ''
  }

  // ---------------------------------------------------------------------
  // Almacenamiento (localStorage: privado de este navegador/usuario).
  // Para compartir plantillas entre companys/ordinadors: "Exportar" descarga
  // un fichero .rptemplate que se puede colocar en la carpeta compartida de
  // OneDrive (o enviar) y luego "Importar plantilla" en otro ordenador.
  // ---------------------------------------------------------------------

  function loadTemplateRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const list = JSON.parse(raw)
      if (!Array.isArray(list)) return []
      return list.filter((item) => item && typeof item === 'object' && item.id && item.data)
    } catch (_) {
      return []
    }
  }

  function loadTemplates() {
    return loadTemplateRecords().filter((item) => !item.deleted)
  }

  function saveTemplates(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
      return true
    } catch (_) {
      return false
    }
  }

  function genId() {
    return 'tpl_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
  }

  // ---------------------------------------------------------------------
  // Plantillas preinstaladas (builtin): vienen empaquetadas con la app en
  // plantillas_genericas.json (fuente: docs/plantillas-genericas-mantenimiento/*.pdf).
  // Son las mismas para todos los usuarios porque el fichero se sincroniza con
  // el resto del código de APP FITXES vía OneDrive: no dependen de localStorage
  // ni de importar nada a mano. Se cargan una sola vez (fetch) y se cachean.
  // ---------------------------------------------------------------------

  function normalizeBuiltinTemplate(raw) {
    if (!raw || typeof raw !== 'object' || !raw.id || !raw.data) return null
    return {
      id: raw.id,
      nombre: String(raw.nombre || raw.id),
      tipoFicha: raw.tipoFicha || TEMPLATE_TYPE,
      builtin: true,
      mantenimiento: raw.mantenimiento || raw.data.mantenimiento || '',
      tipoMaquina: raw.tipoMaquina || (raw.data.maquina && raw.data.maquina.tipoMaquina) || '',
      data: raw.data,
    }
  }

  function loadBuiltinTemplates() {
    if (builtinLoadPromise) return builtinLoadPromise
    builtinLoadPromise = fetch(BUILTIN_URL, { cache: 'no-cache' })
      .then((res) => (res && res.ok ? res.json() : null))
      .then((json) => {
        if (!json || json.formato !== BUILTIN_FORMAT || !Array.isArray(json.plantillas)) {
          builtinTemplates = []
          return builtinTemplates
        }
        builtinTemplates = json.plantillas.map(normalizeBuiltinTemplate).filter(Boolean)
        return builtinTemplates
      })
      .catch(() => {
        builtinTemplates = []
        return builtinTemplates
      })
    return builtinLoadPromise
  }

  function findTemplateById(id) {
    return getCombinedTemplates().find((item) => item.id === id) || null
  }

  // ---------------------------------------------------------------------
  // Construccion de datos de plantilla a partir de la ficha actual.
  // ---------------------------------------------------------------------

  function blankIdentifyingFields(data) {
    const clean = deepClone(data)
    clean.maquina = clean.maquina || {}
    clean.maquina.codigoInterno = ''
    clean.maquina.matricula = ''
    clean.maquina.bastidorSerie = ''
    clean.maquina.horasTrabajoKilometros = ''
    return clean
  }

  function resetOperationsChecklist(data) {
    const clean = deepClone(data)
    clean.operaciones = (clean.operaciones || []).map((row) => ({
      descripcion: row && row.descripcion ? row.descripcion : '',
      realizada: false,
    }))
    return clean
  }

  // Una plantilla representa un mantenimiento PENDIENTE de realizar y nunca
  // debe incluir datos identificativos de una unidad concreta (codigo, matricula,
  // bastidor, horas/km). Se aplica tanto al guardar como al usar (defensa ante
  // plantillas importadas de otro usuario).
  function sanitizeTemplateData(data) {
    return resetOperationsChecklist(blankIdentifyingFields(data))
  }

  function buildTemplateDataFromSheet(options) {
    const autosave = getAutosave()
    const conservarFirma = Boolean(options && options.conservarFirma)
    const base = autosave && typeof autosave.collectDraftData === 'function'
      ? deepClone(autosave.collectDraftData({ includeMedia: true }))
      : {}
    base.firma = conservarFirma ? firmaSrc() : ''
    return sanitizeTemplateData(base)
  }

  function forcePersistDraft(autosave) {
    if (!autosave || !autosave.draftKey || typeof autosave.collectDraftData !== 'function') return
    try {
      const draft = {
        version: 1,
        updatedAt: new Date().toISOString(),
        data: autosave.collectDraftData({ includeMedia: true }),
      }
      localStorage.setItem(autosave.draftKey, JSON.stringify(draft))
    } catch (_) {}
  }

  function currentSheetHasData() {
    const autosave = getAutosave()
    if (autosave && typeof autosave.hasMeaningfulDraftData === 'function') {
      return autosave.hasMeaningfulDraftData()
    }
    return false
  }

  // ---------------------------------------------------------------------
  // CRUD de plantillas.
  // ---------------------------------------------------------------------

  function createTemplateRecord(nombre, data) {
    const now = new Date().toISOString()
    return {
      id: genId(),
      nombre: String(nombre || '').trim() || 'Plantilla sin nombre',
      tipoFicha: TEMPLATE_TYPE,
      mantenimiento: data.mantenimiento || '',
      tipoMaquina: (data.maquina && data.maquina.tipoMaquina) || '',
      createdAt: now,
      updatedAt: now,
      data,
    }
  }

  function saveNewTemplate(nombre, conservarFirma) {
    const data = buildTemplateDataFromSheet({ conservarFirma })
    const list = loadTemplateRecords()
    list.push(createTemplateRecord(nombre, data))
    if (!saveTemplates(list)) {
      showStatus('No se ha podido guardar la plantilla.', true)
      return
    }
    showStatus('Plantilla guardada')
    renderList()
  }

  function usarPlantilla(id) {
    const record = findTemplateById(id)
    if (!record) return
    if (currentSheetHasData()) {
      const ok = window.confirm('La ficha actual contiene datos. ¿Reemplazar el contenido con la plantilla "' + record.nombre + '"?')
      if (!ok) return
    }
    const autosave = getAutosave()
    if (!autosave || typeof autosave.restoreDraftData !== 'function') return
    const data = sanitizeTemplateData(record.data)
    if (typeof autosave.suspendAutosave === 'function') autosave.suspendAutosave()
    try {
      autosave.restoreDraftData(data)
    } finally {
      if (typeof autosave.resumeAutosave === 'function') autosave.resumeAutosave()
    }
    // APP FITXES - FEATURE - TEMPLATES: usar una plantilla crea una ficha nueva;
    // a partir de aqui Autosave la trata como una ficha normal (fuerza el primer guardado).
    // Nota: saveNow() por si solo no basta aqui porque restoreDraftData() ya actualiza
    // la firma interna de "ultimo guardado" del autosave, así que un saveNow()
    // inmediatamente despues lo vería como "sin cambios" y no escribiría nada.
    // Se escribe el borrador directamente, igual que hace project-file.js al abrir un proyecto.
    forcePersistDraft(autosave)
    closeModal()
    showStatus('Plantilla aplicada · rellena código, matrícula y bastidor')
  }

  function ensureBannerStyles() {
    ensureStyles()
  }

  function editarPlantilla(id) {
    const record = findTemplateById(id)
    if (!record) return
    const autosave = getAutosave()
    if (!autosave || typeof autosave.collectDraftData !== 'function' || typeof autosave.restoreDraftData !== 'function') return

    if (editingTemplateId) exitEditorMode()
    editingTemplateId = id
    editingSnapshot = deepClone(autosave.collectDraftData({ includeMedia: true }))

    if (typeof autosave.suspendAutosave === 'function') autosave.suspendAutosave()
    autosave.restoreDraftData(deepClone(record.data))

    closeModal()
    showEditorBanner(record.nombre)
  }

  function guardarCambiosPlantilla() {
    if (!editingTemplateId) return
    const record = findTemplateById(editingTemplateId)
    const list = loadTemplateRecords()
    const idx = list.findIndex((item) => item.id === editingTemplateId)
    if (!record) {
      cancelarEdicionPlantilla()
      return
    }
    // Conserva lo que haya en la ficha en ese momento (el usuario puede haber
    // anadido o quitado la firma con los controles normales mientras editaba).
    const data = buildTemplateDataFromSheet({ conservarFirma: true })
    const updated = Object.assign({}, record, {
      mantenimiento: data.mantenimiento || '',
      tipoMaquina: (data.maquina && data.maquina.tipoMaquina) || '',
      updatedAt: new Date().toISOString(),
      data,
    })
    if (idx === -1) list.push(updated)
    else list[idx] = updated
    if (!saveTemplates(list)) {
      showStatus('No se han podido guardar los cambios de la plantilla.', true)
      return
    }
    exitEditorMode()
    showStatus('Plantilla actualizada')
  }

  function cancelarEdicionPlantilla() {
    exitEditorMode()
  }

  function exitEditorMode() {
    const autosave = getAutosave()
    if (autosave && editingSnapshot && typeof autosave.restoreDraftData === 'function') {
      autosave.restoreDraftData(deepClone(editingSnapshot))
      forcePersistDraft(autosave)
    }
    if (autosave && typeof autosave.resumeAutosave === 'function') autosave.resumeAutosave()
    editingTemplateId = null
    editingSnapshot = null
    removeEditorBanner()
  }

  function eliminarPlantilla(id) {
    const list = loadTemplateRecords()
    const record = findTemplateById(id)
    if (!record) return
    const ok = window.confirm('¿Eliminar esta plantilla?\n\n"' + record.nombre + '"')
    if (!ok) return
    const remaining = list.filter((item) => item.id !== id)
    if (record.builtin || builtinTemplates.some((item) => item.id === id)) {
      remaining.push({ id, deleted: true, data: {} })
    }
    if (!saveTemplates(remaining)) {
      showStatus('No se ha podido eliminar la plantilla.', true)
      return
    }
    showStatus('Plantilla eliminada')
    renderList()
  }

  function slugFilename(text) {
    return String(text || 'plantilla')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase() || 'PLANTILLA'
  }

  function exportarPlantilla(id) {
    const record = findTemplateById(id)
    if (!record) return
    const file = {
      formato: TEMPLATE_FORMAT,
      version: TEMPLATE_VERSION,
      tipoFicha: TEMPLATE_TYPE,
      nombre: record.nombre,
      savedAt: new Date().toISOString(),
      data: record.data,
    }
    const text = JSON.stringify(file, null, 2)
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = slugFilename(record.nombre) + '.rptemplate'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function validateTemplateFile(file) {
    if (!file || typeof file !== 'object') {
      throw new Error('El archivo no es una plantilla válida de APP FITXES.')
    }
    if (file.formato === 'RP-FICHA-PROJECT-V1' || file.formato === 'RP-FICHAS-V1') {
      throw new Error('Este archivo es un proyecto/ficha, no una plantilla (.rptemplate).')
    }
    if (file.formato !== TEMPLATE_FORMAT) {
      throw new Error('El archivo no es una plantilla válida de APP FITXES.')
    }
    if (file.tipoFicha !== TEMPLATE_TYPE) {
      throw new Error('Esta plantilla corresponde a otro tipo de ficha.')
    }
    if (!file.data || typeof file.data !== 'object') {
      throw new Error('El archivo no es una plantilla válida de APP FITXES.')
    }
    return true
  }

  function importarPlantillaTexto(text) {
    let file
    try {
      file = JSON.parse(String(text || ''))
      validateTemplateFile(file)
    } catch (err) {
      showStatus(err && err.message ? err.message : 'No se ha podido leer la plantilla.', true)
      return
    }
    const list = loadTemplateRecords()
    let nombre = String(file.nombre || 'Plantilla importada').trim() || 'Plantilla importada'
    if (list.some((item) => item.nombre === nombre)) nombre += ' (importada)'
    list.push(createTemplateRecord(nombre, sanitizeTemplateData(file.data)))
    if (!saveTemplates(list)) {
      showStatus('No se ha podido guardar la plantilla importada.', true)
      return
    }
    showStatus('Plantilla importada')
    renderList()
  }

  // ---------------------------------------------------------------------
  // UI: estilos, modal principal, dialogo "Guardar como plantilla" y banner
  // de edicion. Sigue la misma convencion visual (acento naranja RAL 1007)
  // que el resto de modales de la app (project-file.js, import-chatgpt.js).
  // ---------------------------------------------------------------------

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = [
      '@media print{.no-print,.rp-templates-overlay,.rp-templates-editor-banner,.rp-templates-status{display:none !important;visibility:hidden !important;}body.rp-templates-editing{padding-top:0 !important;}}',
      'body.rp-templates-editing{padding-top:48px;}',
      '.rp-templates-status{font-size:12px;color:#475569;font-weight:800;margin-left:4px;}',
      '.rp-templates-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.38);box-sizing:border-box;}',
      '.rp-templates-dialog{width:min(640px,calc(100vw - 32px));max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:#fff;border:1px solid rgba(242,169,0,.55);border-radius:12px;box-shadow:0 24px 80px rgba(15,23,42,.24);font-family:inherit;color:#111827;overflow:hidden;}',
      '.rp-templates-dialog header{padding:16px 18px;border-bottom:1px solid #eef0f3;background:linear-gradient(90deg,#fff,#fff8e8);display:flex;align-items:center;justify-content:space-between;gap:12px;}',
      '.rp-templates-dialog h2{margin:0;font-size:18px;line-height:1.2;}',
      '.rp-templates-head-actions{display:flex;gap:8px;flex-wrap:wrap;}',
      '.rp-templates-search-row{padding:10px 18px;border-bottom:1px solid #eef0f3;}',
      '.rp-templates-search{width:100%;box-sizing:border-box;padding:8px 12px;border:1px solid #d1d5db;border-radius:999px;font:inherit;}',
      '.rp-templates-search:focus{outline:2px solid rgba(242,169,0,.45);outline-offset:1px;}',
      '.rp-templates-body{padding:12px 18px;overflow:auto;font-size:13px;line-height:1.45;}',
      '.rp-templates-empty{padding:24px 4px;text-align:center;color:#6b7280;}',
      '.rp-templates-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border-bottom:1px solid #eef0f3;padding:10px 2px;}',
      '.rp-templates-row-info{min-width:0;}',
      '.rp-templates-row-name{font-weight:900;font-size:14px;}',
      '.rp-templates-badge{display:inline-block;margin-left:8px;padding:1px 8px;border-radius:999px;background:#fff8e8;border:1px solid rgba(242,169,0,.55);color:#8a5a00;font-size:10px;font-weight:800;letter-spacing:.3px;text-transform:uppercase;vertical-align:middle;}',
      '.rp-templates-row-meta{color:#6b7280;font-size:12px;margin-top:2px;}',
      '.rp-templates-row-actions{display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0;}',
      '.rp-templates-row-actions button{border:1px solid #d1d5db;background:#fff;color:#111827;border-radius:999px;padding:6px 10px;font-weight:800;cursor:pointer;font-size:12px;}',
      '.rp-templates-row-actions .primary{border-color:#f2a900;background:#f2a900;color:#000;}',
      '.rp-templates-row-actions .danger{border-color:#fca5a5;color:#991b1b;}',
      '@media(max-width:640px){.rp-templates-row-info{flex-basis:100%;}.rp-templates-row-actions{flex-shrink:1;}.rp-templates-row-name{overflow-wrap:anywhere;}}',
      '.rp-templates-actions{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #eef0f3;}',
      '.rp-templates-actions button{border:1px solid #d1d5db;background:#fff;color:#111827;border-radius:999px;padding:8px 12px;font-weight:800;cursor:pointer;}',
      '.rp-templates-actions .primary{border-color:#f2a900;background:#f2a900;color:#000;}',
      '.rp-templates-close{border:0;background:transparent;font-size:20px;line-height:1;cursor:pointer;color:#6b7280;padding:4px 6px;}',
      '.rp-templates-field{margin-bottom:12px;}',
      '.rp-templates-field label{display:block;font-weight:800;margin-bottom:4px;}',
      '.rp-templates-field input[type="text"]{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;font:inherit;}',
      '.rp-templates-checkbox{display:flex;align-items:center;gap:8px;font-weight:700;}',
      '.rp-templates-error{padding:10px;border:1px solid #fecaca;background:#fef2f2;color:#991b1b;font-weight:800;border-radius:8px;margin-bottom:10px;}',
      '.rp-templates-editor-banner{position:fixed;top:0;left:0;right:0;z-index:99997;display:flex;align-items:center;justify-content:center;gap:14px;padding:10px 16px;background:#f2a900;color:#111827;font-weight:900;box-shadow:0 6px 18px rgba(15,23,42,.2);}',
      '.rp-templates-editor-banner button{border:1px solid rgba(0,0,0,.25);background:#fff;color:#111827;border-radius:999px;padding:6px 14px;font-weight:800;cursor:pointer;}',
      '.rp-templates-editor-banner button.primary{background:#111827;color:#fff;border-color:#111827;}',
    ].join('')
    document.head.appendChild(style)
  }

  function closeModal() {
    const existing = document.getElementById(MODAL_ID)
    if (existing) existing.remove()
  }

  function closeSaveModal() {
    const existing = document.getElementById(SAVE_MODAL_ID)
    if (existing) existing.remove()
  }

  function formatUpdatedAt(iso) {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
    } catch (_) {
      return ''
    }
  }

  function templateMetaLine(record) {
    const parts = [record.mantenimiento, record.tipoMaquina].filter(hasText)
    const meta = parts.join(' · ')
    if (record.builtin) return meta
    const when = formatUpdatedAt(record.updatedAt)
    return [meta, when ? 'Modificada ' + when : ''].filter(Boolean).join(' — ')
  }

  function normalizeSearchText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
  }

  // APP FITXES - FEATURE - TEMPLATES: PREINSTALADAS (builtin, desde
  // plantillas_genericas.json, iguales para todos los usuarios) + PERSONALES
  // (localStorage, creadas por "Guardar como plantilla"), combinadas en una
  // sola biblioteca, ordenadas alfabéticamente por nombre.
  function getCombinedTemplates() {
    // Local records override packaged templates; deletion markers survive reloads.
    const records = new Map(builtinTemplates.map((record) => [record.id, record]))
    loadTemplateRecords().forEach((record) => records.set(record.id, record))
    return Array.from(records.values()).filter((record) => !record.deleted)
  }

  function renderList(filterText) {
    const body = document.querySelector('#' + MODAL_ID + ' [data-rp-templates-list]')
    if (!body) return
    const query = normalizeSearchText(filterText)
    let list = getCombinedTemplates()
    if (query) {
      list = list.filter((record) => normalizeSearchText(record.nombre).includes(query))
    }
    list = list.slice().sort((a, b) => normalizeSearchText(a.nombre).localeCompare(normalizeSearchText(b.nombre), 'es'))
    body.innerHTML = ''
    if (!list.length) {
      const empty = document.createElement('div')
      empty.className = 'rp-templates-empty'
      empty.textContent = query
        ? 'No se encuentran plantillas para "' + filterText + '".'
        : 'Todavía no hay plantillas guardadas. Usa "+ Nueva plantilla" para crear la primera.'
      body.appendChild(empty)
      return
    }
    list.forEach((record) => {
      const row = document.createElement('div')
      row.className = 'rp-templates-row'
      row.dataset.templateId = record.id

      const info = document.createElement('div')
      info.className = 'rp-templates-row-info'
      const name = document.createElement('div')
      name.className = 'rp-templates-row-name'
      name.textContent = record.nombre
      const meta = document.createElement('div')
      meta.className = 'rp-templates-row-meta'
      meta.textContent = templateMetaLine(record)
      info.append(name, meta)

      const actions = document.createElement('div')
      actions.className = 'rp-templates-row-actions'

      const use = document.createElement('button')
      use.type = 'button'
      use.className = 'primary'
      use.textContent = 'USAR'
      use.addEventListener('click', () => usarPlantilla(record.id))
      actions.append(use)

      const edit = document.createElement('button')
      edit.type = 'button'
      edit.textContent = 'EDITAR'
      edit.addEventListener('click', () => editarPlantilla(record.id))

      const exportBtn = document.createElement('button')
      exportBtn.type = 'button'
      exportBtn.textContent = 'EXPORTAR'
      exportBtn.title = 'Descargar como .rptemplate para compartir'
      exportBtn.addEventListener('click', () => exportarPlantilla(record.id))

      const del = document.createElement('button')
      del.type = 'button'
      del.className = 'danger'
      del.textContent = 'ELIMINAR'
      del.addEventListener('click', () => eliminarPlantilla(record.id))

      actions.append(edit, exportBtn, del)

      row.append(info, actions)
      body.appendChild(row)
    })
  }

  function openModal() {
    closeModal()
    ensureStyles()

    const overlay = document.createElement('div')
    overlay.id = MODAL_ID
    overlay.className = 'rp-templates-overlay no-print'

    const dialog = document.createElement('div')
    dialog.className = 'rp-templates-dialog'
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')

    const header = document.createElement('header')
    const title = document.createElement('h2')
    title.textContent = 'PLANTILLAS DE MANTENIMIENTO'
    const headActions = document.createElement('div')
    headActions.className = 'rp-templates-head-actions'

    const importBtn = document.createElement('button')
    importBtn.type = 'button'
    importBtn.textContent = 'Importar plantilla'
    importBtn.addEventListener('click', () => {
      const input = document.getElementById(FILE_INPUT_ID)
      if (input) {
        input.value = ''
        input.click()
      }
    })

    const newBtn = document.createElement('button')
    newBtn.type = 'button'
    newBtn.className = 'primary'
    newBtn.textContent = '+ Nueva plantilla'
    newBtn.addEventListener('click', () => openSaveDialog())

    const close = document.createElement('button')
    close.type = 'button'
    close.className = 'rp-templates-close'
    close.setAttribute('aria-label', 'Cerrar')
    close.textContent = '✕'
    close.addEventListener('click', closeModal)

    headActions.append(importBtn, newBtn)
    header.append(title, headActions, close)

    // APP FITXES - FEATURE - TEMPLATES: buscador simple por nombre.
    // Escribir aquí NO modifica Autosave (el campo vive fuera de .page).
    const searchRow = document.createElement('div')
    searchRow.className = 'rp-templates-search-row'
    const searchInput = document.createElement('input')
    searchInput.type = 'text'
    searchInput.placeholder = 'Buscar…'
    searchInput.className = 'rp-templates-search'
    searchInput.setAttribute('aria-label', 'Buscar plantilla')
    searchInput.addEventListener('input', () => renderList(searchInput.value))
    searchRow.appendChild(searchInput)

    const body = document.createElement('div')
    body.className = 'rp-templates-body'
    body.setAttribute('data-rp-templates-list', '')
    body.textContent = 'Cargando plantillas…'

    dialog.append(header, searchRow, body)
    overlay.appendChild(dialog)
    document.body.appendChild(overlay)

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeModal()
    })

    renderList(searchInput.value)
    loadBuiltinTemplates().then(() => {
      // Puede haberse cerrado el modal (o cambiado la búsqueda) mientras cargaba.
      if (document.getElementById(MODAL_ID)) renderList(searchInput.value)
    })

    setTimeout(() => searchInput.focus(), 0)
  }

  function openSaveDialog() {
    closeSaveModal()
    ensureStyles()

    const overlay = document.createElement('div')
    overlay.id = SAVE_MODAL_ID
    overlay.className = 'rp-templates-overlay no-print'

    const dialog = document.createElement('div')
    dialog.className = 'rp-templates-dialog'
    dialog.style.width = 'min(440px, calc(100vw - 32px))'
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')

    const header = document.createElement('header')
    const title = document.createElement('h2')
    title.textContent = 'Guardar como plantilla'
    const close = document.createElement('button')
    close.type = 'button'
    close.className = 'rp-templates-close'
    close.setAttribute('aria-label', 'Cerrar')
    close.textContent = '✕'
    close.addEventListener('click', closeSaveModal)
    header.append(title, close)

    const body = document.createElement('div')
    body.className = 'rp-templates-body'

    const errorBox = document.createElement('div')
    errorBox.className = 'rp-templates-error'
    errorBox.style.display = 'none'
    body.appendChild(errorBox)

    const field = document.createElement('div')
    field.className = 'rp-templates-field'
    const label = document.createElement('label')
    label.textContent = 'Nombre de la plantilla'
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = 'Ej. Mantenimiento tractora 60.000 km'
    field.append(label, input)
    body.appendChild(field)

    const hasFirma = Boolean(firmaSrc())
    const checkboxWrap = document.createElement('label')
    checkboxWrap.className = 'rp-templates-checkbox'
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = hasFirma
    checkbox.disabled = !hasFirma
    checkboxWrap.append(checkbox, document.createTextNode('Conservar firma en la plantilla' + (hasFirma ? '' : ' (no hay firma en la ficha actual)')))
    body.appendChild(checkboxWrap)

    const actions = document.createElement('div')
    actions.className = 'rp-templates-actions'
    const cancel = document.createElement('button')
    cancel.type = 'button'
    cancel.textContent = 'Cancelar'
    cancel.addEventListener('click', closeSaveModal)
    const confirm = document.createElement('button')
    confirm.type = 'button'
    confirm.className = 'primary'
    confirm.textContent = 'Guardar plantilla'
    confirm.addEventListener('click', () => {
      const nombre = input.value.trim()
      if (!nombre) {
        errorBox.textContent = 'Escribe un nombre para la plantilla.'
        errorBox.style.display = 'block'
        input.focus()
        return
      }
      saveNewTemplate(nombre, checkbox.checked)
      closeSaveModal()
      openModal()
    })
    actions.append(cancel, confirm)

    dialog.append(header, body, actions)
    overlay.appendChild(dialog)
    document.body.appendChild(overlay)
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeSaveModal()
    })
    setTimeout(() => input.focus(), 0)
  }

  function showEditorBanner(nombre) {
    removeEditorBanner()
    ensureBannerStyles()
    const banner = document.createElement('div')
    banner.id = BANNER_ID
    banner.className = 'rp-templates-editor-banner no-print'
    const text = document.createElement('span')
    text.textContent = 'EDITANDO PLANTILLA: ' + nombre
    const cancel = document.createElement('button')
    cancel.type = 'button'
    cancel.textContent = 'Cancelar'
    cancel.addEventListener('click', cancelarEdicionPlantilla)
    const save = document.createElement('button')
    save.type = 'button'
    save.className = 'primary'
    save.textContent = 'Guardar cambios'
    save.addEventListener('click', guardarCambiosPlantilla)
    banner.append(text, save, cancel)
    document.body.appendChild(banner)
    document.body.classList.add('rp-templates-editing')
  }

  function removeEditorBanner() {
    const banner = document.getElementById(BANNER_ID)
    if (banner) banner.remove()
    document.body.classList.remove('rp-templates-editing')
  }

  function showStatus(text, isError) {
    const bar = $('.acciones-ficha')
    if (!bar) return
    let status = document.getElementById(STATUS_ID)
    if (!status) {
      status = document.createElement('span')
      status.id = STATUS_ID
      status.className = 'rp-templates-status no-print'
      bar.appendChild(status)
    }
    status.textContent = text
    status.style.color = isError ? '#991b1b' : ''
  }

  // ---------------------------------------------------------------------
  // Boton de la barra de herramientas.
  // ---------------------------------------------------------------------

  function ensureButton() {
    const bar = $('.acciones-ficha')
    if (!bar || document.getElementById('btnPlantillasMantenimiento')) return
    const button = document.createElement('button')
    button.type = 'button'
    button.id = 'btnPlantillasMantenimiento'
    button.className = 'no-print'
    button.textContent = 'Plantillas PRL'
    button.addEventListener('click', openModal)

    const before = document.getElementById('btnGuardarPDF')
      || Array.from(bar.querySelectorAll('button')).find((btn) => /Guardar PDF/i.test(btn.textContent || ''))
    bar.insertBefore(button, before || null)

    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.id = FILE_INPUT_ID
    fileInput.className = 'no-print'
    fileInput.accept = '.rptemplate,application/json'
    fileInput.style.display = 'none'
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files && event.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => importarPlantillaTexto(reader.result)
      reader.onerror = () => showStatus('No se ha podido leer la plantilla.', true)
      reader.readAsText(file, 'utf-8')
    })
    bar.appendChild(fileInput)
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    if (document.getElementById(SAVE_MODAL_ID)) { closeSaveModal(); return }
    if (document.getElementById(MODAL_ID)) closeModal()
  })

  function init() {
    ensureStyles()
    setTimeout(ensureButton, 0)
    setTimeout(ensureButton, 200)
    setTimeout(ensureButton, 700)
    // Precarga las plantillas preinstaladas para que ya estén listas al abrir el modal.
    loadBuiltinTemplates()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }

  window.rpTemplatesMantenimiento = {
    formato: TEMPLATE_FORMAT,
    version: TEMPLATE_VERSION,
    tipoFicha: TEMPLATE_TYPE,
    loadTemplates,
    saveNewTemplate,
    usarPlantilla,
    editarPlantilla,
    eliminarPlantilla,
    exportarPlantilla,
    importarPlantillaTexto,
    openModal,
    closeModal,
    isEditingTemplate: () => Boolean(editingTemplateId),
    loadBuiltinTemplates,
    getCombinedTemplates,
    findTemplateById,
  }
})()
