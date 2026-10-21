import { parseSheetPdf, SheetPdfError } from './parser.mjs'

const technical = Boolean(document.getElementById('tec-groups'))
const type = technical ? 'tecnica' : 'mantenimiento'
const label = technical ? 'Importar ficha técnica' : 'Importar ficha mantenimiento'
let currentJob = null, sourceUrl = null, sourceLink = null

function autosave() {
  return technical ? window.rpFichasAutosaveTecnica : window.rpFichasAutosaveMantenimiento
}

function showDialog(file) {
  const overlay = document.createElement('div')
  overlay.className = 'sheet-pdf-overlay no-print'
  const dialog = document.createElement('section')
  dialog.className = 'sheet-pdf-dialog'
  dialog.setAttribute('role', 'dialog')
  dialog.setAttribute('aria-modal', 'true')
  dialog.setAttribute('aria-labelledby', 'sheet-pdf-title')
  const title = document.createElement('h2')
  title.id = 'sheet-pdf-title'
  title.textContent = label
  const name = document.createElement('p')
  name.className = 'sheet-pdf-filename'
  name.textContent = file.name
  const message = document.createElement('p')
  message.className = 'sheet-pdf-message'
  message.setAttribute('role', 'status')
  message.textContent = 'Llegint PDF...'
  const close = document.createElement('button')
  close.type = 'button'
  close.textContent = 'Cancel·lar'
  close.addEventListener('click', () => {
    if (currentJob) { currentJob.cancelled = true; currentJob.task?.destroy().catch(() => {}) }
    overlay.remove()
  })
  dialog.append(title, name, message, close)
  overlay.appendChild(dialog)
  document.body.appendChild(overlay)
  close.focus()
  return { overlay, message, close }
}

async function readFile(file, job, dialog) {
  if (!file.size || file.size > 25 * 1024 * 1024) throw new SheetPdfError('El PDF ha de tenir una mida inferior a 25 MB.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const prefix = new TextDecoder('latin1').decode(bytes.subarray(0, 1024))
  if (!prefix.includes('%PDF-')) throw new SheetPdfError('El fitxer seleccionat no és un PDF vàlid.')
  const { openPdf, extractPage, imageDataUrl } = await import('./extract.mjs')
  if (job.cancelled) return null
  job.task = await openPdf(bytes)
  const pdf = await job.task.promise
  if (pdf.numPages > 50) throw new SheetPdfError('El PDF supera el límit de 50 pàgines.')
  const pages = [], geometries = []
  for (let number = 1; number <= pdf.numPages; number++) {
    if (job.cancelled) return null
    dialog.message.textContent = `Llegint pàgina ${number} de ${pdf.numPages}...`
    const page = await pdf.getPage(number)
    pages.push(page)
    geometries.push(await extractPage(page))
  }
  const result = parseSheetPdf(geometries, type)
  for (const media of result.media) {
    if (job.cancelled) return null
    const image = geometries[media.pageIndex].images[media.imageIndex]
    const src = await imageDataUrl(pages[media.pageIndex], image)
    if (media.signature) result.data.firma = src
    else if (media.primary) result.data.imagenPrincipal.src = src
    else result.data.layout[media.layoutIndex].photo.src = src
  }
  return result
}

function applyData(data) {
  const api = autosave()
  if (!api) throw new SheetPdfError('No s\'ha pogut preparar la fitxa per importar el PDF.')
  const before = api.collectDraftData({ includeMedia: true })
  const root = document.querySelector('.page')
  if (technical) {
    before.imagenPrincipal = { src: root.querySelector(':scope > [data-photo] img')?.getAttribute('src') || '' }
    Array.from(document.querySelector('#tec-groups').children).forEach((node, index) => {
      if (node.matches('[data-photo]') && before.layout[index]?.photo) before.layout[index].photo.src = node.querySelector('img')?.getAttribute('src') || ''
    })
  } else before.firma = document.getElementById('firmaImg')?.getAttribute('src') || ''
  if (technical && typeof window.saveUndoSnapshot === 'function') window.saveUndoSnapshot()
  api.suspendAutosave()
  try {
    api.restoreDraftData(data, { exactLayout: true })
    // restoreDraftData updates the signature, so persist this import explicitly.
    try {
      localStorage.setItem(api.draftKey, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), data }))
    } catch (_) {
      throw new SheetPdfError('No hi ha prou espai al navegador per desar aquesta fitxa. La fitxa anterior es conserva.')
    }
  } catch (error) {
    api.restoreDraftData(before, { exactLayout: true })
    throw error
  } finally {
    api.resumeAutosave()
  }
}

function errorMessage(error) {
  if (error instanceof SheetPdfError) return error.message
  if (error?.name === 'PasswordException') return 'El PDF està protegit amb contrasenya. Importa\'n una còpia sense protecció.'
  return 'No s\'ha pogut llegir aquest PDF amb el format de l\'aplicació. La fitxa actual es conserva.'
}

function init() {
  const bar = document.querySelector('.acciones-ficha')
  if (!bar) return
  const style = document.createElement('style')
  style.textContent = `
    .sheet-pdf-overlay{position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;background:#0006;padding:20px;box-sizing:border-box;}
    .sheet-pdf-dialog{background:#fff;border:1px solid #f2a900;border-radius:8px;padding:20px;width:min(430px,100%);box-sizing:border-box;color:#111827;font:14px/1.5 Arial;}
    .sheet-pdf-dialog h2{margin:0 0 12px;font-size:18px;}
    .sheet-pdf-filename{overflow-wrap:anywhere;color:#64748b;}
    .sheet-pdf-message{white-space:pre-wrap;overflow-wrap:anywhere;}
    .sheet-pdf-message.is-error{color:#991b1b;}
    .sheet-pdf-source{font:12px Arial;color:#475569;white-space:nowrap;}
    @media print{.sheet-pdf-overlay,.sheet-pdf-source{display:none!important;}}
  `
  document.head.appendChild(style)
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,application/pdf'
  input.id = 'sheet-pdf-file'
  input.hidden = true
  input.className = 'no-print'
  const button = document.createElement('button')
  button.type = 'button'
  button.id = 'btnImportSheetPdf'
  button.textContent = label
  button.className = 'no-print'
  button.addEventListener('click', () => { input.value = ''; input.click() })
  bar.insertBefore(button, document.getElementById('btnImportChatGPT') || bar.querySelector('button[onclick="guardarPDF()"]'))
  bar.appendChild(input)
  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file || currentJob) return
    const job = { cancelled: false, task: null }
    currentJob = job
    button.disabled = true
    const dialog = showDialog(file)
    let timer
    try {
      const result = await Promise.race([
        readFile(file, job, dialog),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new SheetPdfError('La lectura del PDF ha superat el temps permès. Prova amb un document més petit.')), 60000) }),
      ])
      if (!result || job.cancelled) return
      if (window.rpTemplatesMantenimiento?.isEditingTemplate()) throw new SheetPdfError('Acaba o cancel·la l\'edició de la plantilla abans d\'importar una fitxa PDF.')
      applyData(result.data)
      if (sourceUrl) URL.revokeObjectURL(sourceUrl)
      sourceUrl = URL.createObjectURL(file)
      if (!sourceLink) {
        sourceLink = document.createElement('a')
        sourceLink.className = 'sheet-pdf-source no-print'
        sourceLink.textContent = 'PDF original'
        sourceLink.target = '_blank'
        sourceLink.rel = 'noopener'
        bar.appendChild(sourceLink)
      }
      sourceLink.href = sourceUrl
      sourceLink.title = file.name
      dialog.overlay.remove()
      const importer = technical ? window.rpChatGptImporterTecnica : window.rpChatGptImporterMantenimiento
      importer?.showToast('PDF importat. La fitxa ja es pot editar.')
    } catch (error) {
      if (!job.cancelled) {
        dialog.message.textContent = errorMessage(error)
        dialog.message.classList.add('is-error')
        dialog.message.setAttribute('role', 'alert')
        dialog.close.textContent = 'Tancar'
      }
    } finally {
      job.cancelled = true
      clearTimeout(timer)
      try { await job.task?.destroy() } catch (_) {}
      button.disabled = false
      currentJob = null
      input.value = ''
    }
  })
}

if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', init)
else init()
