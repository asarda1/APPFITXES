export class SheetPdfError extends Error {}

const norm = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[º°]/g, 'O').toUpperCase().replace(/[^A-Z0-9]/g, '')
const inside = (item, box, margin = 1) => item.x + item.width / 2 >= box.x - margin
  && item.x + item.width / 2 <= box.x + box.width + margin
  && item.y + item.height / 2 >= box.y - margin && item.y + item.height / 2 <= box.y + box.height + margin
const orange = (color) => /^#[a-f\d]{6}$/i.test(color) && parseInt(color.slice(1, 3), 16) > 180
  && parseInt(color.slice(3, 5), 16) > 80 && parseInt(color.slice(5, 7), 16) < 80

function unique(rectangles) {
  const seen = new Set()
  return rectangles.filter((item) => {
    const key = [item.x, item.y, item.width, item.height].map((v) => Math.round(v * 2)).join(',')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function textIn(page, box) {
  const lines = []
  for (const item of page.texts.filter((item) => inside(item, box)).sort((a, b) => a.y - b.y || a.x - b.x)) {
    const line = lines.find((line) => Math.abs(line.y - item.y) < Math.max(2, item.height * 0.3))
    if (line) line.items.push(item)
    else lines.push({ y: item.y, items: [item] })
  }
  return lines.map((line) => line.items.sort((a, b) => a.x - b.x).map((item) => item.text).join(' ').trim()).join('\n').trim()
}

function fields(page, region) {
  return unique(page.shapes.filter((shape) => shape.stroke && shape.isRectangle && shape.alpha >= 0.8
    && shape.width > 30 && shape.width < page.width * 0.82 && shape.height > 8 && shape.y >= region.y - 1
    && shape.y + shape.height <= region.y + region.height + 2))
    .sort((a, b) => a.y - b.y || a.x - b.x)
}

function rows(boxes) {
  const result = []
  for (const box of boxes) {
    const row = result.find((row) => Math.abs(row.y - box.y) < 2)
    if (row) row.fields.push(box)
    else result.push({ y: box.y, fields: [box] })
  }
  return result.map((row) => ({ ...row, fields: row.fields.sort((a, b) => a.x - b.x) }))
}

function headings(page) {
  return unique(page.shapes.filter((shape) => shape.fill && shape.alpha >= 0.8 && orange(shape.color)
    && shape.width > page.width * 0.6 && shape.height > 8 && shape.height < 100))
    .sort((a, b) => a.y - b.y).map((box) => ({ ...box, title: textIn(page, box) }))
}

function headerRows(page, firstHeading) {
  const machineLabel = page.texts.find((item) => norm(item.text) === 'MAQUINA')
  if (!machineLabel) throw new SheetPdfError('No s\'ha pogut llegir la capçalera del PDF amb el format de l\'aplicació.')
  const top = machineLabel.y - 12
  const result = rows(fields(page, { y: top, height: firstHeading.y - top }))
  if (result.length !== 3 || result[0].fields.length !== 2 || result[2].fields.length !== 2
    || ![1, 2].includes(result[1].fields.length)) {
    throw new SheetPdfError('La capçalera d\'aquest PDF no correspon al format de l\'aplicació.')
  }
  return result.map((row) => row.fields.map((box) => textIn(page, box)))
}

const generalFields = {
  MARCA: ['marca', 'tec_marca'], MODELO: ['modelo', 'tec_modelo'],
  FECHADECOMPRA: ['fechaCompra', 'tec_fecha_compra'], VALORDECOMPRA: ['valorCompra', 'tec_valor_compra'],
  MOTOR: ['motor', 'tec_motor'], POTENCIA: ['potencia', 'tec_potencia'],
  CONSUMOESTIMADO: ['consumoEstimado', 'tec_consumo_estimado'], ESTADO: ['estado', 'tec_estado'],
}
const isMaterials = (title) => /^FILTROS?YMATERIALES$/.test(norm(title))

function headerBands(page) {
  return page.texts.filter((item) => norm(item.text) === 'MAQUINA').flatMap((machine) => {
    const serial = page.texts.find((item) => norm(item.text) === 'NOBASTIDORSERIE' && item.y > machine.y && item.y < machine.y + 180)
    const code = page.texts.find((item) => norm(item.text) === 'CODIGONOINTERNO' && item.y > machine.y && item.y < (serial?.y || 0))
    return serial && code ? [{ top: machine.y - 12, bottom: serial.y + 30 }] : []
  })
}

function materialRows(page, section, excludeHeaders = false) {
  const bands = excludeHeaders ? headerBands(page) : []
  const boxes = fields(page, section).filter((box) => !bands.some((band) => box.y >= band.top && box.y <= band.bottom))
  return rows(boxes).map((row) => {
    if (row.fields.length !== 2) throw new SheetPdfError('No s\'ha pogut llegir una fila de filtres i materials.')
    return { tipo: textIn(page, row.fields[0]), cantidadUnidad: textIn(page, row.fields[1]) }
  })
}

function keyValueRows(page, section) {
  const groups = rows(fields(page, section))
  return groups.map((row, index) => {
    const value = row.fields[row.fields.length - 1]
    const bottom = groups[index + 1]?.y - 3 || section.y + section.height
    const key = row.fields.length > 1 ? textIn(page, row.fields[0]) : textIn(page, {
      x: section.x, y: row.y - 2, width: value.x - section.x - 2, height: bottom - row.y + 2,
    })
    return { caracteristica: key, valor: textIn(page, value) }
  })
}

function opaqueImages(page) {
  return page.images.map((image, index) => ({ ...image, index })).filter((image) => image.alpha >= 0.8 && image.width > 15 && image.height > 15)
}

function sectionsFor(page) {
  const titles = headings(page)
  const footer = page.texts.find((item) => norm(item.text).includes('CIFA25036880'))
  return titles.map((title, index) => ({ ...title, headingY: title.y, y: title.y + title.height,
    height: (titles[index + 1]?.y ?? footer?.y ?? page.height - 25) - title.y - title.height }))
}

function technical(pages) {
  const header = headerRows(pages[0], headings(pages[0])[0])
  const data = { layoutVersion: 2, cabecera: { maquina: header[0][0], codigoInterno: header[0][1], marcaModelo: header[1][0],
    matricula: header[2][0], anyo: header[2][1] }, caracteristicasGenerales: { numeroSerieBastidor: header[1][1] || '' },
    grupos: [], filtrosMateriales: [], imagenPrincipal: { src: '' }, layout: [] }
  const media = []
  let previous = null
  const usedIds = new Set()
  pages.forEach((page, pageIndex) => {
    const sections = sectionsFor(page)
    if (pageIndex > 0 && previous) {
      const leading = { x: 0, width: page.width, headingY: 0, y: 20, height: (sections[0]?.headingY || page.height - 25) - 20,
        title: previous.item.title || previous.item.group?.titulo || '' }
      if (fields(page, leading).length) sections.unshift(leading)
    }
    const events = sections.map((section, index) => ({ type: 'group', y: section.headingY, section, index }))
      .concat(opaqueImages(page).map((image) => ({ type: 'photo', y: image.y, image }))).sort((a, b) => a.y - b.y)
    events.forEach((event) => {
      if (event.type === 'photo') {
        const primary = pageIndex === 0 && !data.layout.some((item) => item.type === 'group') && !media.some((item) => item.primary)
        if (!primary) data.layout.push({ type: 'photo', photo: { src: '' } })
        media.push({ pageIndex, imageIndex: event.image.index, primary, layoutIndex: data.layout.length - 1 })
        return
      }
      const section = event.section, key = norm(section.title)
      const kind = key === 'CARACTERISTICASGENERALES' ? 'general' : isMaterials(section.title) ? 'materials' : 'keyvalue'
      const continuation = pageIndex > 0 && event.index === 0 && previous?.key === key
      let item = continuation ? previous.item : { type: 'group', kind, title: section.title }
      if (!continuation) {
        if (kind === 'general') item.filas = []
        if (kind === 'keyvalue') {
          item = { ...item, group: { titulo: section.title || 'GRUPO', filas: [] } }
          data.grupos.push(item.group)
        }
        data.layout.push(item)
      }
      if (kind === 'materials') data.filtrosMateriales.push(...materialRows(page, section))
      else {
        for (const row of keyValueRows(page, section)) {
          if (kind === 'keyvalue') { item.group.filas.push(row); continue }
          const label = norm(row.caracteristica)
          if (/^(NUMERODESERIEBASTIDOR|NODESERIEBASTIDOR|NOBASTIDORSERIE)$/.test(label)) {
            if (!data.caracteristicasGenerales.numeroSerieBastidor) data.caracteristicasGenerales.numeroSerieBastidor = row.valor
            continue
          }
          const known = generalFields[label]
          const fieldId = known && !usedIds.has(known[1]) ? known[1] : ''
          if (fieldId) { usedIds.add(fieldId); data.caracteristicasGenerales[known[0]] = row.valor }
          item.filas.push({ ...row, fieldId, editable: !fieldId })
        }
      }
      previous = { key, item }
    })
  })
  return { tipoFicha: 'tecnica', data, media }
}

function checked(page, box, bottom, right) {
  return page.shapes.some((shape) => shape.fill && shape.alpha >= 0.8 && shape.width > 2 && shape.width < 16
    && shape.height > 2 && shape.height < 16 && shape.x > box.x + box.width && shape.x < right
    && shape.y >= box.y - 2 && shape.y + shape.height <= bottom
    && /^#[0-9a-f]{6}$/i.test(shape.color) && parseInt(shape.color.slice(5, 7), 16) > 120
    && parseInt(shape.color.slice(1, 3), 16) < 100)
}

function date(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''
}

function maintenance(pages) {
  const header = headerRows(pages[0], headings(pages[0])[0])
  if (header[1].length !== 2) throw new SheetPdfError('La capçalera de manteniment no es pot llegir.')
  const firstLabel = pages[0].texts.find((item) => norm(item.text) === 'MANTENIMIENTO')
  const maintenanceTitle = firstLabel ? textIn(pages[0], { x: firstLabel.x + firstLabel.width + 2, y: firstLabel.y - 4,
    width: pages[0].width * 0.35, height: firstLabel.height + 8 }) : ''
  const data = { mantenimiento: maintenanceTitle, maquina: { tipoMaquina: header[0][0], marcaModelo: header[0][1],
    codigoInterno: header[1][0], matricula: header[1][1], bastidorSerie: header[2][0], horasTrabajoKilometros: header[2][1] },
    operaciones: [], filtrosMateriales: [], observacionesGenerales: '', responsable: '', fecha: '', firma: '' }
  const media = [], found = new Set()
  pages.forEach((page, pageIndex) => sectionsFor(page).forEach((section) => {
    const key = norm(section.title)
    found.add(key)
    if (key === 'TIPODEOPERACION') {
      const boxes = fields(page, section).filter((box) => box.width > page.width * 0.3)
      boxes.forEach((box, index) => data.operaciones.push({ descripcion: textIn(page, box),
        realizada: checked(page, box, boxes[index + 1]?.y || section.y + section.height, section.x + section.width) }))
    } else if (isMaterials(section.title)) data.filtrosMateriales.push(...materialRows(page, section, true))
    else if (key === 'OBSERVACIONESGENERALES') {
      const boxes = fields(page, section)
      const observations = boxes.find((box) => box.width > page.width * 0.6)
      if (!observations) throw new SheetPdfError('No s\'ha pogut llegir el bloc d\'observacions del PDF.')
      data.observacionesGenerales = textIn(page, observations)
      const signatureFields = boxes.filter((box) => box.y > observations.y + observations.height)
      if (signatureFields[0]) data.responsable = textIn(page, signatureFields[0])
      if (signatureFields[1]) data.fecha = date(textIn(page, signatureFields[1]))
      const signature = page.texts.find((item) => norm(item.text) === 'FIRMA')
      if (signature) {
        const image = opaqueImages(page).find((image) => image.y + image.height / 2 > signature.y)
        if (image) media.push({ pageIndex, imageIndex: image.index, signature: true })
      }
    } else throw new SheetPdfError('Aquest PDF conté blocs que no corresponen a una fitxa de manteniment de l\'aplicació.')
  }))
  if (!found.has('TIPODEOPERACION') || !Array.from(found).some((key) => isMaterials(key)) || !found.has('OBSERVACIONESGENERALES')) {
    throw new SheetPdfError('Falten blocs del format de manteniment de l\'aplicació.')
  }
  return { tipoFicha: 'mantenimiento', data, media }
}

export function parseSheetPdf(pages, expectedType) {
  if (!pages.length || !pages.some((page) => page.texts.length)) throw new SheetPdfError('No es pot llegir aquest PDF. Ha de contenir text, no una imatge escanejada.')
  const signature = norm(pages.flatMap((page) => page.texts.map((item) => item.text)).join(' '))
  if (!signature.includes('ROMEROPOLO') || !signature.includes('CIFA25036880')) {
    throw new SheetPdfError('Aquest PDF no correspon al format de fitxes de l\'aplicació.')
  }
  const type = signature.includes('FICHATECNICAESPECIFICACIONES') ? 'tecnica'
    : signature.includes('MANTENIMIENTO') && signature.includes('TIPODEOPERACION') ? 'mantenimiento' : null
  if (!type) throw new SheetPdfError('No es reconeix el format d\'aquesta fitxa PDF.')
  if (type !== expectedType) throw new SheetPdfError(type === 'tecnica'
    ? 'Aquest PDF és una fitxa tècnica. Importa\'l des de la fitxa tècnica.'
    : 'Aquest PDF és una fitxa de manteniment. Importa\'l des de manteniments.')
  if (!headings(pages[0]).length) throw new SheetPdfError('No es reconeixen les taules del format de l\'aplicació.')
  return type === 'tecnica' ? technical(pages) : maintenance(pages)
}
