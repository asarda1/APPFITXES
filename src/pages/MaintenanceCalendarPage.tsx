import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, FileText, LayoutGrid, List, Plus, Trash2 } from 'lucide-react'
import type { MaintenanceStatus, MaintenanceType, PreventiveMaintenance } from '../../src/types/preventiveMaintenance'
import { deleteWorkshopMaintenance, getWorkshopMaintenances } from '../data/workshopMaintenances'

type MaintenanceCalendarFilter = 'all' | 'programmed' | 'overdue' | 'in_progress'

export function MaintenanceCalendarPage() {
  const [calendarCursor, setCalendarCursor] = useState(() => new Date())
  const [activeFilter, setActiveFilter] = useState<MaintenanceCalendarFilter>('all')
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)
  const [allMaintenances, setAllMaintenances] = useState<PreventiveMaintenance[]>([])

  useEffect(() => {
    setAllMaintenances(getWorkshopMaintenances())
  }, [])

  const openMaintenances = useMemo(
    () => allMaintenances.filter((maintenance) => maintenance.status !== 'completed' && maintenance.status !== 'cancelled'),
    [allMaintenances],
  )

  const filteredMaintenances = useMemo(() => {
    if (activeFilter === 'overdue') {
      return openMaintenances.filter((maintenance) => getMaintenanceOpenBucket(maintenance.status) === 'overdue')
    }
    if (activeFilter === 'all') return openMaintenances
    return openMaintenances.filter((maintenance) => getMaintenanceOpenBucket(maintenance.status) === activeFilter)
  }, [activeFilter, openMaintenances])

  const year = calendarCursor.getFullYear()
  const month = calendarCursor.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  const startWeekday = (monthStart.getDay() + 6) % 7
  const daysInMonth = monthEnd.getDate()

  const leadingDays = Array.from({ length: startWeekday }, (_, index) => ({
    key: `prev-${index}`,
    date: new Date(year, month, index - startWeekday + 1),
    inMonth: false,
  }))

  const monthDays = Array.from({ length: daysInMonth }, (_, index) => ({
    key: `current-${index + 1}`,
    date: new Date(year, month, index + 1),
    inMonth: true,
  }))

  const trailingCount = Math.max(42 - (leadingDays.length + monthDays.length), 0)
  const trailingDays = Array.from({ length: trailingCount }, (_, index) => ({
    key: `next-${index}`,
    date: new Date(year, month + 1, index + 1),
    inMonth: false,
  }))

  const calendarDays = [...leadingDays, ...monthDays, ...trailingDays]

  const maintenancesByDay = useMemo(() => {
    const grouped = new Map<string, PreventiveMaintenance[]>()

    filteredMaintenances.forEach((maintenance) => {
      const key = toLocalIsoDate(getReferenceDate(maintenance))
      const current = grouped.get(key) ?? []
      current.push(maintenance)
      grouped.set(key, current)
    })

    return grouped
  }, [filteredMaintenances])

  const counters = [
    {
      key: 'generated' as const,
      label: 'Generados',
      count: openMaintenances.filter((item) => item.status === 'due').length,
      classes: 'border-orange-200 bg-orange-50 text-orange-800',
    },
    {
      key: 'programmed' as const,
      label: 'Programados',
      count: openMaintenances.filter((item) => item.status === 'scheduled').length,
      classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    {
      key: 'overdue' as const,
      label: 'Atrasados',
      count: openMaintenances.filter((item) => getMaintenanceOpenBucket(item.status) === 'overdue').length,
      classes: 'border-red-200 bg-red-50 text-red-800',
    },
  ]

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const handleDelete = (maintenanceId: string, maintenanceCode: string) => {
    const confirmed = window.confirm(`Se va a eliminar el mantenimiento ${maintenanceCode}. Esta accion no se puede deshacer.`)
    if (!confirmed) return

    const deleted = deleteWorkshopMaintenance(maintenanceId)
    if (deleted) {
      setExpandedIds((current) => current.filter((id) => id !== maintenanceId))
      setAllMaintenances(getWorkshopMaintenances())
    }
  }

  const selectedDayMaintenances = selectedDayKey ? maintenancesByDay.get(selectedDayKey) ?? [] : []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link
          to="/maintenance/preventive/calendar"
          className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Mantenimientos abiertos
        </Link>
        <Link
          to="/maintenance/preventive/history"
          className="rounded-lg border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Historico de mantenimientos
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {counters.map((counter) => (
          <button
            key={counter.key}
            type="button"
            onClick={() => {
              if (counter.key === 'generated') {
                setViewMode('generated')
                setActiveFilter('all')
                return
              }
              if (counter.key === 'programmed') {
                setViewMode('programmed')
                setActiveFilter('all')
                return
              }
              setActiveFilter(counter.key as MaintenanceCalendarFilter)
            }}
            className={`rounded-2xl border p-4 text-left transition-all hover:shadow-sm ${counter.classes} ${
              (counter.key === 'generated' && activeFilter === 'all') ||
              (counter.key === 'programmed' && activeFilter === 'programmed') ||
              (counter.key === 'overdue' && activeFilter === 'overdue')
                ? 'ring-2 ring-primary/30'
                : ''
            }`}
          >
            <div className="text-3xl font-bold">{counter.count}</div>
            <div className="mt-1 text-sm font-semibold">{counter.label}</div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 rounded-lg border p-1">
        <Link
          to="/maintenance/preventive/calendar"
          className="rounded p-2 transition-colors bg-primary text-primary-foreground"
          title="Vista calendario"
        >
          <LayoutGrid className="h-5 w-5" />
        </Link>
        <Link
          to="/maintenance/preventive/list"
          className="rounded p-2 transition-colors hover:bg-muted"
          title="Vista lista"
        >
          <List className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'programmed', label: 'Programados' },
            { key: 'in_progress', label: 'En curso' },
            { key: 'overdue', label: 'Atrasados' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setActiveFilter(option.key as MaintenanceCalendarFilter)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeFilter === option.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/maintenance/preventive/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Generacion automatica
          </Link>
          <Link
            to="/maintenance/preventive/sheet-builder"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <FileText className="h-4 w-4" />
            Crear ficha de mantenimiento
          </Link>
        </div>
      </div>

      <section className="grid gap-4 overflow-hidden xl:grid-cols-[minmax(0,1.35fr)_minmax(520px,1fr)] xl:[grid-auto-rows:650px]">
        <div className="flex h-[650px] flex-col overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <button
              type="button"
              onClick={() => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="rounded-lg border p-2 text-muted-foreground transition-colors hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-base font-semibold capitalize">
              {monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              type="button"
              onClick={() => setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="rounded-lg border p-2 text-muted-foreground transition-colors hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 border-b bg-muted/40">
            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day) => (
              <div key={day} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-7">
            {calendarDays.map(({ key, date, inMonth }) => {
              const isoDate = toLocalIsoDate(date)
              const maintenances = maintenancesByDay.get(isoDate) ?? []

              return (
                <div
                  key={key}
                  onClick={() => setSelectedDayKey(isoDate)}
                  className={`h-[96px] cursor-pointer overflow-hidden border-b border-r p-2 transition-colors hover:bg-muted/30 ${
                    inMonth ? 'bg-card' : 'bg-muted/20'
                  }`}
                >
                  <div className={`text-xs font-semibold ${inMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {date.getDate()}
                  </div>

                  <div
                    className="mt-1.5 max-h-[66px] space-y-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ msOverflowStyle: 'none' }}
                  >
                    {maintenances.map((maintenance) => (
                      <div
                        key={maintenance.id}
                        onMouseEnter={() => setHoveredId(maintenance.id)}
                        onMouseLeave={() => setHoveredId((current) => (current === maintenance.id ? null : current))}
                        className={`rounded-md border p-1 text-[10px] transition-all duration-200 ${getMaintenanceCardClasses(maintenance.status)} ${
                          hoveredId === maintenance.id
                            ? 'z-10 scale-[1.03] shadow-md ring-2 ring-primary/25'
                            : 'hover:scale-[1.01] hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/maintenance/preventive/workshop/${maintenance.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="min-w-0 flex-1"
                          >
                            <div className="truncate font-semibold text-foreground">{maintenance.code}</div>
                            <div className="truncate text-[10px] text-muted-foreground">{maintenance.machine_code}</div>
                            <div className="mt-0.5 truncate text-[9px] text-foreground/80">{maintenance.machine_name}</div>
                          </Link>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleDelete(maintenance.id, maintenance.code)
                            }}
                            className="rounded-md border border-red-200 bg-white/80 p-1 text-red-600 transition-colors hover:bg-red-50"
                            title="Eliminar mantenimiento"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside className="flex h-[650px] min-h-0 flex-col overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-4 py-3">
            <div className="text-sm font-semibold text-foreground">Mantenimientos</div>
            <div className="mt-1 text-xs text-muted-foreground">Listas laterales separadas: Generados (aviso) y Programados.</div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-hidden p-4">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-background">
              <div className="border-b px-3 py-2">
                <div className="text-xs font-semibold text-foreground">Generados (aviso)</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {openMaintenances.filter((maintenance) => maintenance.status === 'due').length} mantenimientos
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                {openMaintenances.filter((maintenance) => maintenance.status === 'due').length > 0 ? (
                  openMaintenances
                    .filter((maintenance) => maintenance.status === 'due')
                    .map((maintenance) => {
                      const expanded = expandedIds.includes(maintenance.id)

                      return (
                        <div
                          key={maintenance.id}
                          onMouseEnter={() => setHoveredId(maintenance.id)}
                          onMouseLeave={() => setHoveredId((current) => (current === maintenance.id ? null : current))}
                          className={`rounded-2xl border p-3 transition-all duration-200 ${getMaintenanceCardClasses(maintenance.status)} ${
                            hoveredId === maintenance.id ? 'z-10 scale-[1.01] shadow-sm ring-2 ring-primary/25' : 'hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/maintenance/preventive/workshop/${maintenance.id}`}
                                className="block text-sm font-semibold text-foreground transition-colors hover:text-primary"
                              >
                                {maintenance.machine_code} - {maintenance.machine_name}
                              </Link>
                              <div className="mt-1 text-xs text-muted-foreground">{maintenance.code}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">Tipo: </span>
                                {getMaintenanceIntervalLabel(maintenance)}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {getReferenceDateLabel(maintenance)} - {maintenance.site_name ?? 'Sin obra'}
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => toggleExpanded(maintenance.id)}
                                className="rounded-lg border bg-white/80 p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                                title="Desplegar detalle"
                              >
                                <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(maintenance.id, maintenance.code)}
                                className="rounded-lg border border-red-200 bg-white/80 p-1.5 text-red-600 transition-colors hover:bg-red-50"
                                title="Eliminar mantenimiento"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {expanded ? (
                            <div className="mt-3 space-y-2 border-t pt-3 text-xs text-muted-foreground">
                              <div>
                                <span className="font-semibold text-foreground">Fecha: </span>
                                {getReferenceDateLabel(maintenance)}
                              </div>
                              <div>
                                <span className="font-semibold text-foreground">Duracion estimada: </span>
                                {maintenance.estimated_duration_hours} h
                              </div>
                              {maintenance.notes ? (
                                <div>
                                  <span className="font-semibold text-foreground">Nota: </span>
                                  {maintenance.notes}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      )
                    })
                ) : (
                  <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">No hay mantenimientos generados.</div>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-background">
              <div className="border-b px-3 py-2">
                <div className="text-xs font-semibold text-foreground">Programados</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {openMaintenances.filter((maintenance) => maintenance.status === 'scheduled').length} mantenimientos
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                {openMaintenances.filter((maintenance) => maintenance.status === 'scheduled').length > 0 ? (
                  openMaintenances
                    .filter((maintenance) => maintenance.status === 'scheduled')
                    .map((maintenance) => {
                      const expanded = expandedIds.includes(maintenance.id)

                      return (
                        <div
                          key={maintenance.id}
                          onMouseEnter={() => setHoveredId(maintenance.id)}
                          onMouseLeave={() => setHoveredId((current) => (current === maintenance.id ? null : current))}
                          className={`rounded-2xl border p-3 transition-all duration-200 ${getMaintenanceCardClasses(maintenance.status)} ${
                            hoveredId === maintenance.id ? 'z-10 scale-[1.01] shadow-sm ring-2 ring-primary/25' : 'hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/maintenance/preventive/workshop/${maintenance.id}`}
                                className="block text-sm font-semibold text-foreground transition-colors hover:text-primary"
                              >
                                {maintenance.machine_code} - {maintenance.machine_name}
                              </Link>
                              <div className="mt-1 text-xs text-muted-foreground">{maintenance.code}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">Tipo: </span>
                                {getMaintenanceIntervalLabel(maintenance)}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {getReferenceDateLabel(maintenance)} - {maintenance.site_name ?? 'Sin obra'}
                              </div>
                            </div>

                            <div className="flex items-start gap-2">
                              <button
                                type="button"
                                onClick={() => toggleExpanded(maintenance.id)}
                                className="rounded-lg border bg-white/80 p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                                title="Desplegar detalle"
                              >
                                <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(maintenance.id, maintenance.code)}
                                className="rounded-lg border border-red-200 bg-white/80 p-1.5 text-red-600 transition-colors hover:bg-red-50"
                                title="Eliminar mantenimiento"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {expanded ? (
                            <div className="mt-3 space-y-2 border-t pt-3 text-xs text-muted-foreground">
                              <div>
                                <span className="font-semibold text-foreground">Fecha: </span>
                                {getReferenceDateLabel(maintenance)}
                              </div>
                              <div>
                                <span className="font-semibold text-foreground">Duracion estimada: </span>
                                {maintenance.estimated_duration_hours} h
                              </div>
                              {maintenance.notes ? (
                                <div>
                                  <span className="font-semibold text-foreground">Nota: </span>
                                  {maintenance.notes}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      )
                    })
                ) : (
                  <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">No hay mantenimientos programados.</div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </section>

      {selectedDayKey ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-xl rounded-2xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-base font-semibold">Mantenimientos del dia</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(`${selectedDayKey}T12:00:00`).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayKey(null)}
                className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cerrar
              </button>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
              {selectedDayMaintenances.length > 0 ? (
                selectedDayMaintenances.map((maintenance) => (
                  <div key={maintenance.id} className={`rounded-2xl border p-4 ${getMaintenanceCardClasses(maintenance.status)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link to={`/maintenance/preventive/workshop/${maintenance.id}`} className="text-sm font-semibold hover:text-primary">
                          {maintenance.code}
                        </Link>
                        <div className="mt-1 text-xs text-muted-foreground">{maintenance.machine_code}</div>
                        <div className="mt-1 text-sm text-foreground">{maintenance.machine_name}</div>
                        <div className="mt-2 text-xs text-muted-foreground">{maintenance.site_name ?? 'Sin obra'}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {getReferenceDateLabel(maintenance)} · {getMaintenanceOpenBucketLabel(maintenance.status)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(maintenance.id, maintenance.code)}
                        className="rounded-lg border border-red-200 bg-white/80 p-1.5 text-red-600 transition-colors hover:bg-red-50"
                        title="Eliminar mantenimiento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                  No hay mantenimientos para este día.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function getReferenceDate(maintenance: PreventiveMaintenance) {
  return new Date(
    maintenance.scheduled_date ??
      maintenance.due_date ??
      maintenance.estimated_date ??
      maintenance.started_at ??
      maintenance.created_at,
  )
}

function getReferenceDateLabel(maintenance: PreventiveMaintenance) {
  return getReferenceDate(maintenance).toLocaleDateString('es-ES')
}

function toLocalIsoDate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function getMaintenanceStatusLabel(status: MaintenanceStatus) {
  if (status === 'scheduled') return 'Programado'
  if (status === 'upcoming') return 'Proximo'
  if (status === 'due') return 'A realizar'
  if (status === 'overdue') return 'Atrasado'
  if (status === 'in_progress') return 'En curso'
  if (status === 'completed') return 'Completado'
  return 'Cancelado'
}

function getMaintenanceOpenBucket(status: MaintenanceStatus): MaintenanceCalendarFilter {
  if (status === 'overdue') return 'overdue'
  if (status === 'in_progress') return 'in_progress'
  return 'programmed'
}

function getMaintenanceOpenBucketLabel(status: MaintenanceStatus) {
  if (getMaintenanceOpenBucket(status) === 'overdue') return 'Atrasado'
  if (getMaintenanceOpenBucket(status) === 'in_progress') return 'En curso'
  return 'Programado'
}

function getMaintenanceCardClasses(status: MaintenanceStatus) {
  if (status === 'overdue') return 'border-red-200 bg-red-50'
  if (status === 'due') return 'border-orange-200 bg-orange-50'
  if (status === 'upcoming') return 'border-yellow-200 bg-yellow-50'
  if (status === 'in_progress') return 'border-cyan-200 bg-cyan-50'
  return 'border-emerald-200 bg-emerald-50'
}

function getMaintenanceIntervalLabel(maintenance: PreventiveMaintenance) {
  if (maintenance.interval_hours) return `${maintenance.interval_hours} h`
  if (maintenance.maintenance_type === 'annual') return 'Anual'
  if (maintenance.maintenance_type === 'custom') return 'Personalizado'
  return `Tipo ${maintenance.maintenance_type}`
}
