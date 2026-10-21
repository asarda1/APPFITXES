import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, ChevronDown,
  ChevronRight, ClipboardCheck, Clock3, Gauge, Wrench } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  getWorkshopMaintenanceById,
  removeWorkshopMaintenanceSheet,
  updateWorkshopMaintenanceScheduledDate,
  updateWorkshopMaintenanceSheet,
} from '../data/workshopMaintenances'
import { createMaintenanceWorkOrder, getMaintenanceWorkOrder, type WorkshopOrderCenter } from '../data/workshopWorkOrders'

export function MaintenanceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  if (!id) {
    return <Navigate to="/maintenance/preventive/calendar" replace />
  }

  const maintenance = getWorkshopMaintenanceById(id)

  if (!maintenance) {
    return <Navigate to="/maintenance/preventive/calendar" replace />
  }

  const existingWorkOrder = useMemo(() => getMaintenanceWorkOrder(id), [id])
  const [scheduledDate, setScheduledDate] = useState(
    () => (maintenance.scheduled_date ?? maintenance.created_at).slice(0, 10),
  )
  const [savedMessage, setSavedMessage] = useState('')
  const [attachedSheet, setAttachedSheet] = useState(() => maintenance.maintenance_sheet ?? null)
  const [showCreateOtModal, setShowCreateOtModal] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState<WorkshopOrderCenter>('Taller Frares')
  const [expandedSections, setExpandedSections] = useState({
    planning: true,
    notes: true,
    timeline: true,
  })

  const handleSaveScheduledDate = () => {
    updateWorkshopMaintenanceScheduledDate(maintenance.id, scheduledDate)
    setSavedMessage('Fecha guardada en calendario')
  }

  const handleAutoInsertSheet = async (options?: { silentIfAttached?: boolean }) => {
    if (attachedSheet) {
      if (options?.silentIfAttached) return
      const confirmed = window.confirm('Ya existe una ficha cargada. ¿Quieres reemplazarla automáticamente?')
      if (!confirmed) return
    }

    const machineCode = maintenance.machine_code?.trim()
    const intervalHours = maintenance.interval_hours ? String(maintenance.interval_hours).trim() : ''

    if (!machineCode || !intervalHours) {
      if (!options?.silentIfAttached) {
        window.alert('No se puede seleccionar ficha automáticamente: faltan datos de máquina o tipo de mantenimiento.')
      }
      return
    }

    const fileName = `${machineCode}__${intervalHours}h.pdf`
    const url = `/maintenance-sheets/${encodeURIComponent(fileName)}`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`No encontrado: ${fileName}`)
      }
      const blob = await response.blob()
      const fileDataUrl = await readBlobAsDataUrl(blob)

      const updated = updateWorkshopMaintenanceSheet(maintenance.id, {
        file_name: fileName,
        file_type: blob.type || 'application/pdf',
        file_data_url: fileDataUrl,
      })

      setAttachedSheet(updated?.maintenance_sheet ?? null)
    } catch (error) {
      console.warn('Auto insert maintenance sheet failed:', error)
      if (!options?.silentIfAttached) {
        window.alert(`No se ha encontrado una ficha automática para ${machineCode} + ${intervalHours}h.`)
      }
    }
  }

  useEffect(() => {
    // Inserción automática al entrar en el mantenimiento (mock de “base de datos” de fichas)
    if (attachedSheet) return
    void handleAutoInsertSheet({ silentIfAttached: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maintenance.id])

  const handleRemoveSheet = () => {
    const confirmed = window.confirm('Se va a eliminar la ficha de mantenimiento cargada. Esta accion no se puede deshacer.')
    if (!confirmed) return

    removeWorkshopMaintenanceSheet(maintenance.id)
    setAttachedSheet(null)
  }

  const handleViewSheet = () => {
    if (!attachedSheet?.file_data_url) return

    const blob = dataUrlToBlob(attachedSheet.file_data_url)
    const objectUrl = URL.createObjectURL(blob)
    window.open(objectUrl, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  }

  const handleDownloadSheet = () => {
    if (!attachedSheet?.file_data_url) return

    const link = document.createElement('a')
    link.href = attachedSheet.file_data_url
    link.download = attachedSheet.file_name
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleOpenWorkOrder = () => {
    if (existingWorkOrder) {
      navigate(`/work-orders/${existingWorkOrder.id}`)
      return
    }
    setShowCreateOtModal(true)
  }

  const handleCreateWorkOrder = () => {
    const workOrder = createMaintenanceWorkOrder(maintenance, selectedCenter)
    setShowCreateOtModal(false)
    navigate(`/work-orders/${workOrder.id}`)
  }

  return (
    <div className="h-full min-h-0 space-y-6 overflow-y-auto pr-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            to="/maintenance/preventive/calendar"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Mantenimiento</div>
            <h1 className="mt-1 text-3xl font-bold text-foreground">{maintenance.code}</h1>
          </div>
        </div>

        {/* Timeline */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
            <div className="flex h-8 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px]">
                1
              </span>
              Mantenimiento
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            {existingWorkOrder ? (
              <button 
                onClick={() => navigate(`/work-orders/${existingWorkOrder.id}`)}
                className="flex h-8 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground/30 text-[11px] bg-background">
                  2
                </span>
                Orden de trabajo
              </button>
            ) : (
              <div className="flex h-8 items-center rounded-full px-4 text-sm font-medium text-muted-foreground/50">
                <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-[11px]">
                  2
                </span>
                Orden de trabajo
              </div>
            )}
          </div>
        </div>


        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenWorkOrder}
            className="rounded-full border border-primary/30 bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {existingWorkOrder ? 'Ver OT vinculada' : 'Abrir OT'}
          </button>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(maintenance.status)}`}>
            {getStatusLabel(maintenance.status)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Wrench className="h-4 w-4" />
            Maquina
          </div>
          <div className="mt-3 text-lg font-semibold text-foreground">{maintenance.machine_code}</div>
          <div className="mt-1 text-sm text-muted-foreground">{maintenance.machine_name}</div>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            Tipo de mantenimiento
          </div>
          <div className="mt-3 text-lg font-semibold text-foreground">{getIntervalLabel(maintenance)}</div>
          <div className="mt-1 text-sm text-red-600">TIPO DE MANTENIMIENTO DEFINIDO POR INTERVALO HORARIO</div>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Gauge className="h-4 w-4" />
            Horas acumuladas
          </div>
          <div className="mt-3 text-lg font-semibold text-foreground">
            {maintenance.current_hours ? `${maintenance.current_hours} h` : 'Sin dato'}
          </div>
          <div className="mt-1 text-sm text-red-600">DATO SINCRONIZADO DESDE VEOSAT</div>
        </div>

        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <ChevronRight className="h-4 w-4" />
            Obra
          </div>
          <div className="mt-3 text-lg font-semibold text-foreground">{maintenance.site_name ?? 'Sin obra'}</div>
          <div className="mt-1 text-sm text-red-600">ORIGEN: VEOSAT</div>
        </div>
      </div>

      <section className="rounded-2xl border bg-card">
        <SectionHeader
          icon={CalendarDays}
          title="Planificacion"
          expanded={expandedSections.planning}
          onToggle={() => setExpandedSections((current) => ({ ...current, planning: !current.planning }))}
        />

        {expandedSections.planning ? (
          <div className="p-5">
            <div className="rounded-2xl border p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha programada</div>
              <input
                type="date"
                value={scheduledDate}
                onChange={(event) => {
                  setScheduledDate(event.target.value)
                  setSavedMessage('')
                }}
                className="mt-2 w-full rounded-xl border bg-background px-3 py-3 text-base font-semibold text-foreground outline-none transition-colors focus:border-primary"
              />
              <div className="mt-2 text-xs font-semibold text-red-600">EDITABLE DESDE TALLER</div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSaveScheduledDate}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Guardar fecha en calendario
                </button>
                {savedMessage ? <div className="text-sm font-medium text-emerald-600">{savedMessage}</div> : null}
              </div>

              <div className="mt-4 border-t pt-4">
                {attachedSheet ? (
                  <div className="mt-3 rounded-2xl border p-4">
                    <div className="text-sm text-muted-foreground">
                      Ficha cargada: <span className="font-medium text-foreground">{attachedSheet.file_name}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleViewSheet}
                        className="inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                      >
                        Ver ficha
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadSheet}
                        className="inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                      >
                        Descargar
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveSheet}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                      >
                        Eliminar ficha
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm font-medium text-muted-foreground">
                    Sin ficha de mantenimiento adjunta.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {maintenance.notes ? (
        <section className="rounded-2xl border bg-card">
          <SectionHeader
            icon={ClipboardCheck}
            title="Nota de planificacion"
            expanded={expandedSections.notes}
            onToggle={() => setExpandedSections((current) => ({ ...current, notes: !current.notes }))}
          />

          {expandedSections.notes ? <div className="p-5 text-sm text-foreground">{maintenance.notes}</div> : null}
        </section>
      ) : null}

      <section className="rounded-2xl border bg-card">
        <SectionHeader
          icon={Clock3}
          title="Cronologia"
          expanded={expandedSections.timeline}
          onToggle={() => setExpandedSections((current) => ({ ...current, timeline: !current.timeline }))}
        />

        {expandedSections.timeline ? (
          <div className="space-y-3 p-5">
            {maintenance.timeline.map((entry) => (
              <div key={entry.id} className="rounded-2xl border p-4">
                <div className="text-sm font-semibold text-foreground">{entry.description}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {entry.user_name} · {formatDateTime(entry.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {showCreateOtModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-5xl rounded-3xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Orden de mantenimiento</div>
                <div className="mt-1 text-2xl font-bold text-foreground">Crear OT desde mantenimiento</div>
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
                <InfoCard label="Maquina" value={`${maintenance.machine_code} - ${maintenance.machine_name}`} helper="ORIGEN: MANTENIMIENTO" />
                <InfoCard label="Tipo de mantenimiento" value={getIntervalLabel(maintenance)} helper="TIPO PRECARGADO DESDE MANTENIMIENTO" />
                <InfoCard label="Horas acumuladas" value={maintenance.current_hours ? `${maintenance.current_hours} h` : 'Sin dato'} helper="DATO PRECARGADO DESDE MANTENIMIENTO" />
              </div>

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
  icon: typeof Wrench
  title: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-t-2xl bg-primary px-5 py-4 text-left text-primary-foreground"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
    </button>
  )
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

function getIntervalLabel(maintenance: { interval_hours?: number }) {
  return maintenance.interval_hours ? `${maintenance.interval_hours} h` : 'Preventivo'
}

function getStatusLabel(status: string) {
  if (status === 'scheduled') return 'Programado'
  if (status === 'upcoming') return 'Proximo'
  if (status === 'due') return 'A realizar'
  if (status === 'overdue') return 'Atrasado'
  if (status === 'in_progress') return 'En curso'
  if (status === 'completed') return 'Completado'
  return 'Cancelado'
}

function getStatusClasses(status: string) {
  if (status === 'overdue') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'due') return 'border-orange-200 bg-orange-50 text-orange-700'
  if (status === 'upcoming') return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  if (status === 'in_progress') return 'border-cyan-200 bg-cyan-50 text-cyan-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-ES')
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('No se ha podido leer el fichero.'))
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl: string) {
  const [header, data] = dataUrl.split(',')
  const mimeMatch = header.match(/data:(.*?)(;base64)?$/)
  const mimeType = mimeMatch?.[1] ?? 'application/octet-stream'
  const isBase64 = header.includes(';base64')

  if (isBase64) {
    const binary = window.atob(data)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    return new Blob([bytes], { type: mimeType })
  }

  return new Blob([decodeURIComponent(data)], { type: mimeType })
}
