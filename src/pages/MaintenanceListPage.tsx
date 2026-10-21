import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, LayoutGrid, List, Plus, Trash2 } from 'lucide-react'
import type { MaintenanceStatus, PreventiveMaintenance } from '../../src/types/preventiveMaintenance'
import { deleteWorkshopMaintenance, getWorkshopMaintenances } from '../data/workshopMaintenances'

type MaintenanceListFilter = 'all' | 'programmed' | 'overdue' | 'in_progress'
type MaintenanceViewMode = 'generated' | 'programmed'

export function MaintenanceListPage() {
  const [activeFilter, setActiveFilter] = useState<MaintenanceListFilter>('all')
  const [viewMode, setViewMode] = useState<MaintenanceViewMode>('programmed')
  const [allMaintenances, setAllMaintenances] = useState<PreventiveMaintenance[]>([])
  const [deleteModeEnabled, setDeleteModeEnabled] = useState(false)

  useEffect(() => {
    setAllMaintenances(getWorkshopMaintenances())
  }, [])

  const openMaintenances = useMemo(
    () => allMaintenances.filter((maintenance) => maintenance.status !== 'completed' && maintenance.status !== 'cancelled'),
    [allMaintenances],
  )

  const viewMaintenances = useMemo(() => {
    if (viewMode === 'generated') {
      return openMaintenances.filter((maintenance) => maintenance.status === 'due')
    }

    return openMaintenances.filter((maintenance) => maintenance.status === 'scheduled')
  }, [openMaintenances, viewMode])

  const filteredMaintenances = useMemo(() => {
    if (activeFilter === 'overdue') {
      return openMaintenances.filter((maintenance) => getMaintenanceOpenBucket(maintenance.status) === 'overdue')
    }
    if (activeFilter === 'all') return viewMaintenances
    return viewMaintenances.filter((maintenance) => getMaintenanceOpenBucket(maintenance.status) === activeFilter)
  }, [activeFilter, openMaintenances, viewMaintenances])

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

  const handleDelete = (maintenanceId: string, maintenanceCode: string) => {
    const confirmed = window.confirm(`Se va a eliminar el mantenimiento ${maintenanceCode}. Esta accion no se puede deshacer.`)
    if (!confirmed) return

    const deleted = deleteWorkshopMaintenance(maintenanceId)
    if (deleted) {
      setAllMaintenances(getWorkshopMaintenances())
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Listado preventivo</h1>
          <p className="mt-1 text-muted-foreground">
            Vista en lista de los mantenimientos preventivos generados desde VEOSAT.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewMode((current) => (current === 'generated' ? 'programmed' : 'generated'))}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
            viewMode === 'generated'
              ? 'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
          title="Alternar entre mantenimientos generados (aviso) y programados"
        >
          <LayoutGrid className="h-4 w-4" />
          Generados/Programados: {viewMode === 'generated' ? 'Generados' : 'Programados'}
        </button>
      </div>

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
              setActiveFilter(counter.key as MaintenanceListFilter)
            }}
            className={`rounded-2xl border p-4 text-left transition-all hover:shadow-sm ${counter.classes} ${
              (counter.key === 'generated' && viewMode === 'generated' && activeFilter === 'all') ||
              (counter.key === 'programmed' && viewMode === 'programmed' && activeFilter === 'all') ||
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
          className="rounded p-2 transition-colors hover:bg-muted"
          title="Vista calendario"
        >
          <LayoutGrid className="h-5 w-5" />
        </Link>
        <Link
          to="/maintenance/preventive/list"
          className="rounded p-2 transition-colors bg-primary text-primary-foreground"
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
              onClick={() => setActiveFilter(option.key as MaintenanceListFilter)}
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
          {deleteModeEnabled ? 'Salir de eliminar' : 'Eliminar mantenimientos'}
        </button>
      </div>

      <section className="rounded-2xl border bg-card">
        <div className="border-b px-5 py-4">
          <div className="flex items-center gap-2 text-base font-semibold">
            <List className="h-4 w-4" />
            Mantenimientos en lista
          </div>
        </div>

        {filteredMaintenances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Codigo</th>
                  <th className="px-4 py-3">Maquina</th>
                  <th className="px-4 py-3">Obra</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Asignado a</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaintenances.map((maintenance) => (
                  <tr key={maintenance.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {deleteModeEnabled ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(maintenance.id, maintenance.code)}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-200 bg-red-50 text-sm font-bold text-red-700 transition-colors hover:bg-red-100"
                            title="Eliminar mantenimiento"
                          >
                            -
                          </button>
                        ) : null}
                        <Link
                          to={`/maintenance/preventive/workshop/${maintenance.id}`}
                          className="font-semibold text-foreground transition-colors hover:text-primary"
                        >
                          {maintenance.code}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{maintenance.machine_code}</div>
                      <div className="text-xs text-muted-foreground">{maintenance.machine_name}</div>
                    </td>
                    <td className="px-4 py-3">{maintenance.site_name ?? 'Sin obra'}</td>
                    <td className="px-4 py-3">{getMaintenanceIntervalLabel(maintenance)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(maintenance.status)}`}>
                        {getMaintenanceOpenBucketLabel(maintenance.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getReferenceDateLabel(maintenance)}</td>
                    <td className="px-4 py-3">{maintenance.assigned_to_names?.join(', ') ?? 'Sin asignar'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5 text-sm text-muted-foreground">
            Todavia no hay mantenimientos creados. Usa `Generacion automatica` para simular el alta desde VEOSAT.
          </div>
        )}
      </section>
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

function getMaintenanceStatusLabel(status: MaintenanceStatus) {
  if (status === 'scheduled') return 'Programado'
  if (status === 'upcoming') return 'Proximo'
  if (status === 'due') return 'A realizar'
  if (status === 'overdue') return 'Atrasado'
  if (status === 'in_progress') return 'En curso'
  if (status === 'completed') return 'Completado'
  return 'Cancelado'
}

function getMaintenanceOpenBucket(status: MaintenanceStatus): MaintenanceListFilter {
  if (status === 'overdue') return 'overdue'
  if (status === 'in_progress') return 'in_progress'
  return 'programmed'
}

function getMaintenanceOpenBucketLabel(status: MaintenanceStatus) {
  if (getMaintenanceOpenBucket(status) === 'overdue') return 'Atrasado'
  if (getMaintenanceOpenBucket(status) === 'in_progress') return 'En curso'
  return 'Programado'
}

function getStatusClasses(status: MaintenanceStatus) {
  if (status === 'overdue') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'due') return 'border-orange-200 bg-orange-50 text-orange-700'
  if (status === 'upcoming') return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  if (status === 'in_progress') return 'border-cyan-200 bg-cyan-50 text-cyan-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function getMaintenanceIntervalLabel(maintenance: PreventiveMaintenance) {
  if (maintenance.interval_hours) return `${maintenance.interval_hours} h`
  return 'Preventivo'
}
