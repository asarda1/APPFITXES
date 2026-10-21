import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  Image as ImageIcon,
  MapPin,
  Settings2,
  ShieldAlert,
  Truck,
  User,
  Video,
  Wrench,
} from 'lucide-react'
import { getBreakdownById, getPersonnelById } from '../../../src/data/mockDatabase'
import type { BreakdownReport } from '../../../src/types/correctiveMaintenance'
import { createIncidentWorkOrder, getIncidentWorkOrder, type WorkshopOrderCenter } from '../data/workshopWorkOrders'

export function IncidentDetailWorkshopPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const incident = getBreakdownById(id || '')
  const [selectedMedia, setSelectedMedia] = useState<{ type: 'photo' | 'video'; name: string } | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    report: true,
    media: true,
    timeline: true,
  })

  const [showCreateOtModal, setShowCreateOtModal] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState<WorkshopOrderCenter>('Taller Frares')
  const [orderType, setOrderType] = useState<'Orden de Reparación' | 'Orden de Desgaste'>('Orden de Reparación')

  const existingWorkOrder = incident ? getIncidentWorkOrder(incident.id) : null

  const handleOpenWorkOrder = () => {
    if (existingWorkOrder) {
      navigate(`/work-orders/${existingWorkOrder.id}`)
      return
    }
    setShowCreateOtModal(true)
  }

  const handleCreateWorkOrder = () => {
    if (!incident) return
    const workOrder = createIncidentWorkOrder(incident, selectedCenter, orderType)
    setShowCreateOtModal(false)
    navigate(`/work-orders/${workOrder.id}`)
  }

  if (!incident) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border bg-card">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Incidencia no encontrada</h2>
          <button
            type="button"
            onClick={() => navigate('/incidents')}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            Volver a incidencias
          </button>
        </div>
      </div>
    )
  }

  const category = getIncidentCategory(incident)
  const workImpact = getWorkImpact(incident)
  const reporterPhone = getPersonnelById(incident.reported_by)?.phone ?? 'No disponible'

  return (
    <div className="h-full min-h-0 space-y-6 overflow-y-auto pr-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/incidents')}
            className="rounded-xl border bg-background p-2.5 transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Incidencia
            </div>
            <h1 className="mt-1 text-3xl font-bold">{incident.code}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{incident.title}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-sm font-semibold mx-auto">
          <span className="text-foreground flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">1</span>
            Incidencia
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {existingWorkOrder ? (
            <button 
              onClick={() => navigate(`/work-orders/${existingWorkOrder.id}`)}
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border bg-background text-[10px]">2</span>
              Orden de trabajo
            </button>
          ) : (
            <span className="text-muted-foreground opacity-50 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed text-[10px]">2</span>
              Orden de trabajo
            </span>
          )}
        </div>


        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenWorkOrder}
            className="rounded-full border border-primary/30 bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {existingWorkOrder ? 'Ver OT vinculada' : 'Abrir OT'}
          </button>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getCategoryBadgeClasses(category)}`}>
            {getIncidentCategoryLabel(category)}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(incident.status)}`}>
            {translateStatus(incident.status)}
          </span>
        </div>
      </div>

      <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={Truck}
              title="Maquina"
              value={incident.machine_code}
              detail={incident.machine_name}
            />
            <SummaryCard
              icon={MapPin}
              title="Obra"
              value={incident.site_name ?? 'Sin obra'}
              detail={incident.site_id ? 'Ubicacion informada en reporte' : 'Pendiente de asociar'}
            />
            <SummaryCard
              icon={Clock3}
              title="Impacto operativo"
              value={workImpact.label}
              detail={workImpact.detail}
            />
            <SummaryCard
              icon={ShieldAlert}
              title="Prioridad"
              value={translateSeverity(incident.severity)}
              detail={incident.requires_immediate_attention ? 'Aviso con prioridad' : 'Revision ordinaria'}
            />
          </div>

          <div className="rounded-2xl border bg-card">
            <SectionHeader
              icon={ClipboardList}
              title="Resumen del aviso"
              expanded={expandedSections.summary}
              onToggle={() => setExpandedSections((current) => ({ ...current, summary: !current.summary }))}
            />
            {expandedSections.summary && (
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <InfoBlock label="Tipo de incidencia" value={getIncidentCategoryLabel(category)} />
                <InfoBlock label="Tipo tecnico" value={translateBreakdownType(incident.breakdown_type)} />
                <InfoBlock
                  label="Fecha y hora de creacion"
                  value={`${formatDate(incident.created_at)} · ${formatTime(incident.created_at)}`}
                />
                <InfoBlock
                  label="Reportado por"
                  value="Identificar mediante el numero de recurso asociado a la app mobil que reporta la incidencia"
                  valueClassName="text-red-600"
                />
                <InfoBlock
                  label="Telefono"
                  value={reporterPhone}
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-card">
            <SectionHeader
              icon={Settings2}
              title="Lectura del reporte"
              expanded={expandedSections.report}
              onToggle={() => setExpandedSections((current) => ({ ...current, report: !current.report }))}
            />
            {expandedSections.report && (
              <div className="space-y-5 p-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <QuickInfo
                    label="Maquina puede seguir trabajando"
                    value={workImpact.label}
                    tone={workImpact.tone}
                  />
                  <QuickInfo
                    label="Riesgo de seguridad"
                    value={incident.safety_risk ? 'Si' : 'No'}
                    tone={incident.safety_risk ? 'danger' : 'neutral'}
                  />
                  <QuickInfo
                    label="Atencion inmediata"
                    value={incident.requires_immediate_attention ? 'Si' : 'No'}
                    tone={incident.requires_immediate_attention ? 'danger' : 'neutral'}
                  />
                  <QuickInfo
                    label="Estado actual"
                    value={translateStatus(incident.status)}
                    tone={incident.status === 'reported' ? 'warning' : incident.status === 'repairing' ? 'warning' : 'success'}
                  />
                </div>

                {getOperatorNote(incident.description) && (
                  <div className="rounded-2xl border bg-muted/20 p-4">
                    <div className="text-sm font-semibold">Nota del operador</div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{getOperatorNote(incident.description)}</p>
                  </div>
                )}

                {incident.symptoms?.length > 0 && (
                  <div className="rounded-2xl border p-4">
                    <div className="text-sm font-semibold">Sintomas asociados</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {incident.symptoms.map((symptom, index) => (
                        <span key={`${symptom}-${index}`} className="rounded-full border bg-muted/30 px-3 py-1 text-xs">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-card">
            <SectionHeader
              icon={ImageIcon}
              title="Fotos y videos"
              expanded={expandedSections.media}
              onToggle={() => setExpandedSections((current) => ({ ...current, media: !current.media }))}
            />
            {expandedSections.media && (
              <div className="space-y-3 p-5">
                {incident.photos?.length ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Imagenes</div>
                    {incident.photos.map((photo, index) => (
                      <button
                        key={`${photo}-${index}`}
                        type="button"
                        onClick={() => setSelectedMedia({ type: 'photo', name: photo })}
                        className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors hover:bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-muted p-2">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">Imagen {index + 1}</div>
                            <div className="text-xs text-muted-foreground">{photo}</div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-primary">Ver</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {incident.videos?.length ? (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Videos</div>
                    {incident.videos.map((video, index) => (
                      <button
                        key={`${video}-${index}`}
                        type="button"
                        onClick={() => setSelectedMedia({ type: 'video', name: video })}
                        className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors hover:bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-muted p-2">
                            <Video className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">Video {index + 1}</div>
                            <div className="text-xs text-muted-foreground">{video}</div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-primary">Ver</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {!incident.photos?.length && !incident.videos?.length && (
                  <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                    No hay archivos adjuntos en esta incidencia.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border bg-card">
            <SectionHeader
              icon={Calendar}
              title="Cronologia de la incidencia"
              expanded={expandedSections.timeline}
              onToggle={() => setExpandedSections((current) => ({ ...current, timeline: !current.timeline }))}
            />
            {expandedSections.timeline && (
              <div className="space-y-4 p-5">
                {incident.timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      {index < incident.timeline.length - 1 && <div className="mt-2 w-px flex-1 bg-border" />}
                    </div>
                    <div className="min-w-0 flex-1 pb-4">
                      <div className="text-sm font-semibold">{event.description}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {event.user_name} · {formatDate(event.created_at)} · {formatTime(event.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </section>

      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-base font-semibold">
                  {selectedMedia.type === 'photo' ? 'Vista de imagen' : 'Vista de video'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{selectedMedia.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cerrar
              </button>
            </div>

            <div className="p-5">
              <div className="flex aspect-video items-center justify-center rounded-2xl border bg-muted/30">
                <div className="text-center">
                  {selectedMedia.type === 'photo' ? (
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  ) : (
                    <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                  )}
                  <div className="mt-3 text-sm font-medium">
                    {selectedMedia.type === 'photo' ? 'Previsualizacion de imagen' : 'Previsualizacion de video'}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Preparado para abrir archivo real cuando el backend entregue URL o ruta de adjunto.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {showCreateOtModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-5xl rounded-3xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Incidencia</div>
                <div className="mt-1 text-2xl font-bold text-foreground">Crear OT desde incidencia</div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateOtModal(false)}
                className="rounded-xl border px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="grid gap-4 xl:grid-cols-3">
                <InfoCard label="Maquina" value={`${incident.machine_code} - ${incident.machine_name}`} helper="ORIGEN: INCIDENCIA" />
                <InfoCard label="Tipo de incidencia" value={getIncidentCategoryLabel(category)} helper="TIPO PRECARGADO DESDE INCIDENCIA" />
                <InfoCard label="Impacto operativo" value={workImpact.label} helper="DATO PRECARGADO DESDE INCIDENCIA" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Centro</div>
                  <select
                    value={selectedCenter}
                    onChange={(event) => setSelectedCenter(event.target.value as WorkshopOrderCenter)}
                    className="mt-2 w-full rounded-xl border bg-background px-3 py-3 text-base font-semibold text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="Taller Frares">Taller Frares</option>
                    <option value="Taller Zaragoza">Taller Zaragoza</option>
                  </select>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo de Orden de Trabajo</div>
                  <select
                    value={orderType}
                    onChange={(event) => setOrderType(event.target.value as 'Orden de Reparación' | 'Orden de Desgaste')}
                    className="mt-2 w-full rounded-xl border bg-background px-3 py-3 text-base font-semibold text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="Orden de Reparación">Orden de Reparación</option>
                    <option value="Orden de Desgaste">Orden de Desgaste</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateOtModal(false)}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateWorkOrder}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Confirmar creación de la orden
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  expanded,
  onToggle,
}: {
  icon: typeof ClipboardList
  title: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-t-2xl bg-primary px-5 py-4 text-left text-primary-foreground"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? '' : '-rotate-90'}`} />
    </button>
  )
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: typeof Truck
  title: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
      </div>
      <div className="mt-3 text-base font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>

    </div>
  )
}

function InfoBlock({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-2xl border bg-muted/20 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-2 text-sm font-medium ${valueClassName ?? ''}`}>{value}</div>

    </div>
  )
}

function QuickInfo({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'neutral' | 'warning' | 'danger' | 'success'
}) {
  const toneClasses =
    tone === 'danger'
      ? 'border-red-200 bg-red-50 text-red-800'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : tone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-slate-200 bg-slate-50 text-slate-800'

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <div className="text-xs font-semibold uppercase tracking-wide">{label}</div>
      <div className="mt-2 text-sm font-semibold">{value}</div>

    </div>
  )
}

function getIncidentCategory(incident: BreakdownReport) {
  const description = incident.description?.toLowerCase() ?? ''

  if (description.includes('clasificacion guiada: duda de funcionamiento')) return 'usage_doubt'
  if (description.includes('clasificacion guiada: averia leve')) return 'light_breakdown'
  if (description.includes('clasificacion guiada: averia critica')) return 'critical_breakdown'
  if (incident.severity === 'critical') return 'critical_breakdown'
  return 'light_breakdown'
}

function getIncidentCategoryLabel(category: string) {
  if (category === 'critical_breakdown') return 'Avería crítica'
  if (category === 'light_breakdown') return 'Avería leve'
  return 'Duda de funcionamiento'
}

function getCategoryBadgeClasses(category: string) {
  if (category === 'critical_breakdown') return 'bg-red-50 text-red-700 border border-red-200'
  if (category === 'light_breakdown') return 'bg-amber-50 text-amber-700 border border-amber-200'
  return 'bg-blue-50 text-blue-700 border border-blue-200'
}

function getStatusBadgeClasses(status: BreakdownReport['status']) {
  if (status === 'reported') return 'bg-slate-100 text-slate-800 border border-slate-200'
  if (status === 'repairing') return 'bg-amber-100 text-amber-800 border border-amber-200'
  return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
}

function translateStatus(status: BreakdownReport['status']) {
  if (status === 'reported') return 'Reportada'
  if (status === 'repairing') return 'En reparacion'
  return 'Resuelta'
}

function translateSeverity(severity: BreakdownReport['severity']) {
  if (severity === 'critical') return 'Critica'
  return 'Media'
}

function translateBreakdownType(type: BreakdownReport['breakdown_type']) {
  if (type === 'motor') return 'Motor'
  if (type === 'hydraulic') return 'Hidráulico'
  if (type === 'electrical') return 'Eléctrico'
  if (type === 'electronic') return 'Electrónico'
  if (type === 'tires') return 'Neumáticos'
  if (type === 'brakes') return 'Frenos'
  if (type === 'transmission') return 'Transmisión'
  if (type === 'structure') return 'Estructura'
  return 'Otros'
}

function translateLocation(location: BreakdownReport['reported_location']) {
  return location === 'site' ? 'Obra' : 'Taller'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES')
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function getWorkImpact(incident: BreakdownReport) {
  const description = incident.description?.toLowerCase() ?? ''

  if (description.includes('puede trabajar: no, esta parada') || !incident.is_operational) {
    return { label: 'No, esta parada', detail: 'Maquina parada o fuera de servicio', tone: 'danger' as const }
  }

  if (description.includes('puede trabajar: si, pero con limitaciones')) {
    return { label: 'Si, con limitaciones', detail: 'Puede seguir pero con impacto operativo', tone: 'warning' as const }
  }

  return { label: 'Si, sin problema', detail: 'Puede seguir trabajando', tone: 'success' as const }
}

function getOperatorNote(description: string) {
  return matchDescriptionValue(description, 'Nota operador:')
}

function matchDescriptionValue(description: string, prefix: string) {
  const match = description.match(new RegExp(`${prefix}\\s*([^.]*)`, 'i'))
  return match?.[1]?.trim() ?? ''
}


function InfoCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-base font-semibold text-foreground">{value}</div>
      <div className="mt-2 text-xs font-semibold text-red-600">{helper}</div>
    </div>
  )
}
