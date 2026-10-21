import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock3,
  Download,
  Euro,
  ExternalLink,
  FileText,
  Info,
  MapPinned,
  Package,
  ScrollText,
  Settings2,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react'
import { workshopAssets } from './MachineryModulePage'

export function MachineryDetailPage() {
  const { assetId } = useParams()
  const asset = workshopAssets.find((item) => item.id === assetId)
  const [editableFields, setEditableFields] = useState(() => ({
    brand: asset?.brand ?? '',
    model: asset?.model ?? '',
    fuelType: asset?.fuelType ?? '',
  }))

  if (!asset) {
    return <Navigate to="/assets-and-machinery" replace />
  }

  return (
    <div className="h-full min-h-0 space-y-6 overflow-y-auto pr-1">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/assets-and-machinery"
            className="rounded-lg border p-2 transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Maquinaria · Detalle
            </div>
            <h2 className="text-3xl font-bold">{asset.internalCode}</h2>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div
          className="flex items-center gap-2 px-6 py-4 text-white"
          style={{ backgroundColor: 'rgb(250, 166, 26)' }}
        >
          <Info className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Información Básica</h3>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[320px_1fr]">
          <div className="overflow-hidden rounded-lg bg-muted">
            <img
              src={asset.photo}
              alt={`${editableFields.brand} ${editableFields.model}`}
              className="h-full min-h-[250px] w-full object-cover"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <BasicInfoBox label="Familia" value={asset.family} source="ERP" />
            <BasicInfoBox label="Empresa propietaria" value="Asfalteros Grupo" source="ERP" />
            <BasicInfoBox label="Matrícula" value={asset.registration} source="ERP" />
            <BasicInfoBox label="Fecha de adquisición" value={formatSpanishDate(asset.acquisitionDate)} source="ERP" />
            <BasicInfoBox label="Ubicación" value={asset.location} source="VEOSAT" />
            <EditableBasicInfoBox
              label="Marca"
              value={editableFields.brand}
              source="Editable aquí"
              onChange={(value) => setEditableFields((current) => ({ ...current, brand: value }))}
            />
            <BasicInfoBox label="Número de serie" value={asset.serialNumber} source="ERP" />
            <BasicInfoBox label="Coste de adquisición" value={asset.acquisitionCost} source="ERP" />
            <BasicInfoBox label="Precio venta" value={asset.salePrice} source="ERP" />
            <BasicInfoBox label="Horas acumuladas" value={asset.currentHours} source="VEOSAT" />
            <EditableBasicInfoBox
              label="Modelo"
              value={editableFields.model}
              source="Editable aquí"
              onChange={(value) => setEditableFields((current) => ({ ...current, model: value }))}
            />
            <EditableBasicInfoBox
              label="Combustible"
              value={editableFields.fuelType}
              source="Editable aquí"
              onChange={(value) => setEditableFields((current) => ({ ...current, fuelType: value }))}
            />
            <BasicInfoBox
              label="Gastos acumulados"
              value={asset.accumulatedExpenses}
              source="Automático desde gastos registrados"
            />
            <BasicInfoBox label="Estado" value={asset.status} source="Por definir" accent />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div
            className="flex items-center gap-2 px-6 py-4 text-white"
            style={{ backgroundColor: 'rgb(250, 166, 26)' }}
          >
            <Clock3 className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Ficha rápida de uso</h3>
          </div>

          <div className="grid gap-3 p-6 md:grid-cols-2">
            <QuickUseCard label="Horas acumuladas" value={asset.currentHours} detail="Dato sincronizado desde VEOSAT" highlightDetail />
            <QuickUseCard label="Horas/Km desde último mantenimiento" value="84h" detail="Dato sincronizado desde VEOSAT" highlightDetail />
            <QuickUseCard label="Próximo mantenimiento" value="250h / 12/04/2026" detail="Dato sincronizado desde VEOSAT" highlightDetail />
            <QuickUseCard label="Última obra" value="OBR-2045" detail="Dato sincronizado desde VEOSAT" highlightDetail />
            <QuickUseCard label="Última OT" value="OT-1034" detail="Cambio de filtros y revisión general" />
            <QuickUseCard label="Última reparación" value="OT-0978" detail="Sustitución de latiguillo hidráulico" />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card">
          <div
            className="flex items-center gap-2 px-6 py-4 text-white"
            style={{ backgroundColor: 'rgb(250, 166, 26)' }}
          >
            <ShieldAlert className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Resumen de vencimientos</h3>
          </div>

          <div className="space-y-3 p-6">
            <DeadlineItem title="ITV" status="Vence en 18 días" tone="warning" date="15/04/2026" />
            <DeadlineItem title="Póliza de circulación" status="Al día" tone="ok" date="31/12/2026" />
            <DeadlineItem title="Revisión preventiva" status="Programada" tone="info" date="12/04/2026" />
            <DeadlineItem title="Documentación pendiente" status="Ficha de mantenimiento pendiente" tone="warning" date="Subida requerida" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div
          className="flex items-center gap-2 px-6 py-4 text-white"
          style={{ backgroundColor: 'rgb(250, 166, 26)' }}
        >
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Documentación</h3>
        </div>

        <div className="p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground md:flex-1">
              Al pulsar cada documento se abre una vista nueva fuera del listado, manteniendo el flujo de navegación del
              módulo. El acceso directo resuelve la búsqueda documental lenta actual.
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Descargar toda la documentación
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {asset.documents.map((document) => (
              <a
                key={document.name}
                href={document.linked ? document.href : undefined}
                target={document.linked ? '_blank' : undefined}
                rel={document.linked ? 'noreferrer' : undefined}
                className={`rounded-xl border p-4 transition-colors ${
                  document.linked
                    ? 'hover:border-primary hover:bg-primary/5'
                    : 'cursor-not-allowed border-dashed opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{document.name}</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {document.linked
                        ? 'Abrir acceso documental'
                        : 'Pendiente de enlazar desde repositorio'}
                    </div>
                  </div>
                  <ExternalLink className="mt-0.5 h-4 w-4 text-muted-foreground" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div
          className="flex items-center gap-2 px-6 py-4 text-white"
          style={{ backgroundColor: 'rgb(250, 166, 26)' }}
        >
          <Clock3 className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Timeline</h3>
        </div>

        <div className="space-y-4 p-6">
          {[
            {
              date: '14/03/2026',
              title: 'OT-1034 ejecutada',
              description: 'Cambio de filtros y revisión general de la máquina.',
            },
            {
              date: '12/03/2026',
              title: 'Avería detectada',
              description: 'Se registra fallo en sistema hidráulico y pasa a seguimiento de taller.',
            },
            {
              date: '05/02/2026',
              title: 'Orden de reparaciones OT-0978',
              description: 'Sustitución de latiguillo hidráulico y comprobación de presión.',
            },
            {
              date: '15/01/2026',
              title: 'Actualización documental',
              description: 'Se enlaza nueva ficha técnica y documentación de circulación.',
            },
          ].map((event) => (
            <div key={`${event.date}-${event.title}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <div className="mt-2 h-full w-px bg-border" />
              </div>
              <div className="flex-1 rounded-xl border bg-muted/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{event.date}</div>
                <div className="mt-1 font-semibold text-foreground">{event.title}</div>
                <div className="mt-2 text-sm text-muted-foreground">{event.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div
          className="flex items-center gap-2 px-6 py-4 text-white"
          style={{ backgroundColor: 'rgb(250, 166, 26)' }}
        >
          <Settings2 className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Menús relacionados</h3>
        </div>

        <div className="p-6">
          <div className="mb-5 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Estos menús no muestran datos dentro de esta ficha. Cada acceso abre su propia vista independiente en una
            pestaña nueva.
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MenuLinkCard
              title="Averías"
              description="Abrir histórico y seguimiento de averías de esta máquina"
              href={`/assets-and-machinery/${asset.id}/breakdowns`}
              icon={TriangleAlert}
            />
            <MenuLinkCard
              title="Órdenes de trabajo"
              description="Abrir órdenes de mantenimiento y reparación de esta máquina"
              href={`/assets-and-machinery/${asset.id}/actions`}
              icon={Settings2}
            />
            <MenuLinkCard
              title="Gastos acumulados"
              description="Abrir costes acumulados y desglose económico"
              href={`/assets-and-machinery/${asset.id}/expenses`}
              icon={Euro}
            />
            <MenuLinkCard
              title="Repuestos"
              description="Abrir consumos y repuestos asociados a la máquina"
              href={`/assets-and-machinery/${asset.id}/parts`}
              icon={Package}
            />
            <MenuLinkCard
              title="Documentación histórica"
              description="Abrir versiones anteriores y renovaciones documentales"
              href={`/assets-and-machinery/${asset.id}/document-history`}
              icon={ScrollText}
            />
            <MenuLinkCard
              title="Ubicaciones / movimientos"
              description="Abrir cambios de obra, taller y movimientos de la máquina"
              href={`/assets-and-machinery/${asset.id}/movements`}
              icon={MapPinned}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function MenuLinkCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-xl border bg-card p-4 transition-colors hover:border-primary hover:bg-primary/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="mt-2 text-sm text-muted-foreground">{description}</div>
        </div>
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </a>
  )
}

function BasicInfoBox({
  label,
  value,
  source,
  accent = false,
}: {
  label: string
  value: string
  source: string
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      {accent ? (
        <span className="inline-block rounded-md bg-violet-500 px-3 py-1 text-sm font-semibold text-white">
          {value}
        </span>
      ) : (
        <div className="text-sm font-medium text-foreground">{value}</div>
      )}
      <div className="mt-2 text-xs font-medium uppercase tracking-wide text-red-600">
        Origen: {source}
      </div>
    </div>
  )
}

function EditableBasicInfoBox({
  label,
  value,
  source,
  onChange,
}: {
  label: string
  value: string
  source: string
  onChange: (value: string) => void
}) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none ring-0 transition-colors focus:border-primary"
      />
      <div className="mt-2 text-xs font-medium uppercase tracking-wide text-red-600">
        Origen: {source}
      </div>
    </div>
  )
}

function QuickUseCard({
  label,
  value,
  detail,
  highlightDetail = false,
}: {
  label: string
  value: string
  detail: string
  highlightDetail?: boolean
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
      <div className={`mt-2 text-sm ${highlightDetail ? 'font-medium text-red-600' : 'text-muted-foreground'}`}>{detail}</div>
    </div>
  )
}

function DeadlineItem({
  title,
  status,
  date,
  tone,
}: {
  title: string
  status: string
  date: string
  tone: 'ok' | 'warning' | 'info'
}) {
  const toneClasses = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  } as const

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/20 p-4">
      <div>
        <div className="font-semibold text-foreground">{title}</div>
        <div className="mt-2 text-sm text-muted-foreground">{date}</div>
      </div>
      <span className={`rounded-md border px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>{status}</span>
    </div>
  )
}

function formatSpanishDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES')
}
