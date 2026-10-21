;(function () {
  const DEFAULTS = ['Diario', 'Anual', 'Primeras 50h', '500h', '1.000h', '2.000h']
  const STORAGE_KEY = 'rpMaintenanceIntervalsV1'
  let field, control, hint, toggle, menu, save, status
  let activeIndex = 0

  function normalize(value) {
    return String(value || '').trim().toLowerCase().replace(/[\s.]+/g, '')
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      const strings = (list) => Array.isArray(list) ? list.filter((value) => typeof value === 'string') : []
      if (Array.isArray(parsed)) return { values: strings(parsed), hiddenDefaults: [] }
      if (parsed && typeof parsed === 'object') {
        return { values: strings(parsed.values), hiddenDefaults: strings(parsed.hiddenDefaults) }
      }
    } catch (_) {}
    return { values: [], hiddenDefaults: [] }
  }

  function writeState(state, message) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      status.textContent = ''
      return true
    } catch (_) {
      status.textContent = message
      return false
    }
  }

  function getOptions() {
    const state = readState()
    const hidden = new Set(state.hiddenDefaults.map(normalize))
    const seen = new Set()
    return DEFAULTS.filter((value) => !hidden.has(normalize(value))).concat(state.values).map((value) => value.trim()).filter((value) => {
      const key = normalize(value)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  function suggestion() {
    const prefix = normalize(field.value)
    return prefix ? getOptions().find((value) => normalize(value).startsWith(prefix)) : null
  }

  function updateHint() {
    if (!field) return
    const value = field.value
    const candidate = suggestion()
    hint.replaceChildren()
    if (document.activeElement === field && value && candidate
      && candidate.toLowerCase().startsWith(value.toLowerCase()) && candidate.length > value.length
      && field.selectionStart === value.length && field.selectionEnd === value.length) {
      const typed = document.createElement('span')
      typed.style.visibility = 'hidden'
      typed.textContent = value
      hint.append(typed, document.createTextNode(candidate.slice(value.length)))
    }
    save.hidden = !value.trim() || Boolean(candidate)
  }

  function closeMenu() {
    menu.hidden = true
    field.setAttribute('aria-expanded', 'false')
    toggle.setAttribute('aria-expanded', 'false')
    field.removeAttribute('aria-activedescendant')
  }

  function positionMenu() {
    if (menu.hidden) return
    const rect = control.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom - 8
    const height = Math.min(320, Math.max(80, below >= 120 ? below : rect.top - 8))
    const width = Math.min(Math.max(rect.width, 200), window.innerWidth - 16)
    menu.style.width = width + 'px'
    menu.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)) + 'px'
    menu.style.maxHeight = height + 'px'
    menu.style.top = (below >= 120 ? rect.bottom + 4 : Math.max(8, rect.top - menu.offsetHeight - 4)) + 'px'
  }

  function markActive() {
    Array.from(menu.children).forEach((option, index) => option.classList.toggle('is-highlighted', index === activeIndex))
    const option = menu.children[activeIndex]?.querySelector('[role="option"]')
    if (option) field.setAttribute('aria-activedescendant', option.id)
    else field.removeAttribute('aria-activedescendant')
  }

  function refresh() {
    if (!field) return
    menu.replaceChildren()
    getOptions().forEach((value, index) => {
      const row = document.createElement('div')
      row.className = 'maintenance-interval-row'
      row.setAttribute('role', 'presentation')
      const option = document.createElement('button')
      option.type = 'button'
      option.id = 'maintenance-interval-option-' + index
      option.role = 'option'
      option.tabIndex = -1
      option.className = 'maintenance-interval-option'
      option.textContent = value
      option.setAttribute('aria-selected', String(normalize(value) === normalize(field.value)))
      option.addEventListener('mousedown', (event) => event.preventDefault())
      option.addEventListener('click', () => commit(value))
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.className = 'maintenance-interval-remove'
      remove.textContent = '\u00d7'
      remove.title = 'Quitar ' + value + ' del listado'
      remove.setAttribute('aria-label', remove.title)
      remove.addEventListener('mousedown', (event) => event.preventDefault())
      remove.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        removeOption(value)
      })
      row.append(option, remove)
      menu.appendChild(row)
    })
    activeIndex = Math.max(0, Math.min(activeIndex, menu.children.length - 1))
    if (!menu.hidden) markActive()
    positionMenu()
    updateHint()
  }

  function commit(value) {
    field.value = value
    field.focus()
    field.setSelectionRange(value.length, value.length)
    closeMenu()
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
    if (typeof window.syncTipoMantenimientoPrint === 'function') window.syncTipoMantenimientoPrint()
  }

  function saveCurrent() {
    const value = field.value.trim()
    if (!value) return
    const options = getOptions()
    if (options.some((option) => normalize(option) === normalize(value))) return
    const state = readState()
    const predefined = DEFAULTS.find((option) => normalize(option) === normalize(value))
    if (predefined) {
      state.hiddenDefaults = state.hiddenDefaults.filter((option) => normalize(option) !== normalize(value))
    } else {
      state.values.push(value)
    }
    if (!writeState(state, 'No se ha podido guardar el mantenimiento en el listado.')) return
    refresh()
    commit(predefined || value)
  }

  function removeOption(value) {
    const key = normalize(value)
    const state = readState()
    state.values = state.values.filter((option) => normalize(option) !== key)
    if (DEFAULTS.some((option) => normalize(option) === key)) {
      state.hiddenDefaults = Array.from(new Set(state.hiddenDefaults.concat(key)))
    }
    if (!writeState(state, 'No se ha podido quitar el mantenimiento del listado.')) return
    refresh()
    field.focus()
  }

  function init() {
    field = document.getElementById('tipoMantenimiento')
    if (!field) return
    const style = document.createElement('style')
    style.textContent = `
      .maintenance-interval-control{position:relative;display:inline-flex;width:192px;flex-shrink:0;align-items:center;}
      .maintenance-interval-control #tipoMantenimiento{width:100%;height:28px;padding:4px 30px 4px 6px;font:13px/18px Arial;}
      .maintenance-interval-hint{position:absolute;left:7px;right:30px;top:50%;transform:translateY(-50%);font:13px/18px Arial;color:#64748b;white-space:pre;overflow:hidden;pointer-events:none;}
      .maintenance-interval-toggle{position:absolute;right:1px;top:1px;bottom:1px;width:27px;padding:0;border:0;border-left:1px solid #aaa;border-radius:0;background:#fff;}
      .maintenance-interval-menu{position:fixed;z-index:99990;box-sizing:border-box;padding:4px;border:1px solid #888;border-radius:4px;background:#fff;overflow-y:auto;box-shadow:0 4px 12px #0002;}
      .maintenance-interval-menu[hidden],.maintenance-interval-save[hidden]{display:none;}
      .maintenance-interval-row{display:grid;grid-template-columns:minmax(0,1fr) 28px;gap:2px;align-items:center;min-height:30px;}
      .maintenance-interval-menu button{display:block;width:100%;padding:7px 8px;border:0;border-radius:2px;text-align:left;white-space:normal;overflow-wrap:anywhere;font:13px Arial;}
      .maintenance-interval-menu button:hover,.maintenance-interval-menu .is-highlighted .maintenance-interval-option{background:#edf2f7;}
      .maintenance-interval-menu [aria-selected="true"]{font-weight:700;}
      .maintenance-interval-menu .maintenance-interval-remove{width:28px;height:28px;padding:0;text-align:center;font-size:20px;line-height:1;color:#64748b;}
      .maintenance-interval-menu .maintenance-interval-remove:hover{background:#fef2f2;color:#b91c1c;}
      .maintenance-interval-menu:empty::after{content:'No hay opciones guardadas.';display:block;padding:8px;font:13px Arial;color:#64748b;}
      .maintenance-interval-save{padding:5px 8px;border-radius:4px;font-size:12px;white-space:nowrap;}
      .maintenance-interval-status:empty{display:none;}
      .maintenance-interval-status{font-size:12px;color:#991b1b;}
      @media print{.maintenance-interval-control{width:auto;}.maintenance-interval-menu,.maintenance-interval-hint,.maintenance-interval-toggle,.maintenance-interval-save,.maintenance-interval-status{display:none!important;}}
    `
    document.head.appendChild(style)
    control = document.createElement('span')
    control.className = 'maintenance-interval-control'
    field.before(control)
    control.appendChild(field)
    field.autocomplete = 'off'
    field.spellcheck = false
    field.setAttribute('role', 'combobox')
    field.setAttribute('aria-autocomplete', 'inline')
    field.setAttribute('aria-haspopup', 'listbox')
    field.setAttribute('aria-controls', 'tipoMantenimientoOpciones')
    field.setAttribute('aria-expanded', 'false')
    hint = document.createElement('span')
    hint.className = 'maintenance-interval-hint no-print'
    hint.setAttribute('aria-hidden', 'true')
    toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'maintenance-interval-toggle no-print'
    toggle.textContent = '\u25be'
    toggle.title = 'Mostrar opciones de mantenimiento'
    toggle.setAttribute('aria-label', toggle.title)
    toggle.setAttribute('aria-controls', 'tipoMantenimientoOpciones')
    toggle.setAttribute('aria-expanded', 'false')
    control.append(hint, toggle)
    menu = document.createElement('div')
    menu.id = 'tipoMantenimientoOpciones'
    menu.className = 'maintenance-interval-menu no-print'
    menu.role = 'listbox'
    menu.setAttribute('aria-label', 'Mantenimientos guardados')
    menu.hidden = true
    document.body.appendChild(menu)
    save = document.createElement('button')
    save.type = 'button'
    save.className = 'maintenance-interval-save no-print'
    save.textContent = 'Guardar en listado'
    save.hidden = true
    status = document.createElement('span')
    status.className = 'maintenance-interval-status no-print'
    status.setAttribute('role', 'status')
    control.after(save, status)
    save.addEventListener('click', saveCurrent)
    toggle.addEventListener('mousedown', (event) => event.preventDefault())
    toggle.addEventListener('click', () => {
      if (!menu.hidden) { closeMenu(); return }
      refresh()
      activeIndex = Math.max(0, getOptions().findIndex((option) => normalize(option) === normalize(field.value)))
      menu.hidden = false
      field.setAttribute('aria-expanded', 'true')
      toggle.setAttribute('aria-expanded', 'true')
      markActive()
      positionMenu()
      field.focus()
    })
    field.addEventListener('input', () => { status.textContent = ''; closeMenu(); updateHint() })
    field.addEventListener('change', updateHint)
    field.addEventListener('focus', updateHint)
    field.addEventListener('blur', () => { hint.replaceChildren() })
    field.addEventListener('click', updateHint)
    field.addEventListener('keyup', updateHint)
    field.addEventListener('select', updateHint)
    field.addEventListener('keydown', (event) => {
      if (event.isComposing) return
      if (event.key === 'Escape') { closeMenu(); return }
      if (!menu.hidden && menu.children.length && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        event.preventDefault()
        activeIndex = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + menu.children.length) % menu.children.length
        markActive()
        menu.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
      }
      if (event.key !== 'Enter') return
      const candidate = menu.hidden ? suggestion() : getOptions()[activeIndex]
      if (candidate) { event.preventDefault(); commit(candidate) }
    })
    document.addEventListener('pointerdown', (event) => {
      if (!control.contains(event.target) && !menu.contains(event.target)) closeMenu()
    })
    window.addEventListener('resize', positionMenu)
    window.addEventListener('scroll', positionMenu, true)
    refresh()
  }

  window.rpMaintenanceIntervals = { getOptions, refresh }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
