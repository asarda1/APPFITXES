// Hotfix / Compat layer for `fichas.html`
// - Restores readable labels (UTF-8) in toolbar
// - Ensures buttons/selects work even if inline handlers are blocked
// - Routes row actions to the table selected by the cursor
;(function () {
  function $(sel, root) {
    return (root || document).querySelector(sel)
  }

  function bind(el, evt, fn) {
    if (!el) return
    try {
      el.addEventListener(evt, fn)
    } catch (_) {}
  }

  function callIfExists(name, args) {
    const fn = window && window[name]
    if (typeof fn === 'function') return fn.apply(window, args || [])
    return undefined
  }

  function hasFn(name) {
    return !!(window && typeof window[name] === 'function')
  }

  function ensureToolbar() {
    const bar = $('.barra-ficha')
    if (!bar) return
    const title = bar.querySelector('div[style*="font-weight"]')
    if (title) {
      title.textContent = 'Creación de fichas de mantenimiento'
      const wrap = title.parentElement
      if (!$('#btnBack', wrap)) {
        const back = document.createElement('button')
        back.type = 'button'
        back.id = 'btnBack'
        back.textContent = '←'
        back.title = 'Volver'
        back.className = 'btn-primary'
        bind(back, 'click', () => history.back())
        wrap.insertBefore(back, wrap.firstChild)
      }
    }
    const pdf = bar.querySelector('button[onclick="guardarPDF()"]')
    if (pdf) pdf.id = 'btnGuardarPDF'
    $('#btnAddFila', bar)?.classList.add('btn-primary')
  }

  function fallbackAddOperacion() {
    const tbody = $('#operaciones tbody')
    if (!tbody) return
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td><textarea class="texto-operacion" placeholder="Descripción de la operación"></textarea></td>
      <td class="check"><input type="checkbox"></td>
      <td class="delete-cell"><button type="button" class="delete-btn" data-action="delete-operacion" aria-label="Eliminar operación">✖</button></td>
    `
    tbody.appendChild(tr)
  }

  function fallbackAddMaterial() {
    const tbody = $('#filtrosMateriales tbody')
    if (!tbody) return
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td><textarea class="material-tipo" placeholder="Filtro / material"></textarea></td>
      <td><textarea class="cantidad-unidad" rows="1" placeholder="Cantidad / unidad"></textarea></td>
      <td class="delete-cell"><button type="button" class="delete-btn" data-action="delete-material" aria-label="Eliminar fila">✖</button></td>
    `
    tbody.appendChild(tr)
  }

  function ensureCodigoInternoOptions() {
    const input = $('#codigoInterno')
    const list = $('#codigoInternoList')
    if (!input || !list) return
    if (list.children && list.children.length > 0) return

    // Try to call the original initializer (it can access `maquinaria` even if it's `const`)
    try {
      callIfExists('initSelectCodigoInterno')
    } catch (_) {}
  }

  async function fetchMachineryFallback() {
    const list = $('#codigoInternoList')
    if (!list) return
    if (list.children && list.children.length > 0) return

    try {
      const res = await fetch('maquinaria_completa.js', { cache: 'no-store' })
      if (!res.ok) return
      const text = await res.text()
      const match = text.match(/const\\s+maquinaria\\s*=\\s*(\\{[\\s\\S]*\\})\\s*;?\\s*$/m)
      if (!match) return
      // eslint-disable-next-line no-new-func
      const maquinariaObj = new Function('return ' + match[1])()
      const keys = maquinariaObj ? Object.keys(maquinariaObj).sort() : []
      if (keys.length === 0) return

      keys.forEach((codigo) => {
        const opt = document.createElement('option')
        opt.value = codigo
        list.appendChild(opt)
      })
    } catch (_) {}
  }

  let activeOperacionRow = null
  let activeFiltroRow = null
  let activeMaintenanceTable = null
  let maintenanceSelectionAnchor = null

  function getRows(table) {
    const tbody = table ? table.querySelector('tbody') : null
    return tbody ? Array.from(tbody.querySelectorAll('tr')) : []
  }

  function clearSelectedRows(table) {
    getRows(table).forEach((row) => row.classList.remove('is-selected-row'))
  }

  function setActiveMaintenanceRow(row, event) {
    if (!row) return
    const table = row.closest('#operaciones, #filtrosMateriales')
    if (!table) return

    activeMaintenanceTable = table
    if (table.id === 'operaciones') activeOperacionRow = row
    if (table.id === 'filtrosMateriales') activeFiltroRow = row

    const rows = getRows(table)
    const isRange = Boolean(event && event.shiftKey)
    const isToggle = Boolean(event && (event.ctrlKey || event.metaKey))

    rows.forEach((item) => item.classList.remove('is-active-row'))

    if (isRange && maintenanceSelectionAnchor && table.contains(maintenanceSelectionAnchor)) {
      const start = rows.indexOf(maintenanceSelectionAnchor)
      const end = rows.indexOf(row)
      if (start >= 0 && end >= 0) {
        clearSelectedRows(table)
        const from = Math.min(start, end)
        const to = Math.max(start, end)
        rows.slice(from, to + 1).forEach((item) => item.classList.add('is-selected-row'))
      }
    } else if (isToggle) {
      row.classList.toggle('is-selected-row')
      if (row.classList.contains('is-selected-row')) maintenanceSelectionAnchor = row
    } else {
      clearSelectedRows(table)
      row.classList.add('is-selected-row')
      maintenanceSelectionAnchor = row
    }

    row.classList.add('is-active-row')
  }

  function getSelectedRowsForTable(table, fallbackRow) {
    const selected = getRows(table).filter((row) => row.classList.contains('is-selected-row'))
    if (selected.length) return selected
    return fallbackRow && table && table.contains(fallbackRow) ? [fallbackRow] : []
  }

  function rememberActiveRow(target) {
    const el = target instanceof HTMLElement ? target : null
    if (!el) return
    const opRow = el.closest('#operaciones tbody tr')
    if (opRow) {
      activeOperacionRow = opRow
      activeMaintenanceTable = opRow.closest('#operaciones')
    }
    const filtroRow = el.closest('#filtrosMateriales tbody tr')
    if (filtroRow) {
      activeFiltroRow = filtroRow
      activeMaintenanceTable = filtroRow.closest('#filtrosMateriales')
    }
  }

  function getActiveRow(tableSelector, savedRow) {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusedRow = active ? active.closest(`${tableSelector} tbody tr`) : null
    if (focusedRow && focusedRow.isConnected) return focusedRow
    if (savedRow && savedRow.isConnected && savedRow.closest(tableSelector)) return savedRow
    return null
  }
  function getTableFromCursor() {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusedTable = active ? active.closest('#operaciones, #filtrosMateriales') : null
    if (focusedTable) return focusedTable
    if (activeMaintenanceTable && activeMaintenanceTable.isConnected) return activeMaintenanceTable
    if (activeOperacionRow && activeOperacionRow.isConnected) return activeOperacionRow.closest('#operaciones')
    if (activeFiltroRow && activeFiltroRow.isConnected) return activeFiltroRow.closest('#filtrosMateriales')
    return null
  }
  function addActiveMaintenanceRow() {
    const table = getTableFromCursor() || $('#operaciones')
    const tbody = table?.querySelector('tbody')
    if (!tbody) return
    const operations = table.id === 'operaciones'
    const anchor = getActiveRow('#' + table.id, operations ? activeOperacionRow : activeFiltroRow)
    if (operations) {
      if (hasFn('addOperacion')) callIfExists('addOperacion')
      else fallbackAddOperacion()
    } else {
      if (hasFn('addFiltroMaterialRow')) callIfExists('addFiltroMaterialRow')
      else fallbackAddMaterial()
    }
    const row = tbody.lastElementChild
    if (!row) return
    if (anchor && anchor !== row) tbody.insertBefore(row, anchor.nextSibling)
    setActiveMaintenanceRow(row)
    row.querySelector('textarea, input')?.focus()
  }

  function removeActiveMaintenanceRow() {
    const table = getTableFromCursor()
    if (!table) return
    const saved = table.id === 'operaciones' ? activeOperacionRow : activeFiltroRow
    const fallback = getActiveRow('#' + table.id, saved) || table.querySelector('tbody')?.lastElementChild
    const selected = getSelectedRowsForTable(table, fallback)
    if (!selected.length) return
    const remaining = getRows(table).filter((row) => !selected.includes(row))
    selected.forEach((row) => row.remove())
    activeOperacionRow = table.id === 'operaciones' ? null : activeOperacionRow
    activeFiltroRow = table.id === 'filtrosMateriales' ? null : activeFiltroRow
    maintenanceSelectionAnchor = null
    if (remaining.length) setActiveMaintenanceRow(remaining[remaining.length - 1])
  }

  window.addActiveMaintenanceRow = addActiveMaintenanceRow
  window.removeActiveMaintenanceRow = removeActiveMaintenanceRow

  function wireActions() {
    bind(document, 'focusin', (event) => {
      rememberActiveRow(event.target)
      const row = event.target instanceof HTMLElement
        ? event.target.closest('#operaciones tbody tr, #filtrosMateriales tbody tr') : null
      if (row) setActiveMaintenanceRow(row)
    })
    bind(document, 'click', (event) => {
      rememberActiveRow(event.target)
      const row = event.target instanceof HTMLElement
        ? event.target.closest('#operaciones tbody tr, #filtrosMateriales tbody tr') : null
      if (row) setActiveMaintenanceRow(row, event)
    })
    ;[
      ['btnAddFila', addActiveMaintenanceRow],
      ['btnRemoveFila', removeActiveMaintenanceRow],
      ['btnGuardarPDF', () => hasFn('guardarPDF') ? callIfExists('guardarPDF') : window.print()],
    ].forEach(([id, action]) => {
      const button = document.getElementById(id)
      if (button && !button.getAttribute('onclick')) bind(button, 'click', action)
    })
    bind(document, 'keydown', (event) => {
      if (event.key !== 'Delete' && event.key !== 'Del') return
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement || target?.isContentEditable) return
      if (!getTableFromCursor()) return
      removeActiveMaintenanceRow()
      event.preventDefault()
    })
  }

  function splitLines(text) {
    return String(text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
  }

  function parseMaterialLine(line) {
    const raw = String(line || '').trim()
    if (!raw) return { tipo: '', cantidad: '' }
    // Prefer TAB, then ';', then ',' as separators
    const separators = ['\t', ';', ',']
    for (const sep of separators) {
      if (raw.includes(sep)) {
        const parts = raw.split(sep).map((p) => p.trim())
        return { tipo: parts[0] || '', cantidad: parts.slice(1).join(sep).trim() || '' }
      }
    }
    return { tipo: raw, cantidad: '' }
  }

  function setTextareaValue(el, value) {
    if (!el) return
    el.value = value
    // trigger auto-resize if available
    try {
      if (typeof window.autoResize === 'function') window.autoResize(el)
    } catch (_) {}
  }

  function handlePasteOperations(target, clipboardText) {
    const lines = splitLines(clipboardText)
    if (lines.length <= 1) return false

    const parseOpLine = (line) => {
      const parts = String(line || '').split('\t')
      const checkedText = String(parts[1] || '').trim().toLowerCase()
      return {
        text: (parts[0] || '').trim(),
        checked: ['si', 'sí', 'x', 'true', '1', 'ok'].includes(checkedText)
      }
    }

    const first = parseOpLine(lines[0])
    setTextareaValue(target, first.text)
    const firstRow = target.closest('tr')
    const firstCheck = firstRow ? firstRow.querySelector('input[type="checkbox"]') : null
    if (firstCheck) firstCheck.checked = first.checked

    // Insert remaining lines as new operation rows
    for (let i = 1; i < lines.length; i++) {
      const parsed = parseOpLine(lines[i])
      const beforeCount = document.querySelectorAll('#operaciones tbody textarea.texto-operacion').length
      if (hasFn('addOperacion')) callIfExists('addOperacion')
      else fallbackAddOperacion()
      const after = Array.from(document.querySelectorAll('#operaciones tbody textarea.texto-operacion'))
      const newly = after[after.length - 1]
      // Safety: if nothing added, stop
      const afterCount = after.length
      if (afterCount <= beforeCount || !newly) break
      setTextareaValue(newly, parsed.text)
      const row = newly.closest('tr')
      const checkbox = row ? row.querySelector('input[type="checkbox"]') : null
      if (checkbox) checkbox.checked = parsed.checked
    }
    return true
  }

  function handlePasteMaterials(target, clipboardText) {
    const lines = splitLines(clipboardText)
    if (lines.length <= 1) return false

    const firstParsed = parseMaterialLine(lines[0])
    setTextareaValue(target, firstParsed.tipo)
    const row = target.closest('tr')
    const qtyInput = row ? row.querySelector('.cantidad-unidad, input[type="text"]') : null
    if (qtyInput) qtyInput.value = firstParsed.cantidad

    for (let i = 1; i < lines.length; i++) {
      const parsed = parseMaterialLine(lines[i])
      const beforeCount = document.querySelectorAll('#filtrosMateriales tbody textarea.material-tipo').length
      if (hasFn('addFiltroMaterialRow')) callIfExists('addFiltroMaterialRow')
      else fallbackAddMaterial()
      const after = Array.from(document.querySelectorAll('#filtrosMateriales tbody textarea.material-tipo'))
      const newly = after[after.length - 1]
      const afterCount = after.length
      if (afterCount <= beforeCount || !newly) break
      setTextareaValue(newly, parsed.tipo)
      const newRow = newly.closest('tr')
      const newQty = newRow ? newRow.querySelector('.cantidad-unidad, input[type="text"]') : null
      if (newQty) {
        newQty.value = parsed.cantidad
        try {
          if (newQty.tagName === 'TEXTAREA' && typeof window.autoResize === 'function') window.autoResize(newQty)
        } catch (_) {}
      }
    }
    return true
  }

  function handlePasteQuantities(target, clipboardText) {
    const lines = splitLines(clipboardText)
    if (lines.length <= 1) return false

    const row = target.closest('tr')
    const tbody = row ? row.closest('tbody') : null
    if (!row || !tbody || !tbody.closest('#filtrosMateriales')) return false

    const startIndex = Array.from(tbody.querySelectorAll('tr')).indexOf(row)
    if (startIndex < 0) return false

    for (let i = 0; i < lines.length; i++) {
      while (tbody.children.length <= startIndex + i) {
        if (hasFn('addFiltroMaterialRow')) callIfExists('addFiltroMaterialRow')
        else fallbackAddMaterial()
      }
      const targetRow = tbody.children[startIndex + i]
      const qtyInput = targetRow ? targetRow.querySelector('.cantidad-unidad, input[type="text"]') : null
      if (qtyInput) {
        qtyInput.value = lines[i]
        try {
          if (qtyInput.tagName === 'TEXTAREA' && typeof window.autoResize === 'function') window.autoResize(qtyInput)
        } catch (_) {}
      }
    }
    return true
  }

  function getRowValues(row) {
    const table = row.closest('#operaciones, #filtrosMateriales')
    if (!table) return []
    if (table.id === 'operaciones') {
      return [
        row.querySelector('textarea.texto-operacion')?.value || '',
        row.querySelector('input[type="checkbox"]')?.checked ? 'SI' : ''
      ]
    }
    return [
      row.querySelector('textarea.material-tipo')?.value || '',
      row.querySelector('.cantidad-unidad, input[type="text"]')?.value || ''
    ]
  }

  function serializeSelectedMaintenanceRows() {
    const table = getTableFromCursor()
    if (!table) return ''
    const fallback = table.id === 'operaciones' ? activeOperacionRow : activeFiltroRow
    const rows = getSelectedRowsForTable(table, fallback)
    if (!rows.length) return ''
    return rows.map((row) => getRowValues(row).join('\t')).join('\n')
  }


  function fixEncodingArtifacts() {
    // Replace common mojibake glyphs in toolbar if any remain
    const acciones = $('.acciones-ficha')
    if (!acciones) return
    acciones.querySelectorAll('button').forEach((b) => {
      b.textContent = (b.textContent || '')
        .replace(/AÃ±adir/g, 'Añadir')
        .replace(/operaciÃ³n/g, 'operación')
        .replace(/âž•/g, '+')
    })
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureToolbar()
    fixEncodingArtifacts()
    wireActions()
    // Retry a few times because `maquinaria_completa.js` can load after DOMContentLoaded.
    ensureCodigoInternoOptions()
    setTimeout(ensureCodigoInternoOptions, 150)
    setTimeout(ensureCodigoInternoOptions, 400)
    setTimeout(ensureCodigoInternoOptions, 900)
    // Hard fallback: parse the JS file and populate options.
    setTimeout(() => void fetchMachineryFallback(), 250)
    setTimeout(() => void fetchMachineryFallback(), 800)

    // Pegar listas: línea por línea en "Tipo de operación" y "Filtros y materiales"
    bind(document, 'paste', (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null
      if (!target) return
      const text = (e.clipboardData && e.clipboardData.getData('text/plain')) || ''
      if (!text) return

      const isOp = target instanceof HTMLTextAreaElement && target.classList.contains('texto-operacion')
      const isMat = target instanceof HTMLTextAreaElement && target.classList.contains('material-tipo')
      const isQty = (
        (target instanceof HTMLInputElement && target.matches('#filtrosMateriales tbody input[type="text"]')) ||
        (target instanceof HTMLTextAreaElement && target.matches('#filtrosMateriales tbody .cantidad-unidad'))
      )
      if (!isOp && !isMat && !isQty) return

      // Only intercept when it's multi-line
      if (!/\r?\n/.test(text)) return

      let handled = false
      if (isOp) handled = handlePasteOperations(target, text)
      if (isMat) handled = handlePasteMaterials(target, text)
      if (isQty) handled = handlePasteQuantities(target, text)
      if (handled) e.preventDefault()
    })

    bind(document, 'copy', (e) => {
      const selection = window.getSelection ? String(window.getSelection() || '') : ''
      if (selection.trim()) return
      const text = serializeSelectedMaintenanceRows()
      if (!text) return
      e.clipboardData.setData('text/plain', text)
      e.preventDefault()
    })
  })
})()
