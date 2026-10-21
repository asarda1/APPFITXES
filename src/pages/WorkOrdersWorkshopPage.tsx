import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, Package, PlayCircle, Trash2, Wrench, FilterX, Calendar } from 'lucide-react'
import { deleteWorkOrder, MOCK_WORK_ORDERS } from '../../../src/data/mockDatabase'
import type { WorkOrder } from '../../../src/types/workOrder'

type WorkOrdersWorkshopMode = 'open' | 'history'
type WorkOrderKindFilter = 'all' | 'maintenance' | 'repair'
type OpenStageFilter = 'all' | 'pending_open' | 'opened' | 'in_progress' | 'pending_material' | 'pending_close'
type HistoryFilter = 'all' | 'maintenance' | 'repair'
type WorkOrderOrderTypeFilter = 'all' | 'Reparaciones' | 'Desgaste'

export function WorkOrdersWorkshopPage({ mode }: { mode: WorkOrdersWorkshopMode }) {
  const [kindFilter, setKindFilter] = useState<WorkOrderKindFilter>('all')
  const [stageFilter, setStageFilter] = useState<OpenStageFilter>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [orderTypeFilter, setOrderTypeFilter] = useState<WorkOrderOrderTypeFilter>('all')

  // Filtros avanzados
  const [machineFilter, setMachineFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all')
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')

  const sourceOrders = useMemo(() => {
    if (mode === 'history') {
      return MOCK_WORK_ORDERS.filter((order) => order.status === 'closed')
    }
    return MOCK_WORK_ORDERS.filter((order) => order.status !== 'closed')
  }, [mode, refreshKey])

  const availableMachines = useMemo(() => {
    const machines = new Map<string, string>() // code -> name
    sourceOrders.forEach(o => {
      if (o.machine_code) {
        machines.set(o.machine_code, o.machine_name || o.machine_code)
      }
    })
    return Array.from(machines.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [sourceOrders])

  const availableMonths = useMemo(() => {
    const months = new Set(sourceOrders.map(o => new Date(o.created_at).getMonth() + 1))
    return Array.from(months).sort((a, b) => a - b)
  }, [sourceOrders])

  const availableYears = useMemo(() => {
    const years = new Set(sourceOrders.map(o => new Date(o.created_at).getFullYear()))
    return Array.from(years).sort((a, b) => b - a)
  }, [sourceOrders])

  const filteredOrders = useMemo(() => {
    return sourceOrders.filter((order) => {
      if (kindFilter !== 'all' && getWorkOrderKind(order) !== kindFilter) return false
      if (mode === 'open' && stageFilter !== 'all' && getOpenStage(order) !== stageFilter) return false
      if (orderTypeFilter !== 'all' && order.category !== orderTypeFilter) return false
      
      if (machineFilter !== 'all' && order.machine_code !== machineFilter) return false
      
      const orderDate = new Date(order.created_at)
      if (monthFilter !== 'all' && (orderDate.getMonth() + 1) !== monthFilter) return false
      if (yearFilter !== 'all' && orderDate.getFullYear() !== yearFilter) return false

      return true
    })
  }, [kindFilter, mode, sourceOrders, stageFilter, orderTypeFilter, machineFilter, monthFilter, yearFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link
          to="/work-orders"
          className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
            mode === 'open'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'bg-background transition-colors hover:bg-muted'
          }`}
        >
          OT abiertas
        </Link>
        <Link
          to="/work-orders/history"
          className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
            mode === 'history'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'bg-background transition-colors hover:bg-muted'
          }`}
        >
          Historico de OT
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setKindFilter('all')
            setOrderTypeFilter('all')
          }}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            kindFilter === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
          }`}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => {
            setKindFilter('maintenance')
            setOrderTypeFilter('all')
          }}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            kindFilter === 'maintenance'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          Ordenes de mantenimiento
        </button>
        <button
          type="button"
          onClick={() => {
            setKindFilter('repair')
            setOrderTypeFilter('Reparaciones')
          }}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            kindFilter === 'repair' && orderTypeFilter !== 'Desgaste'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          Ordenes de reparacion
        </button>
        <button
          type="button"
          onClick={() => {
            setKindFilter('repair')
            setOrderTypeFilter('Desgaste')
          }}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            kindFilter === 'repair' && orderTypeFilter === 'Desgaste'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'bg-background hover:bg-muted'
          }`}
        >
          Ordenes de desgaste
        </button>
      </div>



      {/* Advanced Filters (Machine, Month, Year) */}
      <div className="flex flex-wrap items-center gap-4 py-2">
        {(machineFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all') && (
          <button
            onClick={() => {
              setMachineFilter('all')
              setMonthFilter('all')
              setYearFilter('all')
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <FilterX className="h-3.5 w-3.5" />
            Limpiar filtros
          </button>
        )}
        
        {availableMachines.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm bg-background">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <select
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
              className="bg-transparent focus:outline-none"
            >
              <option value="all">Todas las máquinas</option>
              {availableMachines.map(([code, name]) => (
                <option key={code} value={code}>
                  {code} - {name}
                </option>
              ))}
            </select>
          </div>
        )}

        {availableYears.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm bg-background">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-transparent focus:outline-none"
            >
              <option value="all">Todos los años</option>
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}

        {availableMonths.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm bg-background">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-transparent focus:outline-none"
            >
              <option value="all">Todos los meses</option>
              {availableMonths.map(month => {
                const monthNameRaw = new Date(2000, month - 1, 1).toLocaleString('es-ES', { month: 'long' })
                const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1)
                return (
                  <option key={month} value={month}>
                    {monthName}
                  </option>
                )
              })}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <Link
              key={order.id}
              to={`/work-orders/${order.id}`}
              className={`block rounded-2xl border p-4 transition-all hover:shadow-sm ${getWorkOrderCardClasses(order)}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-foreground">{order.code}</div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getKindBadgeClasses(order)}`}>
                      {getWorkOrderKindLabel(order)}
                    </span>
                    <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold">
                      {getWorkshopStageLabel(order, mode)}
                    </span>
                  </div>

                  {getWorkOrderKind(order) === 'maintenance' ? (
                    <>
                      <div className="mt-2 text-base font-semibold text-foreground">
                        {order.machine_code} · {order.machine_name.toUpperCase()}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {formatMaintenanceLabel(order.title)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mt-2 text-base font-semibold text-foreground">{order.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {order.machine_code} · {order.machine_name}
                      </div>
                    </>
                  )}

                  <div className="mt-1 text-sm text-muted-foreground">{order.workshop}</div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                    <div>
                      <span className="font-semibold text-foreground">Origen: </span>
                      {getOriginLabel(order)}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Apertura: </span>
                      {formatDate(order.created_at)}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Asignados: </span>
                      {order.assigned_to.length}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {getKindIcon(order)}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()

                      const confirmed = window.confirm(`¿Quieres eliminar la OT ${order.code}?`)
                      if (!confirmed) return

                      const deleted = deleteWorkOrder(order.id)
                      if (deleted) {
                        setRefreshKey((value) => value + 1)
                      }
                    }}
                    className="rounded-full border border-red-200 bg-white p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Eliminar orden"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
            No hay ordenes de trabajo para los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  )
}

function getWorkOrderKind(order: WorkOrder): WorkOrderKindFilter {
  return order.origin_type === 'preventive' || order.category === 'Mantenimiento' ? 'maintenance' : 'repair'
}

function getWorkOrderKindLabel(order: WorkOrder) {
  if (getWorkOrderKind(order) === 'maintenance') return 'Orden de mantenimiento'
  if (order.category === 'Desgaste') return 'Orden de desgaste'
  return 'Orden de reparacion'
}

function getKindBadgeClasses(order: WorkOrder) {
  if (order.category === 'Desgaste') return 'border-violet-200 bg-violet-50 text-violet-700'
  return getWorkOrderKind(order) === 'maintenance'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-orange-200 bg-orange-50 text-orange-700'
}

function getOpenStage(order: WorkOrder): OpenStageFilter {
  if (getWorkOrderKind(order) === 'maintenance') {
    return order.status === 'closed' ? 'pending_close' : 'opened'
  }

  if (order.status === 'new') return 'pending_open'
  if (order.status === 'in_diagnosis') return 'opened'
  if (order.status === 'in_progress') return 'in_progress'
  if (order.status === 'pending_material') return 'pending_material'
  return 'pending_close'
}

function getWorkshopStageLabel(order: WorkOrder, mode: WorkOrdersWorkshopMode) {
  if (mode === 'history') return 'Cerrada'

  if (getWorkOrderKind(order) === 'maintenance') {
    return 'Abierta'
  }

  if (order.status === 'new') return 'Pendiente de abrir'
  if (order.status === 'in_diagnosis') return 'Abierta'
  if (order.status === 'in_progress') return 'En curso'
  if (order.status === 'pending_material') return 'Pendiente de material'
  if (order.status === 'pending_validation' || order.status === 'completed') return 'Pendiente de cierre'
  return 'Cerrada'
}

function getOriginLabel(order: WorkOrder) {
  if (getWorkOrderKind(order) === 'maintenance') return 'Mantenimiento'
  return 'Incidencia'
}

function getWorkOrderCardClasses(order: WorkOrder) {
  if (getWorkOrderKind(order) === 'maintenance') return 'border-emerald-200 bg-emerald-50/60'
  if (order.category === 'Desgaste') return 'border-violet-200 bg-violet-50/60'
  if (order.status === 'pending_material') return 'border-amber-200 bg-amber-50/70'
  if (order.status === 'in_progress') return 'border-cyan-200 bg-cyan-50/60'
  return 'border-orange-200 bg-orange-50/60'
}

function getKindIcon(order: WorkOrder) {
  if (getWorkOrderKind(order) === 'maintenance') {
    return <ClipboardCheck className="h-5 w-5 text-emerald-600" />
  }
  if (order.status === 'pending_material') {
    return <Package className="h-5 w-5 text-amber-600" />
  }
  if (order.status === 'in_progress') {
    return <PlayCircle className="h-5 w-5 text-cyan-600" />
  }
  return <Wrench className="h-5 w-5 text-orange-600" />
}

function formatMaintenanceLabel(value: string) {
  return value.replace(/^Mantenimiento preventivo\s+/i, 'Mantenimiento ')
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES')
}
