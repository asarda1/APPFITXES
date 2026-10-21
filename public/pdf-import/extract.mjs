import * as pdfjs from './vendor/pdf.mjs'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.mjs', import.meta.url).href

function rect(bounds, matrix) {
  const points = [[bounds[0], bounds[1]], [bounds[2], bounds[1]], [bounds[0], bounds[3]], [bounds[2], bounds[3]]]
    .map((point) => { pdfjs.Util.applyTransform(point, matrix); return point })
  const x = Math.min(...points.map((point) => point[0])), y = Math.min(...points.map((point) => point[1]))
  return { x, y, width: Math.max(...points.map((point) => point[0])) - x, height: Math.max(...points.map((point) => point[1])) - y }
}

function color(args) {
  if (typeof args[0] === 'string') return args[0].toLowerCase()
  const rgb = Array.isArray(args[0]) || ArrayBuffer.isView(args[0]) ? Array.from(args[0]) : args
  return '#' + rgb.slice(0, 3).map((v) => Math.round(v <= 1 ? v * 255 : v).toString(16).padStart(2, '0')).join('')
}

export async function extractPage(page) {
  const viewport = page.getViewport({ scale: 1 })
  const [content, operators] = await Promise.all([page.getTextContent(), page.getOperatorList()])
  if (content.items.length > 100000 || operators.fnArray.length > 500000) throw new Error('El PDF és massa complex per importar-lo.')
  const texts = content.items.filter((item) => 'str' in item && item.str.trim()).map((item) => {
    const m = pdfjs.Util.transform(viewport.transform, item.transform)
    return { text: item.str, x: m[4], y: m[5] - item.height, width: item.width, height: item.height }
  })
  let state = { matrix: viewport.transform, alpha: 1, groupAlpha: 1, fill: '#000000' }
  const stack = [], shapes = [], images = []
  const save = () => stack.push({ ...state, matrix: [...state.matrix] })
  const restore = () => { if (stack.length) state = stack.pop() }
  const transform = (matrix) => { if (matrix) state.matrix = pdfjs.Util.transform(state.matrix, matrix) }
  const addImage = (id, inline, matrix = state.matrix) => images.push({
    ...rect([0, 0, 1, 1], matrix), id, inline, alpha: Math.min(state.alpha, state.groupAlpha),
  })
  const { OPS } = pdfjs
  for (let index = 0; index < operators.fnArray.length; index++) {
    const fn = operators.fnArray[index], args = operators.argsArray[index]
    if (fn === OPS.save) save()
    else if (fn === OPS.restore) restore()
    else if (fn === OPS.transform) transform(args)
    else if (fn === OPS.paintFormXObjectBegin) { save(); transform(args[0]) }
    else if (fn === OPS.paintFormXObjectEnd || fn === OPS.endGroup) restore()
    else if (fn === OPS.beginGroup) {
      save()
      state.groupAlpha = Math.min(state.alpha, state.groupAlpha)
      transform(args[0]?.matrix)
    } else if (fn === OPS.setGState) {
      for (const [key, value] of args[0]) if (key === 'ca') state.alpha = value
    } else if (fn === OPS.setFillRGBColor) state.fill = color(args)
    else if (fn === OPS.constructPath && args[2] && args[0] !== OPS.endPath) {
      const [op, paths, bounds] = args
      const path = paths[0]
      const isRectangle = path?.length === 13 && path[0] === 0 && path[3] === 1 && path[6] === 1 && path[9] === 1 && path[12] === 4
      shapes.push({ ...rect(bounds, state.matrix), fill: op !== OPS.stroke && op !== OPS.closeStroke,
        stroke: op === OPS.stroke || op === OPS.closeStroke, color: state.fill,
        alpha: Math.min(state.alpha, state.groupAlpha), isRectangle })
    } else if (fn === OPS.paintImageXObject) addImage(args[0])
    else if (fn === OPS.paintInlineImageXObject) addImage(null, args[0])
    else if (fn === OPS.paintImageXObjectRepeat) {
      for (let p = 0; p < args[3].length; p += 2) {
        addImage(args[0], null, pdfjs.Util.transform(state.matrix, [args[1], 0, 0, args[2], args[3][p], args[3][p + 1]]))
      }
    }
  }
  return { width: viewport.width, height: viewport.height, texts, shapes, images, pageNumber: page.pageNumber }
}

export async function openPdf(bytes) {
  return pdfjs.getDocument({
    data: bytes, isEvalSupported: false, stopAtErrors: true,
    standardFontDataUrl: new URL('./vendor/standard_fonts/', import.meta.url).href,
  })
}

export async function imageDataUrl(page, image) {
  const data = image.inline || await new Promise((resolve, reject) => {
    const pool = image.id?.startsWith('g_') ? page.commonObjs : page.objs
    const timer = setTimeout(() => reject(new Error('No s\'ha pogut recuperar una imatge del PDF.')), 10000)
    pool.get(image.id, (value) => { clearTimeout(timer); resolve(value) })
  })
  if (!data?.width || !data?.height || data.width * data.height > 16000000) throw new Error('Una imatge del PDF supera la mida permesa.')
  const canvas = document.createElement('canvas')
  canvas.width = data.width
  canvas.height = data.height
  const context = canvas.getContext('2d')
  if (data.bitmap) context.drawImage(data.bitmap, 0, 0)
  else {
    const rgba = new Uint8ClampedArray(data.width * data.height * 4)
    for (let i = 0; i < data.width * data.height; i++) {
      if (data.kind === pdfjs.ImageKind.RGBA_32BPP) rgba.set(data.data.subarray(i * 4, i * 4 + 4), i * 4)
      else if (data.kind === pdfjs.ImageKind.RGB_24BPP) rgba.set([data.data[i * 3], data.data[i * 3 + 1], data.data[i * 3 + 2], 255], i * 4)
      else {
        const value = data.data[i >> 3] & (128 >> (i & 7)) ? 255 : 0
        rgba.set([value, value, value, 255], i * 4)
      }
    }
    context.putImageData(new ImageData(rgba, data.width, data.height), 0, 0)
  }
  return canvas.toDataURL('image/png')
}
