import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MaintenanceStatus, PreventiveMaintenance } from '../../src/types/preventiveMaintenance'
import { getWorkshopMaintenances } from '../data/workshopMaintenances'

type MaintenanceHistoryFilter = 'all' | 'completed' | 'cancelled'

export function MaintenanceHistoryPage() {
  const [activeFilter, setActiveFilter] = useState<MaintenanceHistoryFilter>('all')
  const [allMaintenances, setAllMaintenances] = useState<PreventiveMaintenance[]>([])

  useEffect(() => {
    setAllMaintenances(getWorkshopMaintenances())
  }, [])

  const historyMaintenances = useMemo(
    () => allMaintenances.filter((maintenance) => maintenance.status === 'completed' || maintenance.status === 'cancelled'),
    [allMaintenances],
  )

  const filteredMaintenances = useMemo(() => {
    if (activeFilter === 'all') return historyMaintenances
    return historyMaintenances.filter((maintenance) => maintenance.status === activeFilter)
  }, [activeFilter, historyMaintenances])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link
          to="/maintenance/preventive/calendar"
          className="rounded-lg border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
        >
          Mantenimientos abiertos
        </Link>
        <Link
          to="/maintenance/preventive/history"
          className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Historico de mantenimientos
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'completed', label: 'Completados' },
          { key: 'cancelled', label: 'Cancelados' },
        ].map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setActiveFilter(option.key as MaintenanceHistoryFilter)}
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

      <section className="rounded-2xl border bg-card">
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
                </tr>
              </thead>
              <tbody>
                {filteredMaintenances.map((maintenance) => (
                  <tr key={maintenance.id} className="border-t">
                    <td className="px-4 py-3">
                      <Link
                        to={`/maintenance/preventive/workshop/${maintenance.id}`}
                        className="font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        {maintenance.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{maintenance.machine_code}</div>
                      <div className="text-xs text-muted-foreground">{maintenance.machine_name}</div>
                    </td>
                    <td className="px-4 py-3">{maintenance.site_name ?? 'Sin obra'}</td>
                    <td className="px-4 py-3">{getMaintenanceIntervalLabel(maintenance)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(maintenance.status)}`}>
                        {getMaintenanceStatusLabel(maintenance.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getReferenceDateLabel(maintenance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5 text-sm text-muted-foreground">Todavia no hay mantenimientos historicos.</div>
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

function getStatusClasses(status: MaintenanceStatus) {
  if (status === 'overdue') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'due') return 'border-orange-200 bg-orange-50 text-orange-700'
  if (status === 'upcoming') return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  if (status === 'in_progress') return 'border-cyan-200 bg-cyan-50 text-cyan-700'
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function getMaintenanceIntervalLabel(maintenance: PreventiveMaintenance) {
  if (maintenance.interval_hours) return `${maintenance.interval_hours} h`
  return 'Preventivo'
}
