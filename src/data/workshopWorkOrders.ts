import { createWorkOrder, MOCK_WORK_ORDERS } from '../../../src/data/mockDatabase'
import type { PreventiveMaintenance } from '../../../src/types/preventiveMaintenance'
import type { WorkOrder, WorkshopLocation } from '../../../src/types/workOrder'
import type { Incident } from '../../../src/types/incident'

export type WorkshopOrderCenter = 'Taller Frares' | 'Taller Zaragoza'

export function getMaintenanceWorkOrder(maintenanceId: string) {
  return (
    MOCK_WORK_ORDERS.find(
      (order) => order.origin_type === 'preventive' && order.origin_id === maintenanceId,
    ) ?? null
  )
}

export function getIncidentWorkOrder(incidentId: string) {
  return (
    MOCK_WORK_ORDERS.find(
      (order) => order.origin_type === 'corrective' && order.origin_id === incidentId,
    ) ?? null
  )
}

export function createIncidentWorkOrder(
  incident: Incident,
  center: WorkshopOrderCenter,
  orderType: 'Orden de Reparación' | 'Orden de Desgaste' = 'Orden de Reparación',
) {
  const existing = getIncidentWorkOrder(incident.id)
  if (existing) {
    return existing
  }

  const now = new Date()
  const sequence = `${now.getFullYear()}${String(MOCK_WORK_ORDERS.length + 1).padStart(4, '0')}`
  const id = `wo-inc-${now.getTime()}`
  const code = `OT-${sequence}`
  const workshop = mapCenterToWorkshop(center)

  const workOrder: WorkOrder = {
    id,
    code,
    machine_id: incident.machine_id,
    machine_code: incident.machine_code || 'N/A',
    machine_name: incident.machine_name || 'N/A',
    workshop,
    type: 'corrective',
    category: orderType === 'Orden de Reparación' ? 'Reparaciones' : 'Desgaste',
    priority: incident.severity === 'critical' ? 'high' : incident.severity === 'high' ? 'high' : 'medium',
    status: 'in_diagnosis',
    title: `Reparación: ${incident.title}`,
    description: `OT generada desde incidencia ${incident.code}. Máquina: ${incident.machine_code}. Descripción: ${incident.description}.`,
    created_at: now.toISOString(),
    closing_date: 'open',
    origin_type: 'corrective',
    origin_id: incident.id,
    assigned_to: [],
    estimated_hours: 0,
    actual_hours: 0,
    progress_percentage: 0,
    materials: [],
    total_material_cost: 0,
    labor_entries: [],
    total_labor_cost: 0,
    images: incident.images || [],
    documents: [],
    comments: [],
    history: [
      {
        id: `wo-history-${now.getTime()}`,
        timestamp: now.toISOString(),
        action: 'OT creada desde incidencia',
        user_id: 'workshop-redesign-user',
        user_name: 'Taller',
        notes: `Centro: ${center}`,
      },
    ],
    updated_at: now.toISOString(),
  }

  createWorkOrder(workOrder)
  return workOrder
}

export function createMaintenanceWorkOrder(
  maintenance: PreventiveMaintenance,
  center: WorkshopOrderCenter,
) {
  const existing = getMaintenanceWorkOrder(maintenance.id)
  if (existing) {
    return existing
  }

  const now = new Date()
  const sequence = `${now.getFullYear()}${String(MOCK_WORK_ORDERS.length + 1).padStart(4, '0')}`
  const id = `wo-maint-${now.getTime()}`
  const code = `OT-${sequence}`
  const workshop = mapCenterToWorkshop(center)
  const intervalLabel = maintenance.interval_hours
    ? `${maintenance.interval_hours} h`
    : maintenance.maintenance_type

  const workOrder: WorkOrder = {
    id,
    code,
    machine_id: maintenance.machine_id,
    machine_code: maintenance.machine_code,
    machine_name: maintenance.machine_name,
    workshop,
    type: 'preventive',
    category: 'Mantenimiento',
    priority: maintenance.priority === 'critical' ? 'high' : maintenance.priority === 'high' ? 'high' : 'medium',
    status: 'in_diagnosis',
    title: `Mantenimiento preventivo ${intervalLabel}`,
    description: `OT generada desde mantenimiento preventivo ${maintenance.code}. Máquina: ${maintenance.machine_code}. Tipo: ${intervalLabel}. Horas acumuladas: ${maintenance.current_hours ?? 0} h.`,
    created_at: now.toISOString(),
    scheduled_date: maintenance.scheduled_date,
    closing_date: 'open',
    origin_type: 'preventive',
    origin_id: maintenance.id,
    maintenance_template_id: maintenance.id,
    assigned_to: [],
    estimated_hours: maintenance.estimated_duration_hours ?? 0,
    actual_hours: 0,
    progress_percentage: 0,
    materials: [],
    total_material_cost: 0,
    labor_entries: [],
    total_labor_cost: 0,
    images: [],
    documents: maintenance.maintenance_sheet?.file_name ? [maintenance.maintenance_sheet.file_name] : [],
    comments: [],
    history: [
      {
        id: `wo-history-${now.getTime()}`,
        timestamp: now.toISOString(),
        action: 'OT creada desde mantenimiento preventivo',
        user_id: 'workshop-redesign-user',
        user_name: 'Taller',
        notes: `Centro: ${center}`,
      },
    ],
    updated_at: now.toISOString(),
  }

  createWorkOrder(workOrder)
  return workOrder
}

function mapCenterToWorkshop(center: WorkshopOrderCenter): WorkshopLocation {
  return center === 'Taller Zaragoza' ? 'Taller Zaragoza' : 'Taller Frares'
}
