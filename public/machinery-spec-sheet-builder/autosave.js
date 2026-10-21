// APP FITXES - FEATURE BLOCK 1 - AUTOSAVE
;(function () {
  const DRAFT_KEY = 'rpFichasDraftTecnicaV1'
  const VERSION = 1
  const SAVE_DELAY = 900
  const MAX_MEDIA_CHARS = 1800000

  let saveTimer = null
  let isRestoring = false
  let autosaveSuspended = 0
  let lastSignature = ''
  let initialStructure = ''
  const initialGeneral = document.querySelector('[data-group-kind="general"]')?.cloneNode(true)
  const initialMaterials = document.querySelector('[data-group-kind="materials"]')?.cloneNode(true)

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
    if (el.tagName === 'TEXTAREA' && typeof window.autoGrowTextarea === 'function') {
      window.autoGrowTextarea(el)
    }
    try {
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    } catch (_) {}
  }

  function normalizeTitle(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase()
  }

  function isDataImage(src) {
    return typeof src === 'string' && src.startsWith('data:image/')
  }

  function makeMediaKeeper() {
    let used = 0
    return function keep(src) {
      if (!isDataImage(src)) return ''
      if (used + src.length > MAX_MEDIA_CHARS) return ''
      used += src.length
      return src
    }
  }

  function groupKind(group) {
    if (!group) return 'keyvalue'
    if (group.getAttribute('data-group-kind') === 'materials') return 'materials'
    if (group.getAttribute('data-group-kind') === 'general') return 'general'
    if (group.querySelector('#tec_marca, #tec_modelo, #tec_serie')) return 'general'
    return 'keyvalue'
  }

  function readKeyValueRows(group) {
    return $all('[data-rows] > tr', group).map((row) => {
      const fields = $all('textarea, input, select', row)
      return {
        caracteristica: fields[0] ? String(fields[0].value || '') : '',
        valor: fields[1] ? String(fields[1].value || '') : '',
      }
    })
  }

  function readMaterialsRows(group) {
    return $all('[data-rows] > tr', group).map((row) => ({
      tipo: $('.material-tipo', row)?.value || '',
      cantidadUnidad: $('.cantidad-unidad', row)?.value || '',
    }))
  }

  function readPhoto(block, keepMedia) {
    const img = block ? $('img', block) : null
    return {
      src: keepMedia(img ? img.getAttribute('src') || img.src || '' : ''),
    }
  }

  function collectDraftData(options) {
    const keepMedia = options && options.includeMedia ? makeMediaKeeper() : function () { return '' }
    const container = document.getElementById('tec-groups')
    const topPhoto = $('.page > [data-photo]')
    const layout = []
    const grupos = []
    let filtrosMateriales = []

    if (container) {
      Array.from(container.children).forEach((child) => {
        if (child.matches && child.matches('[data-photo]')) {
          layout.push({ type: 'photo', photo: readPhoto(child, keepMedia) })
          return
        }
        if (!child.matches || !child.matches('[data-group]')) return

        const kind = groupKind(child)
        const title = $('.section-title', child)?.textContent || ''
        if (kind === 'materials') {
          filtrosMateriales = readMaterialsRows(child)
          layout.push({ type: 'group', kind: 'materials', title })
          return
        }
        if (kind === 'general') {
          const filas = $all('[data-rows] > tr', child).map((row) => {
            const key = row.firstElementChild
            const field = row.children[1]?.querySelector('input, textarea, select')
            const keyField = $('input, textarea', key)
            return {
              caracteristica: keyField ? keyField.value : key.textContent.trim(),
              valor: field ? field.value : '',
              fieldId: field ? field.id : '',
              editable: Boolean(keyField),
            }
          })
          layout.push({ type: 'group', kind: 'general', title, filas })
          return
        }

        const group = {
          titulo: String(title || '').trim(),
          filas: readKeyValueRows(child),
        }
        grupos.push(group)
        layout.push({ type: 'group', kind: 'keyvalue', group })
      })
    }

    return {
      layoutVersion: 2,
      cabecera: {
        maquina: valueOf('tec_tipoMaquina'),
        codigoInterno: valueOf('tec_codigoInterno'),
        marcaModelo: valueOf('tec_marcaModelo'),
        matricula: valueOf('tec_matricula'),
        anyo: valueOf('tec_anyo'),
      },
      caracteristicasGenerales: {
        marca: valueOf('tec_marca'),
        modelo: valueOf('tec_modelo'),
        numeroSerieBastidor: valueOf('tec_serie'),
        fechaCompra: valueOf('tec_fecha_compra'),
        valorCompra: valueOf('tec_valor_compra'),
        motor: valueOf('tec_motor'),
        potencia: valueOf('tec_potencia'),
        consumoEstimado: valueOf('tec_consumo_estimado'),
        estado: valueOf('tec_estado'),
      },
      grupos,
      filtrosMateriales,
      imagenPrincipal: topPhoto ? readPhoto(topPhoto, keepMedia) : null,
      layout,
    }
  }

  function hasText(value) {
    return String(value || '').trim() !== ''
  }

  function isMeaningfulData(data) {
    if (!data) return false
    if (Object.values(data.cabecera || {}).some(hasText)) return true
    if (Object.values(data.caracteristicasGenerales || {}).some(hasText)) return true
    if ((data.layout || []).some((item) => item.kind === 'general' && (item.filas || []).some((row) => {
      return hasText(row.valor) || (row.editable && hasText(row.caracteristica))
    }))) return true
    if (initialStructure && Array.isArray(data.layout) && structureSignature(data) !== initialStructure) return true
    if ((data.filtrosMateriales || []).some((row) => hasText(row.tipo) || hasText(row.cantidadUnidad))) return true
    if ((data.grupos || []).some((group) => {
      const title = normalizeTitle(group.titulo)
      if (title && title !== 'DIMENSIONES' && title !== 'SISTEMA ELECTRICO') return true
      return (group.filas || []).some((row) => hasText(row.caracteristica) || hasText(row.valor))
    })) return true
    if (data.imagenPrincipal && hasText(data.imagenPrincipal.src)) return true
    return (data.layout || []).some((item) => item.type === 'photo' && item.photo && hasText(item.photo.src))
  }

  function structureSignature(data) {
    return JSON.stringify((data.layout || []).map((item) => ({
      type: item.type,
      kind: item.kind,
      title: item.title || item.group?.titulo,
      rows: item.kind === 'general' ? (item.filas?.length ?? 8)
        : item.kind === 'materials' ? data.filtrosMateriales?.length : item.group?.filas?.length,
    })))
  }

  function hasMeaningfulDraftData() {
    return isMeaningfulData(collectDraftData({ includeMedia: false }))
  }

  function draftSummary(data) {
    const cab = data && data.cabecera ? data.cabecera : {}
    return [cab.maquina, cab.codigoInterno, cab.marcaModelo].filter(hasText).join(' · ') || 'Fitxa tecnica'
  }

  function createKeyValueRow(rowData) {
    const row = document.createElement('tr')
    row.innerHTML = [
      '<th style="width:35%;"><textarea class="kv-key-input autogrow" rows="1" placeholder="Caracteristica"></textarea></th>',
      '<td><textarea class="autogrow" rows="1" placeholder="Valor"></textarea></td>',
    ].join('')
    const fields = $all('textarea', row)
    if (fields[0]) fields[0].value = rowData && rowData.caracteristica ? rowData.caracteristica : ''
    if (fields[1]) fields[1].value = rowData && rowData.valor ? rowData.valor : ''
    return row
  }

  function createMaterialRow(rowData) {
    const row = document.createElement('tr')
    row.innerHTML = [
      '<td><textarea class="material-tipo texto-operacion" placeholder="Filtro / material"></textarea></td>',
      '<td><textarea class="autogrow cantidad-unidad" rows="1" placeholder="Cantidad / unidad"></textarea></td>',
    ].join('')
    const type = $('.material-tipo', row)
    const qty = $('.cantidad-unidad', row)
    if (type) type.value = rowData && rowData.tipo ? rowData.tipo : ''
    if (qty) qty.value = rowData && rowData.cantidadUnidad ? rowData.cantidadUnidad : ''
    return row
  }

  function createGroup(groupData) {
    const table = document.createElement('table')
    table.className = 'no-page-break group'
    table.setAttribute('data-group', '')
    table.innerHTML = [
      '<tr><td class="section-title" contenteditable="true" spellcheck="false"></td></tr>',
      '<tr><td><table style="margin:0;border:none;"><tbody data-rows></tbody></table></td></tr>',
    ].join('')
    const title = $('.section-title', table)
    if (title) title.textContent = String(groupData && groupData.titulo ? groupData.titulo : 'NUEVO GRUPO').toUpperCase()
    const tbody = $('[data-rows]', table)
    const rows = groupData && Array.isArray(groupData.filas) ? groupData.filas : [{ caracteristica: '', valor: '' }]
    rows.forEach((row) => tbody.appendChild(createKeyValueRow(row)))
    return table
  }

  function createPhotoBlock(photoData) {
    const wrapper = typeof window.createPhotoBlock === 'function'
      ? window.createPhotoBlock()
      : document.createElement('div')
    if (!wrapper.hasAttribute('data-photo')) {
      wrapper.className = 'foto-maquina'
      wrapper.setAttribute('data-photo', '')
      wrapper.innerHTML = [
        '<div class="photo-placeholder">Espacio para imagen (insertar antes de imprimir)</div>',
        '<img alt="" style="display:none;">',
        '<input type="file" accept="image/*" style="display:none;" />',
        '<div class="photo-actions"><button type="button">Seleccionar imagen</button><button type="button">Quitar imagen</button></div>',
      ].join('')
    }
    setPhoto(wrapper, photoData && photoData.src)
    if (typeof window.wirePhotoBlock === 'function') window.wirePhotoBlock(wrapper)
    return wrapper
  }

  function setPhoto(wrapper, src) {
    const img = wrapper ? $('img', wrapper) : null
    if (!img) return
    if (isDataImage(src)) {
      img.src = src
      img.style.display = 'block'
      wrapper.classList.add('is-filled')
    } else {
      img.removeAttribute('src')
      img.style.display = 'none'
      wrapper.classList.remove('is-filled')
    }
  }

  function restoreDraftData(data, options) {
    if (!data) return
    isRestoring = true
    try {
      const cab = data.cabecera || {}
      setValue('tec_tipoMaquina', cab.maquina)
      setValue('tec_codigoInterno', cab.codigoInterno)
      setValue('tec_marcaModelo', cab.marcaModelo)
      setValue('tec_matricula', cab.matricula)
      setValue('tec_anyo', cab.anyo)

      const gen = data.caracteristicasGenerales || {}
      setValue('tec_marca', gen.marca)
      setValue('tec_modelo', gen.modelo)
      const legacySerie = (data.layout || []).find((item) => item.kind === 'general')?.filas?.find((row) => row.fieldId === 'tec_serie')
      setValue('tec_serie', gen.numeroSerieBastidor ?? legacySerie?.valor)
      setValue('tec_fecha_compra', gen.fechaCompra)
      setValue('tec_valor_compra', gen.valorCompra)
      setValue('tec_motor', gen.motor)
      setValue('tec_potencia', gen.potencia)
      setValue('tec_consumo_estimado', gen.consumoEstimado)
      setValue('tec_estado', gen.estado)

      let topPhoto = $('.page > [data-photo]')
      if (!topPhoto && data.imagenPrincipal?.src) {
        topPhoto = createPhotoBlock(data.imagenPrincipal)
        const page = $('.page')
        page.insertBefore(topPhoto, document.getElementById('tec-groups'))
      }
      if (topPhoto) setPhoto(topPhoto, data.imagenPrincipal && data.imagenPrincipal.src)

      const container = document.getElementById('tec-groups')
      if (container) {
        const exact = Boolean(options && options.exactLayout)
        const generalGroup = $all('[data-group]', container).find((group) => groupKind(group) === 'general') || (exact ? initialGeneral?.cloneNode(true) : null)
        const materialsGroup = $all('[data-group]', container).find((group) => groupKind(group) === 'materials') || (exact ? initialMaterials?.cloneNode(true) : null)
        if (generalGroup) generalGroup.remove()
        if (materialsGroup) materialsGroup.remove()
        container.innerHTML = ''

        if (materialsGroup) {
          const tbody = $('[data-rows]', materialsGroup)
          if (tbody) {
            tbody.innerHTML = ''
            const rows = Array.isArray(data.filtrosMateriales) ? data.filtrosMateriales : [{ tipo: '', cantidadUnidad: '' }]
            rows.forEach((row) => tbody.appendChild(createMaterialRow(row)))
          }
        }

        const layout = Array.isArray(data.layout) && data.layout.length
          ? data.layout
          : [
              { type: 'group', kind: 'general' },
              { type: 'group', kind: 'keyvalue', group: { titulo: 'DIMENSIONES', filas: [] } },
              ...(data.grupos || []).map((group) => ({ type: 'group', kind: 'keyvalue', group })),
              { type: 'group', kind: 'materials' },
            ]

        let appendedGeneral = false
        let appendedMaterials = false
        layout.forEach((item) => {
          if (!item) return
          if (item.type === 'photo') {
            container.appendChild(createPhotoBlock(item.photo))
            return
          }
          if (item.type !== 'group') return
          if (item.kind === 'general' && generalGroup && !appendedGeneral) {
            const title = $('.section-title', generalGroup)
            if (title && typeof item.title === 'string') title.textContent = item.title
            if (Array.isArray(item.filas)) {
              const tbody = $('[data-rows]', generalGroup)
              tbody.innerHTML = ''
              item.filas.forEach((saved) => {
                if (saved.fieldId === 'tec_serie') return
                const row = createKeyValueRow(saved)
                if (!saved.editable) row.firstElementChild.textContent = String(saved.caracteristica || '')
                const field = row.children[1].querySelector('textarea')
                if (/^tec_(marca|modelo|fecha_compra|valor_compra|motor|potencia|consumo_estimado|estado)$/.test(saved.fieldId || '')) {
                  field.id = saved.fieldId
                }
                tbody.appendChild(row)
              })
            }
            container.appendChild(generalGroup)
            appendedGeneral = true
            return
          }
          if (item.kind === 'materials' && materialsGroup && !appendedMaterials) {
            const title = $('.section-title', materialsGroup)
            if (title && typeof item.title === 'string') title.textContent = item.title
            container.appendChild(materialsGroup)
            appendedMaterials = true
            return
          }
          if (item.kind === 'keyvalue') {
            container.appendChild(createGroup(item.group))
          }
        })
        if (generalGroup && !appendedGeneral && !exact) container.insertBefore(generalGroup, container.firstChild)
        if (materialsGroup && !appendedMaterials && !exact) container.appendChild(materialsGroup)
        if (materialsGroup && data.layoutVersion !== 2 && !exact) container.appendChild(materialsGroup)
      }

      $all('textarea').forEach((el) => {
        if (typeof window.autoGrowTextarea === 'function') window.autoGrowTextarea(el)
      })
      $all('[data-photo]').forEach((el) => {
        if (typeof window.wirePhotoBlock === 'function') window.wirePhotoBlock(el)
      })
      if (typeof window.refreshPrintWatermarks === 'function') window.refreshPrintWatermarks()
      const firstGroup = $('[data-group]')
      if (firstGroup && typeof window.setActiveGroup === 'function') window.setActiveGroup(firstGroup)
      lastSignature = JSON.stringify(collectDraftData({ includeMedia: false }))
    } finally {
      isRestoring = false
    }
  }

  function setStoredDraft(draft) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      return true
    } catch (err) {
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
    const onclick = button.getAttribute('onclick') || ''
    const text = String(button.textContent || '')
    return (
      /addPhotoBeforeActiveGroup|removeActivePhoto|addGroup|removeActiveGroup|moveActiveGroup|addRowToActiveGroup|removeActiveRow/.test(onclick) ||
      /Quitar imagen/i.test(text)
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
    let status = document.getElementById('rp-autosave-status-tecnica')
    if (!status) {
      status = document.createElement('span')
      status.id = 'rp-autosave-status-tecnica'
      status.className = 'rp-autosave-status no-print'
      bar.appendChild(status)
    }
    status.textContent = 'Guardat ' + formatTime(iso)
  }

  function showRecoveryModal(draft) {
    if (!draft || document.getElementById('rp-autosave-recovery-tecnica')) return
    ensureStyles()
    const overlay = document.createElement('div')
    overlay.id = 'rp-autosave-recovery-tecnica'
    overlay.className = 'rp-autosave-overlay no-print'
    overlay.innerHTML = [
      '<div class="rp-autosave-dialog" role="dialog" aria-modal="true">',
      '<header><h2>S\'ha trobat una fitxa no finalitzada.</h2></header>',
      '<div class="body">',
      '<div>Vols recuperar l\'ultim esborrany de fitxa tecnica?</div>',
      '<div class="summary"></div>',
      '</div>',
      '<div class="rp-autosave-actions">',
      '<button type="button" data-rp-discard>Descartar</button>',
      '<button type="button" class="primary" data-rp-restore>Recuperar</button>',
      '</div>',
      '</div>',
    ].join('')
    $('.summary', overlay).textContent = draftSummary(draft.data) + ' · ' + formatTime(draft.updatedAt)
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
    initialStructure = structureSignature(collectDraftData({ includeMedia: false }))
    document.addEventListener('input', (event) => {
      if (isEditableSheetTarget(event.target)) scheduleSave()
    }, true)
    document.addEventListener('change', (event) => {
      if (isEditableSheetTarget(event.target)) scheduleSave()
    }, true)
    document.addEventListener('keyup', (event) => {
      if (isEditableSheetTarget(event.target) && event.target.isContentEditable) scheduleSave()
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
          return target instanceof HTMLImageElement && target.closest('[data-photo]')
        })
        if (changedMedia) scheduleSave()
      })
      observer.observe(observed, { attributes: true, subtree: true, attributeFilter: ['src', 'style'] })
    }

    window.addEventListener('beforeunload', saveNow)

    const draft = readDraft()
    if (draft) setTimeout(() => showRecoveryModal(draft), 150)
  }

  window.rpFichasAutosaveTecnica = {
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
