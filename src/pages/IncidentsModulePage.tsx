import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, LayoutGrid, List, Trash2 } from 'lucide-react'
import { deleteBreakdown, getAllBreakdowns } from '../../../src/data/mockDatabase'

type IncidentViewMode = 'calendar' | 'list' | 'history'
type IncidentCategory = 'all' | 'critical_breakdown' | 'light_breakdown' | 'usage_doubt'
type BreakdownItem = ReturnType<typeof getAllBreakdowns>[number]
type TypeFilter = 'all' | BreakdownItem['breakdown_type']

export function IncidentsModulePage({ viewMode }: { viewMode: IncidentViewMode }) {
  const [activeCategory, setActiveCategory] = useState<IncidentCategory>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [expandedIncidentIds, setExpandedIncidentIds] = useState<string[]>([])
  const [deleteModeEnabled, setDeleteModeEnabled] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [calendarCursor, setCalendarCursor] = useState(() => new Date())
  const [hoveredIncidentId, setHoveredIncidentId] = useState<string | null>(null)
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)

  const allBreakdowns = useMemo(() => getAllBreakdowns(), [refreshKey])
  const sourceBreakdowns = useMemo(() => {
    if (viewMode === 'history') {
      return allBreakdowns.filter((incident) => incident.status === 'resolved')
    }
    return allBreakdowns
  }, [allBreakdowns, viewMode])

  const filteredBreakdowns = useMemo(() => {
    let current = sourceBreakdowns
    if (activeCategory !== 'all') {
      current = current.filter((incident) => getIncidentCategory(incident) === activeCategory)
    }
    if (viewMode === 'history' && typeFilter !== 'all') {
      current = current.filter((incident) => incident.breakdown_type === typeFilter)
    }
    return current
  }, [activeCategory, sourceBreakdowns, typeFilter, viewMode])

  const referenceDate = calendarCursor
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
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

  const incidentsByDay = useMemo(() => {
    const grouped = new Map<string, BreakdownItem[]>()

    filteredBreakdowns.forEach((incident) => {
      const key = new Date(incident.created_at).toISOString().slice(0, 10)
      const current = grouped.get(key) ?? []
      current.push(incident)
      grouped.set(key, current)
    })

    return grouped
  }, [filteredBreakdowns])

  const selectedDayIncidents = selectedDayKey ? incidentsByDay.get(selectedDayKey) ?? [] : []

  const categoryOptions: Array<{ key: IncidentCategory; label: string }> = [
    { key: 'all', label: 'Todas' },
    { key: 'critical_breakdown', label: 'Averias criticas' },
    { key: 'light_breakdown', label: 'Averias leves' },
    { key: 'usage_doubt', label: 'Dudas de funcionamiento' },
  ]
  const typeOptions: Array<{ key: TypeFilter; label: string }> = [
    { key: 'all', label: 'Todos los tipos' },
    { key: 'motor', label: 'Motor' },
    { key: 'hydraulic', label: 'Hidraulico' },
    { key: 'electrical', label: 'Eléctrico' },
    { key: 'electronic', label: 'Electronico' },
    { key: 'tires', label: 'Neumáticos' },
    { key: 'brakes', label: 'Frenos' },
    { key: 'transmission', label: 'Transmisión' },
    { key: 'structure', label: 'Estructura' },
    { key: 'other', label: 'Otros' },
  ]

  const counters = [
    {
      key: 'critical_breakdown' as IncidentCategory,
      label: 'Averias criticas',
      count: allBreakdowns.filter((incident) => getIncidentCategory(incident) === 'critical_breakdown').length,
      classes: 'border-red-200 bg-red-50 text-red-800',
    },
    {
      key: 'light_breakdown' as IncidentCategory,
      label: 'Averias leves',
      count: allBreakdowns.filter((incident) => getIncidentCategory(incident) === 'light_breakdown').length,
      classes: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    {
      key: 'usage_doubt' as IncidentCategory,
      label: 'Dudas de funcionamiento',
      count: allBreakdowns.filter((incident) => getIncidentCategory(incident) === 'usage_doubt').length,
      classes: 'border-blue-200 bg-blue-50 text-blue-800',
    },
  ]

  const handleDelete = (incidentId: string, incidentCode: string) => {
    const confirmed = window.confirm(`Se va a eliminar la incidencia ${incidentCode}. Esta accion no se puede deshacer.`)
    if (!confirmed) return

    const deleted = deleteBreakdown(incidentId)
    if (deleted) {
      setExpandedIncidentIds((current) => current.filter((id) => id !== incidentId))
      setRefreshKey((current) => current + 1)
    }
  }

  const toggleExpandedIncident = (incidentId: string) => {
    setExpandedIncidentIds((current) =>
      current.includes(incidentId) ? current.filter((id) => id !== incidentId) : [...current, incidentId],
    )
  }

  const moveCalendarMonth = (direction: -1 | 1) => {
    setCalendarCursor((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1))
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="grid gap-3 md:grid-cols-3">
        {counters.map((counter) => (
          <button
            key={counter.key}
            type="button"
            onClick={() => setActiveCategory(counter.key)}
            className={`rounded-2xl border p-4 text-left transition-all hover:shadow-sm ${counter.classes} ${
              activeCategory === counter.key ? 'ring-2 ring-primary/30' : ''
            }`}
          >
            <div className="text-3xl font-bold">{counter.count}</div>
            <div className="mt-1 text-sm font-semibold">{counter.label}</div>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="space-y-3">
          {viewMode !== 'history' && (
            <div className="flex items-center gap-1 rounded-lg border p-1">
              <Link
                to="/incidents"
                className={`rounded p-2 transition-colors ${
                  viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
                title="Vista calendario"
              >
                <LayoutGrid className="h-5 w-5" />
              </Link>
              <Link
                to="/incidents/list"
                className={`rounded p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
                title="Vista lista"
              >
                <List className="h-5 w-5" />
              </Link>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setActiveCategory(option.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategory === option.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => setDeleteModeEnabled((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              deleteModeEnabled
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-red-200 bg-background text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {deleteModeEnabled ? 'Salir de eliminar' : 'Eliminar averias'}
          </button>
        </div>
      )}

      {viewMode === 'history' && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">Tipo</label>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {typeOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {viewMode === 'calendar' ? (
        <section className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.8fr)] xl:[grid-auto-rows:650px]">
          <div className="flex h-[650px] self-start flex-col overflow-hidden rounded-2xl border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <button
                type="button"
                onClick={() => moveCalendarMonth(-1)}
                className="rounded-lg border p-2 text-muted-foreground transition-colors hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h3 className="text-base font-semibold capitalize">
                {monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                type="button"
                onClick={() => moveCalendarMonth(1)}
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
                const isoDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
                const incidents = incidentsByDay.get(isoDate) ?? []

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDayKey(isoDate)}
                    className={`h-[96px] overflow-hidden border-b border-r p-2 text-left transition-colors hover:bg-muted/30 ${
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
                      {incidents.map((incident) => (
                        <div
                          key={incident.id}
                          onClick={(event) => event.stopPropagation()}
                          onMouseEnter={() => setHoveredIncidentId(incident.id)}
                          onMouseLeave={() => setHoveredIncidentId((current) => (current === incident.id ? null : current))}
                          className={`rounded-md border p-1 text-[10px] transition-all duration-200 ${getIncidentCardClasses(
                            getIncidentCategory(incident),
                          )} ${
                            hoveredIncidentId === incident.id
                              ? 'z-10 scale-[1.03] shadow-md ring-2 ring-primary/25'
                              : 'hover:scale-[1.01] hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Link to={`/incidents/${incident.id}`} className="min-w-0 flex-1 hover:text-primary">
                              <div className="truncate font-semibold uppercase text-foreground">
                                {`${incident.machine_code} - ${incident.machine_name}`.toUpperCase()}
                              </div>
                              <div className="truncate text-[10px] text-muted-foreground">{incident.code}</div>
                              <div className="mt-0.5 text-[9px] font-medium text-foreground/80">
                                {getIncidentCategoryLabel(getIncidentCategory(incident))}
                              </div>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(incident.id, incident.code)}
                              className="rounded-md border border-red-200 bg-white/80 p-1 text-red-600 transition-colors hover:bg-red-50"
                              title="Eliminar incidencia"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <aside className="flex h-[650px] min-h-0 flex-col overflow-hidden rounded-2xl border bg-card">
            <div className="border-b px-4 py-3">
              <Link
                to="/incidents/new"
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Reportar averia
              </Link>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {filteredBreakdowns.map((incident) => {
                const expanded = expandedIncidentIds.includes(incident.id)
                const category = getIncidentCategory(incident)

                return (
                  <div
                    key={incident.id}
                    onMouseEnter={() => setHoveredIncidentId(incident.id)}
                    onMouseLeave={() => setHoveredIncidentId((current) => (current === incident.id ? null : current))}
                    className={`rounded-2xl border p-3 transition-all duration-200 ${getIncidentCardClasses(category)} ${
                      hoveredIncidentId === incident.id
                        ? 'z-10 scale-[1.02] shadow-md ring-2 ring-primary/25'
                        : 'hover:scale-[1.01] hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link to={`/incidents/${incident.id}`} className="text-sm font-semibold hover:text-primary">
                          {`${incident.machine_code} - ${incident.machine_name}`.toUpperCase()}
                        </Link>
                        <div className="mt-1 text-xs text-muted-foreground">{incident.code}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(incident.created_at).toLocaleDateString('es-ES')} ·{' '}
                          {new Date(incident.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="mt-1 text-xs font-medium text-foreground/80">{getIncidentCategoryLabel(category)}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpandedIncident(incident.id)}
                          className="rounded-lg border bg-white/80 p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                          title="Desplegar detalle"
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(incident.id, incident.code)}
                          className="rounded-lg border border-red-200 bg-white/80 p-1.5 text-red-600 transition-colors hover:bg-red-50"
                          title="Eliminar incidencia"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-3 space-y-2 border-t pt-3 text-xs text-muted-foreground">
                        <div>
                          <span className="font-semibold text-foreground">Título: </span>
                          {incident.title}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Descripción: </span>
                          {incident.description}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Severidad: </span>
                          {incident.severity}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Estado tecnico: </span>
                          {incident.status}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Fecha: </span>
                          {new Date(incident.created_at).toLocaleDateString('es-ES')} ·{' '}
                          {new Date(incident.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Obra: </span>
                          {incident.site_name ?? 'Sin obra'}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>
        </section>
      ) : (
        <section className="min-h-0 flex-1 overflow-hidden rounded-2xl border bg-card">
          <div className="h-full overflow-auto">
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Codigo</th>
                <th className="px-4 py-3">Maquina</th>
                <th className="px-4 py-3">Descripción</th>
                {viewMode === 'history' && <th className="px-4 py-3">Tipo</th>}
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha creacion</th>
              </tr>
            </thead>
            <tbody>
              {filteredBreakdowns.map((incident) => (
                <tr key={incident.id} className="border-t transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {deleteModeEnabled && (
                        <button
                          type="button"
                          onClick={() => handleDelete(incident.id, incident.code)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-200 bg-red-50 text-sm font-bold text-red-700 transition-colors hover:bg-red-100"
                          title="Eliminar incidencia"
                        >
                          -
                        </button>
                      )}
                      <Link to={`/incidents/${incident.id}`} className="font-medium hover:text-primary">
                        {incident.code}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{incident.machine_code}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{incident.title}</td>
                  {viewMode === 'history' && (
                    <td className="px-4 py-3 text-sm text-muted-foreground">{getBreakdownTypeLabel(incident.breakdown_type)}</td>
                  )}
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {getIncidentCategoryLabel(getIncidentCategory(incident))}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <div>{new Date(incident.created_at).toLocaleDateString('es-ES')}</div>
                    <div className="mt-1 text-xs text-muted-foreground/80">
                      {new Date(incident.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
      )}

      {selectedDayKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-xl rounded-2xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-base font-semibold">Incidencias del dia</h3>
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
              {selectedDayIncidents.length > 0 ? (
                selectedDayIncidents.map((incident) => {
                  const category = getIncidentCategory(incident)
                  return (
                    <div key={incident.id} className={`rounded-2xl border p-4 ${getIncidentCardClasses(category)}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link to={`/incidents/${incident.id}`} className="text-sm font-semibold hover:text-primary">
                            {`${incident.machine_code} - ${incident.machine_name}`.toUpperCase()}
                          </Link>
                          <div className="mt-1 text-xs text-muted-foreground">{incident.code}</div>
                          <div className="mt-1 text-xs font-medium text-foreground/80">
                            {getIncidentCategoryLabel(category)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(incident.id, incident.code)}
                          className="rounded-lg border border-red-200 bg-white/80 p-1.5 text-red-600 transition-colors hover:bg-red-50"
                          title="Eliminar incidencia"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 space-y-2 border-t pt-3 text-xs text-muted-foreground">
                        <div>
                          <span className="font-semibold text-foreground">Título: </span>
                          {incident.title}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Descripción: </span>
                          {incident.description}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Fecha: </span>
                          {new Date(incident.created_at).toLocaleDateString('es-ES')} ·{' '}
                          {new Date(incident.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">Obra: </span>
                          {incident.site_name ?? 'Sin obra'}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  No hay incidencias en este día.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getIncidentCategory(incident: BreakdownItem): IncidentCategory {
  const description = incident.description?.toLowerCase() ?? ''

  if (description.includes('clasificación guiada: duda de funcionamiento')) return 'usage_doubt'
  if (description.includes('clasificación guiada: avería leve')) return 'light_breakdown'
  if (description.includes('clasificación guiada: avería crítica')) return 'critical_breakdown'
  if (incident.severity === 'critical') return 'critical_breakdown'
  return 'light_breakdown'
}

function getIncidentCategoryLabel(category: IncidentCategory) {
  if (category === 'critical_breakdown') return 'Avería crítica'
  if (category === 'light_breakdown') return 'Avería leve'
  if (category === 'usage_doubt') return 'Duda de funcionamiento'
  return 'Todas'
}

function getIncidentCardClasses(category: IncidentCategory) {
  if (category === 'critical_breakdown') return 'border-red-200 bg-red-50'
  if (category === 'usage_doubt') return 'border-blue-200 bg-blue-50'
  return 'border-amber-200 bg-amber-50'
}

function getBreakdownTypeLabel(type: BreakdownItem['breakdown_type']) {
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
