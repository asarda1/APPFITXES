;(function () {
  const DOCUMENT_ID = 'technical-print-document'
  const style = document.createElement('style')
  style.textContent = `
    #${DOCUMENT_ID}{display:none;}
    @media print{
      @page{
        size:A4;
        margin:12mm;
        @bottom-right{content:counter(page) "/" counter(pages);font:9px Arial;color:#374151;}
      }
      body > *:not(#${DOCUMENT_ID}){display:none !important;}
      #${DOCUMENT_ID}{display:block !important;}
      #${DOCUMENT_ID} > :not(.technical-print-watermark){position:relative;z-index:1;}
      #${DOCUMENT_ID} .technical-print-watermark{
        position:fixed;left:0;top:0;width:186mm;height:273mm;
        object-fit:contain;opacity:.12;z-index:0;pointer-events:none;
      }
      #${DOCUMENT_ID} .technical-print-group{break-inside:avoid;page-break-inside:avoid;}
      #${DOCUMENT_ID} thead{display:table-header-group;break-inside:avoid;}
      #${DOCUMENT_ID} thead tr{break-after:avoid;}
      #${DOCUMENT_ID} tr{break-inside:avoid;page-break-inside:avoid;}
      #${DOCUMENT_ID} .section-title{width:auto !important;letter-spacing:0;}
      #${DOCUMENT_ID} th,#${DOCUMENT_ID} td{white-space:normal;overflow-wrap:anywhere;}
      #${DOCUMENT_ID} .print-field{
        display:block;box-sizing:border-box;min-height:28px;max-width:100%;
        border:.75pt solid #000;padding:4px 6px;font-size:13px;line-height:1.25;
        white-space:pre-wrap;overflow-wrap:anywhere;font-weight:normal;
      }
      #${DOCUMENT_ID} .print-field.kv-key-input{border:0;padding:0;font-weight:700;}
      #${DOCUMENT_ID} .print-field.material-tipo{font-weight:700;}
      #${DOCUMENT_ID} .foto-maquina img{max-height:240mm;object-fit:contain;}
      #${DOCUMENT_ID} .footer{break-inside:avoid;}
    }
  `
  document.head.appendChild(style)

  function printClone(source) {
    const clone = source.cloneNode(true)
    const originalFields = Array.from(source.querySelectorAll('input, textarea, select'))
    clone.querySelectorAll('input, textarea, select').forEach((field, index) => {
      if (field.type === 'file') {
        field.remove()
        return
      }
      const value = document.createElement('div')
      value.className = 'print-field ' + field.className
      value.textContent = originalFields[index].value
      field.replaceWith(value)
    })
    clone.querySelectorAll('.photo-actions, .photo-placeholder, datalist, .no-print').forEach((el) => el.remove())
    ;[clone, ...clone.querySelectorAll('*')].forEach((el) => {
      Array.from(el.attributes).forEach((attribute) => {
        if (/^(id|contenteditable|on.*|data-.*)$/.test(attribute.name)) el.removeAttribute(attribute.name)
      })
      el.classList.remove('is-active', 'is-active-row', 'is-selected-row', 'is-active-photo')
    })
    return clone
  }

  function printGroup(group) {
    // A flat table lets the browser repeat the title if a group exceeds one page.
    const table = document.createElement('table')
    table.className = 'technical-print-group'
    const head = table.createTHead()
    const title = head.insertRow().insertCell()
    title.colSpan = 2
    title.className = 'section-title'
    title.textContent = group.querySelector('.section-title')?.textContent || ''
    const materialHead = group.querySelector('table thead')
    if (materialHead) Array.from(materialHead.rows).forEach((row) => head.appendChild(printClone(row)))
    const body = table.createTBody()
    group.querySelectorAll('[data-rows] > tr').forEach((row) => body.appendChild(printClone(row)))
    return table
  }

  function preparePrint() {
    document.getElementById(DOCUMENT_ID)?.remove()
    const source = document.querySelector('#pantalla-ficha-tecnica .page')
    if (!source) return
    const output = document.createElement('div')
    output.id = DOCUMENT_ID
    const watermark = document.createElement('img')
    watermark.className = 'technical-print-watermark'
    watermark.src = source.querySelector('.marca-agua').src
    watermark.alt = ''
    output.appendChild(watermark)
    Array.from(source.children).forEach((child) => {
      if (child.id === 'tec-groups') {
        Array.from(child.children).forEach((item) => {
          output.appendChild(item.matches('[data-group]') ? printGroup(item) : printClone(item))
        })
      } else if (child.matches('.header-row, .tec-header, [data-photo], .footer')) {
        output.appendChild(printClone(child))
      }
    })
    document.body.appendChild(output)
  }

  window.imprimirPDF = function () { window.print() }
  window.addEventListener('beforeprint', preparePrint)
  window.addEventListener('afterprint', () => document.getElementById(DOCUMENT_ID)?.remove())
})()
