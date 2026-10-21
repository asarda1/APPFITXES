// APP FITXES - FEATURE BLOCK 1 - AUTOSAVE
;(function () {
  const DRAFT_KEY = 'rpFichasDraftMantenimientoV1'
  const VERSION = 1
  const SAVE_DELAY = 900
  const MAX_MEDIA_CHARS = 1400000

  let saveTimer = null
  let isRestoring = false
  let autosaveSuspended = 0
  let lastSignature = ''

  function $(selector, root) {
    return (root || document).querySelector(selector)
  }

  function $all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector))
  }

  function valueOf(id) {
    const el = document.getElementById(id)
    if (!el) return ''
    if ('value' in el) return String(el.value || '')
    return String(el.textContent || '')
  }

  function setValue(id, value) {
    const el = document.getElementById(id)
    if (!el) return
    const normalized = String(value || '')
    if ('value' in el) el.value = normalized
    else el.textContent = normalized
    if (el.tagName === 'TEXTAREA' && typeof window.autoResize === 'function') {
      window.autoResize(el)
    }
    try {
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    } catch (_) {}
  }

  function hasText(value) {
    return String(value || '').trim() !== ''
  }

  function isDataImage(src) {
    return typeof src === 'string' && src.startsWith('data:image/')
  }

  function keepMedia(src) {
    if (!isDataImage(src)) return ''
    if (src.length > MAX_MEDIA_CHARS) return ''
    return src
  }

  function readOperations() {
    return $all('#operaciones tbody tr').map((row) => ({
      descripcion: $('.texto-operacion', row)?.value || '',
      realizada: Boolean($('input[type="checkbox"]', row)?.checked),
    }))
  }

  function readMaterials() {
    return $all('#filtrosMateriales tbody tr').map((row) => ({
      tipo: $('.material-tipo', row)?.value || '',
      cantidadUnidad: $('.cantidad-unidad', row)?.value || $('input[type="text"]', row)?.value || '',
    }))
  }

  function readFirma(includeMedia) {
    const img = document.getElementById('firmaImg')
    if (!img) return ''
    const src = img.getAttribute('src') || img.src || ''
    return includeMedia ? keepMedia(src) : ''
  }

  function collectDraftData(options) {
    const includeMedia = Boolean(options && options.includeMedia)
    return {
      mantenimiento: valueOf('tipoMantenimiento'),
      maquina: {
        tipoMaquina: valueOf('tipoMaquina'),
        marcaModelo: valueOf('marcaModelo'),
        codigoInterno: valueOf('codigoInterno'),
        matricula: valueOf('matricula'),
        bastidorSerie: valueOf('bastidor'),
        horasTrabajoKilometros: valueOf('horasKm'),
      },
      operaciones: readOperations(),
      filtrosMateriales: readMaterials(),
      observacionesGenerales: valueOf('observacionesGenerales'),
      responsable: valueOf('responsable'),
      fecha: valueOf('fechaFirma'),
      firma: readFirma(includeMedia),
    }
  }

  function isMeaningfulData(data) {
    if (!data) return false
    const mantenimiento = String(data.mantenimiento || '').trim()
    if (mantenimiento && mantenimiento.toUpperCase() !== 'ANUAL') return true
    if (Object.values(data.maquina || {}).some(hasText)) return true
    if ((data.operaciones || []).some((row) => hasText(row.descripcion) || Boolean(row.realizada))) return true
    if ((data.filtrosMateriales || []).some((row) => hasText(row.tipo) || hasText(row.cantidadUnidad))) return true
    if (hasText(data.observacionesGenerales)) return true
    if (hasText(data.responsable)) return true
    if (hasText(data.fecha)) return true
    if (hasText(data.firma)) return true
    return false
  }

  function hasMeaningfulDraftData() {
    return isMeaningfulData(collectDraftData({ includeMedia: false }))
  }

  function createOperationRow(item) {
    const row = document.createElement('tr')
    row.innerHTML = [
      '<td><textarea class="texto-operacion" placeholder="Descripcion de la operacion" oninput="autoResize(this)"></textarea></td>',
      '<td class="check"><input type="checkbox"></td>',
      '<td class="delete-cell"><button type="button" class="delete-btn" data-action="delete-operacion" onclick="deleteOperacion(this)">X</button></td>',
    ].join('')
    const textarea = $('.texto-operacion', row)
    const checkbox = $('input[type="checkbox"]', row)
    if (textarea) textarea.value = item && item.descripcion ? item.descripcion : ''
    if (checkbox) checkbox.checked = Boolean(item && item.realizada)
    return row
  }

  function createMaterialRow(item) {
    const row = document.createElement('tr')
    row.innerHTML = [
      '<td><textarea class="material-tipo" placeholder="Filtro / material" oninput="autoResize(this)"></textarea></td>',
      '<td><textarea class="cantidad-unidad" rows="1" placeholder="Cantidad / unidad" oninput="autoResize(this)"></textarea></td>',
      '<td class="delete-cell"><button type="button" class="delete-btn" data-action="delete-material" onclick="deleteFiltroMaterial(this)">X</button></td>',
    ].join('')
    const type = $('.material-tipo', row)
    const qty = $('.cantidad-unidad', row)
    if (type) type.value = item && item.tipo ? item.tipo : ''
    if (qty) qty.value = item && item.cantidadUnidad ? item.cantidadUnidad : ''
    return row
  }

  function restoreRows(selector, items, createRow, fallbackItem) {
    const tbody = $(selector)
    if (!tbody) return
    tbody.innerHTML = ''
    const rows = Array.isArray(items) ? items : [fallbackItem]
    rows.forEach((item) => tbody.appendChild(createRow(item)))
  }

  function restoreFirma(src) {
    const img = document.getElementById('firmaImg')
    const input = document.getElementById('firmaInput')
    if (!img) return
    if (isDataImage(src)) {
      img.src = src
      img.style.display = 'block'
    } else {
      img.removeAttribute('src')
      img.style.display = 'none'
    }
    if (input) input.value = ''
  }

  function restoreDraftData(data) {
    if (!data) return
    isRestoring = true
    try {
      const maquina = data.maquina || {}
      setValue('tipoMantenimiento', data.mantenimiento || 'Anual')
      setValue('codigoInterno', maquina.codigoInterno)
      setValue('tipoMaquina', maquina.tipoMaquina)
      setValue('marcaModelo', maquina.marcaModelo)
      setValue('matricula', maquina.matricula)
      setValue('bastidor', maquina.bastidorSerie)
      setValue('horasKm', maquina.horasTrabajoKilometros)
      setValue('observacionesGenerales', data.observacionesGenerales)
      setValue('responsable', data.responsable)
      setValue('fechaFirma', data.fecha)

      restoreRows('#operaciones tbody', data.operaciones, createOperationRow, { descripcion: '', realizada: false })
      restoreRows('#filtrosMateriales tbody', data.filtrosMateriales, createMaterialRow, { tipo: '', cantidadUnidad: '' })
      restoreFirma(data.firma)

      $all('textarea').forEach((el) => {
        if (typeof window.autoResize === 'function') window.autoResize(el)
      })
      if (typeof window.syncTipoMantenimientoPrint === 'function') window.syncTipoMantenimientoPrint()
      if (typeof window.preparePrintFooter === 'function') window.preparePrintFooter()
      lastSignature = JSON.stringify(collectDraftData({ includeMedia: false }))
    } finally {
      isRestoring = false
    }
  }

  function setStoredDraft(draft) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      return true
    } catch (_) {
      return false
    }
  }

  function saveNow() {
    if (isRestoring || autosaveSuspended > 0) return
    const textData = collectDraftData({ includeMedia: false })
    if (!isMeaningfulData(textData)) {
      localStorage.removeItem(DRAFT_KEY)
      lastSignature = ''
      return
    }

    const signature = JSON.stringify(textData)
    if (signature === lastSignature) return
    lastSignature = signature

    const mediaData = collectDraftData({ includeMedia: true })
    const draft = { version: VERSION, updatedAt: new Date().toISOString(), data: mediaData }
    if (!setStoredDraft(draft)) {
      setStoredDraft({ version: VERSION, updatedAt: draft.updatedAt, data: textData, mediaSkipped: true })
    }
    showStatus(draft.updatedAt)
  }

  function scheduleSave() {
    if (isRestoring || autosaveSuspended > 0) return
    clearTimeout(saveTimer)
    saveTimer = setTimeout(saveNow, SAVE_DELAY)
  }

  function suspendAutosave() {
    autosaveSuspended += 1
    clearTimeout(saveTimer)
  }

  function resumeAutosave(options) {
    autosaveSuspended = Math.max(0, autosaveSuspended - 1)
    if (autosaveSuspended > 0) return
    if (options && options.saveNow) saveNow()
    else if (options && options.scheduleSave) scheduleSave()
  }

  function isIgnoredAutosaveUi(target) {
    return Boolean(target && target.closest([
      '.rp-import-overlay',
      '.rp-import-toast',
      '.rp-autosave-overlay',
      // APP FITXES - FEATURE - TEMPLATES: abrir/ver/cancelar en el modal de plantillas
      // no debe afectar al autoguardado de la ficha actual.
      '.rp-templates-overlay',
      '.rp-templates-editor-banner',
    ].join(',')))
  }

  function isEditableSheetTarget(target) {
    if (!(target instanceof HTMLElement)) return false
    if (isIgnoredAutosaveUi(target)) return false
    if (!target.closest('.page')) return false
    if (target instanceof HTMLInputElement && target.type === 'file') return false
    return Boolean(target.matches('input, textarea, select') || target.isContentEditable)
  }

  function isStructuralSheetButton(target) {
    if (!(target instanceof HTMLElement)) return false
    const button = target.closest('button')
    if (!button || isIgnoredAutosaveUi(button)) return false
    const action = button.getAttribute('data-action') || ''
    const onclick = button.getAttribute('onclick') || ''
    const id = button.id || ''
    return (
      /^delete-/.test(action) ||
      /addActiveMaintenanceRow|removeActiveMaintenanceRow|quitarFirma/.test(onclick) ||
      /^(btnAddFila|btnRemoveFila)$/.test(id)
    )
  }

  function scheduleSaveAfterDomAction() {
    if (isRestoring || autosaveSuspended > 0) return
    const beforeSignature = JSON.stringify(collectDraftData({ includeMedia: false }))
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      const afterSignature = JSON.stringify(collectDraftData({ includeMedia: false }))
      if (afterSignature !== beforeSignature) saveNow()
    }, 350)
  }

  function readDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return null
      const draft = JSON.parse(raw)
      if (!draft || draft.version !== VERSION || !isMeaningfulData(draft.data)) return null
      return draft
    } catch (_) {
      return null
    }
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY)
  }

  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' })
    } catch (_) {
      return ''
    }
  }

  function summary(data) {
    const maquina = data && data.maquina ? data.maquina : {}
    return [data && data.mantenimiento, maquina.tipoMaquina, maquina.codigoInterno, maquina.marcaModelo].filter(hasText).join(' · ') || 'Fitxa de manteniment'
  }

  function ensureStyles() {
    if (document.getElementById('rp-autosave-styles')) return
    const style = document.createElement('style')
    style.id = 'rp-autosave-styles'
    style.textContent = [
      '.rp-autosave-status{font-size:12px;color:#64748b;font-weight:700;margin-left:4px;}',
      '.rp-autosave-overlay{position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.36);box-sizing:border-box;}',
      '.rp-autosave-dialog{width:min(460px,calc(100vw - 32px));background:#fff;border:1px solid rgba(242,169,0,.55);border-radius:12px;box-shadow:0 24px 80px rgba(15,23,42,.22);font-family:inherit;color:#111827;overflow:hidden;}',
      '.rp-autosave-dialog header{padding:16px 18px;border-bottom:1px solid #eef0f3;background:linear-gradient(90deg,#fff,#fff8e8);}',
      '.rp-autosave-dialog h2{margin:0;font-size:18px;line-height:1.2;}',
      '.rp-autosave-dialog .body{padding:16px 18px;font-size:13px;line-height:1.45;}',
      '.rp-autosave-dialog .summary{margin-top:10px;color:#4b5563;font-weight:700;}',
      '.rp-autosave-actions{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #eef0f3;}',
      '.rp-autosave-actions button{border:1px solid #d1d5db;background:#fff;color:#111827;border-radius:999px;padding:8px 12px;font-weight:800;cursor:pointer;}',
      '.rp-autosave-actions .primary{border-color:#f2a900;background:#f2a900;color:#000;}',
      '@media print{.no-print,.rp-autosave-overlay,.rp-autosave-status{display:none !important;}}',
    ].join('')
    document.head.appendChild(style)
  }

  function showStatus(iso) {
    const bar = $('.acciones-ficha')
    if (!bar) return
    let status = document.getElementById('rp-autosave-status-mantenimiento')
    if (!status) {
      status = document.createElement('span')
      status.id = 'rp-autosave-status-mantenimiento'
      status.className = 'rp-autosave-status no-print'
      bar.appendChild(status)
    }
    status.textContent = 'Guardat ' + formatTime(iso)
  }

  function showRecoveryModal(draft) {
    if (!draft || document.getElementById('rp-autosave-recovery-mantenimiento')) return
    ensureStyles()
    const overlay = document.createElement('div')
    overlay.id = 'rp-autosave-recovery-mantenimiento'
    overlay.className = 'rp-autosave-overlay no-print'
    overlay.innerHTML = [
      '<div class="rp-autosave-dialog" role="dialog" aria-modal="true">',
      '<header><h2>S\'ha trobat una fitxa no finalitzada.</h2></header>',
      '<div class="body">',
      '<div>Vols recuperar l\'ultim esborrany de fitxa de manteniment?</div>',
      '<div class="summary"></div>',
      '</div>',
      '<div class="rp-autosave-actions">',
      '<button type="button" data-rp-discard>Descartar</button>',
      '<button type="button" class="primary" data-rp-restore>Recuperar</button>',
      '</div>',
      '</div>',
    ].join('')
    $('.summary', overlay).textContent = summary(draft.data) + ' · ' + formatTime(draft.updatedAt)
    document.body.appendChild(overlay)
    $('[data-rp-restore]', overlay).addEventListener('click', () => {
      restoreDraftData(draft.data)
      overlay.remove()
      showStatus(draft.updatedAt)
    })
    $('[data-rp-discard]', overlay).addEventListener('click', () => {
      discardDraft()
      overlay.remove()
    })
  }

  function wireAutosave() {
    ensureStyles()
    document.addEventListener('input', (event) => {
      if (isEditableSheetTarget(event.target)) scheduleSave()
    }, true)
    document.addEventListener('change', (event) => {
      if (isEditableSheetTarget(event.target)) scheduleSave()
    }, true)
    document.addEventListener('click', (event) => {
      if (isStructuralSheetButton(event.target)) scheduleSaveAfterDomAction()
    }, true)
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Delete' && event.key !== 'Del') return
      if (isEditableSheetTarget(event.target)) return
      if (event.target instanceof HTMLElement && event.target.closest('.page')) scheduleSaveAfterDomAction()
    }, true)

    const observed = $('.page')
    if (observed && 'MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        const changedMedia = mutations.some((mutation) => {
          const target = mutation.target
          return target instanceof HTMLImageElement && target.id === 'firmaImg'
        })
        if (changedMedia) scheduleSave()
      })
      observer.observe(observed, { attributes: true, subtree: true, attributeFilter: ['src', 'style'] })
    }

    window.addEventListener('beforeunload', saveNow)

    const draft = readDraft()
    if (draft) setTimeout(() => showRecoveryModal(draft), 150)
  }

  window.rpFichasAutosaveMantenimiento = {
    draftKey: DRAFT_KEY,
    collectDraftData,
    hasMeaningfulDraftData,
    restoreDraftData,
    saveNow,
    scheduleSave,
    suspendAutosave,
    resumeAutosave,
    discardDraft,
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAutosave)
  } else {
    wireAutosave()
  }
})()
