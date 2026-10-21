export type PurchaseOrderLine = {
  code: string
  name: string
  alias?: string
  quantity: number
  unitCost: number
}

export type PurchaseOrderDraft = {
  code: string
  supplier: string
  supplierAddress?: string
  supplierCp?: string
  supplierCity?: string
  supplierProvince?: string
  supplierNif?: string
  requestedBy: string
  createdAtIso: string
  expectedAtIso?: string
  notes?: string
  lines: PurchaseOrderLine[]
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function openPurchaseOrderPrintWindow(draft: PurchaseOrderDraft) {
  const createdAt = new Date(draft.createdAtIso)
  const expectedAt = draft.expectedAtIso ? new Date(draft.expectedAtIso) : null
  const totalLines = draft.lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0)

  const logoUrl = '/maintenance-sheet-builder/logo_romero_polo.png'
  const ral1007 = '#f2a900'

  const rowsHtml = draft.lines
    .map((line) => {
      const total = line.quantity * line.unitCost
      return `
        <tr>
          <td class="mono">${escapeHtml(line.code)}</td>
          <td>
            <div class="name">${escapeHtml(line.name)}</div>
            ${line.alias ? `<div class="muted">Alias: ${escapeHtml(line.alias)}</div>` : ''}
          </td>
          <td class="num">${line.quantity}</td>
          <td class="num">${line.unitCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
          <td class="num">${total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
        </tr>
      `
    })
    .join('')

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Pedido ${escapeHtml(draft.code)}</title>
    <style>
      :root{ --ral-1007: ${ral1007}; }
      *{ box-sizing:border-box; }
      body{
        margin:0;
        font-family: Arial, Helvetica, sans-serif;
        color:#111827;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background:#f3f4f6;
      }
      @page { size: A4; margin: 12mm; }
      .page{
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: #fff;
        padding: 12mm;
        position: relative;
        overflow: hidden;
      }
      .watermark{
        position:absolute;
        right: 18mm;
        top: 22mm;
        width: 78mm;
        opacity: .06;
        transform: rotate(-18deg);
        pointer-events:none;
        user-select:none;
      }
      .header-row{
        display:flex;
        justify-content:space-between;
        gap: 12px;
        align-items:flex-start;
      }
      .header-title .kicker{
        font-size: 10px;
        letter-spacing: .22em;
        text-transform: uppercase;
        color:#6b7280;
        font-weight: 900;
      }
      .header-title .main{
        margin-top: 6px;
        font-size: 22px;
        font-weight: 900;
      }
      .header-title .code{
        margin-top: 6px;
        font-size: 12px;
        font-weight: 900;
        color: var(--ral-1007);
        letter-spacing: .08em;
      }
      .brand{
        display:flex;
        flex-direction:column;
        align-items:flex-end;
        gap: 4px;
      }
      .brand .name{
        font-weight: 900;
        color: var(--ral-1007);
      }
      .brand .meta{
        font-size: 11px;
        color:#374151;
        text-align:right;
      }
      table{
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      th, td{
        border: 1px solid #000;
        padding: 6px;
        font-size: 12px;
        vertical-align: top;
      }
      th{
        white-space: nowrap;
        width: 1%;
        background:#fff;
        font-weight: 900;
      }
      .section-title{
        background: var(--ral-1007);
        font-weight: 900;
        text-align: left;
        font-size: 11px;
        letter-spacing: .2px;
      }
      .muted{ color:#6b7280; }
      .right{ text-align:right; }
      .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
      .footer{
        margin-top: 10px;
        font-size: 10px;
        color:#6b7280;
        display:flex;
        justify-content:space-between;
        gap: 10px;
      }
      .notes{ white-space: pre-wrap; }
      .totals{
        display:flex;
        justify-content:flex-end;
        margin-top: 10px;
      }
      .totals table{
        width: 64%;
        margin-top: 0;
      }
      @media print {
        body{ background:#fff; }
        .page{ margin:0; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <img class="watermark" src="${logoUrl}" alt="">

      <div class="header-row">
        <div class="header-title">
          <div class="kicker">Propuesta Taller</div>
          <div class="main">Pedido a proveedor</div>
          <div class="code mono">${escapeHtml(draft.code)}</div>
        </div>
        <div class="brand">
          <div class="name">Romero Polo</div>
          <div class="meta">
            <div>Compras / Almacén</div>
            <div class="muted">${escapeHtml(new Date().toLocaleDateString('es-ES'))}</div>
          </div>
        </div>
      </div>

      <table>
        <tr><td colspan="4" class="section-title">DATOS DEL PEDIDO</td></tr>
        <tr>
          <th>PROVEEDOR</th>
          <td colspan="3">${escapeHtml(draft.supplier || '—')}</td>
        </tr>
        <tr>
          <th>SOLICITADO POR</th>
          <td>${escapeHtml(draft.requestedBy || '—')}</td>
          <th>FECHA</th>
          <td>${escapeHtml(createdAt.toLocaleDateString('es-ES'))}</td>
        </tr>
        <tr>
          <th>ENTREGA ESTIMADA</th>
          <td>${escapeHtml(expectedAt ? expectedAt.toLocaleDateString('es-ES') : '—')}</td>
          <th>REFERENCIA</th>
          <td class="mono">${escapeHtml(draft.code)}</td>
        </tr>
        <tr>
          <th>NOTAS</th>
          <td colspan="3" class="notes">${draft.notes ? escapeHtml(draft.notes) : '—'}</td>
        </tr>
      </table>

      <table>
        <tr><td colspan="5" class="section-title">LÍNEAS DE PEDIDO</td></tr>
        <tr>
          <th style="width: 180px;">Código</th>
          <th>Material</th>
          <th class="right" style="width: 90px;">Cantidad</th>
          <th class="right" style="width: 120px;">Coste unit.</th>
          <th class="right" style="width: 130px;">Total</th>
        </tr>
        ${rowsHtml || `<tr><td colspan="5" class="muted">Sin líneas</td></tr>`}
      </table>

      <div class="totals">
        <table>
          <tr><th>TOTAL</th><td class="right"><strong>${totalLines.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</strong></td></tr>
        </table>
      </div>

      <div class="footer">
        <div>Documento generado desde RP Taller</div>
        <div class="muted">Impresión: ${escapeHtml(new Date().toLocaleString('es-ES'))}</div>
      </div>
    </div>
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => window.print(), 250);
      });
    </script>
  </body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const printWindow = window.open(url, '_blank', 'noopener,noreferrer,width=1024,height=720')
  if (!printWindow) {
    URL.revokeObjectURL(url)
    throw new Error('No se pudo abrir la ventana de impresión (bloqueador de popups).')
  }

  // Liberar el blob cuando ya haya cargado el documento
  const revoke = () => URL.revokeObjectURL(url)
  printWindow.addEventListener?.('load', revoke, { once: true } as any)
  // Fallback por si no se dispara load
  window.setTimeout(revoke, 60000)
}
