import type { MaintenanceStatus, MaintenanceType, PreventiveMaintenance } from '../../src/types/preventiveMaintenance'

const STORAGE_KEY = 'frontend_redesign_workshop_preventive_maintenances_v2'

function loadMaintenances(): PreventiveMaintenance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PreventiveMaintenance[]
  } catch {
    return []
  }
}

function saveMaintenances(maintenances: PreventiveMaintenance[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(maintenances))
}

export function getWorkshopMaintenances() {
  return loadMaintenances().sort((a, b) => {
    const left = getReferenceDate(a).getTime()
    const right = getReferenceDate(b).getTime()
    return left - right
  })
}

export function getWorkshopMaintenanceById(id: string) {
  return loadMaintenances().find((maintenance) => maintenance.id === id) ?? null
}

export function updateWorkshopMaintenanceScheduledDate(id: string, scheduledDate: string) {
  const current = loadMaintenances()
  let updatedMaintenance: PreventiveMaintenance | null = null

  const updated = current.map((maintenance) => {
    if (maintenance.id !== id) {
      return maintenance
    }

    const now = new Date().toISOString()
    updatedMaintenance = {
      ...maintenance,
      scheduled_date: scheduledDate,
      due_date: scheduledDate,
      status: 'scheduled',
      updated_at: now,
      timeline: [
        {
          id: `maintenance-timeline-rescheduled-${Date.now()}`,
          event_type: 'rescheduled',
          description: `Fecha programada ajustada a ${new Date(scheduledDate).toLocaleDateString('es-ES')}.`,
          user_name: 'Taller',
          created_at: now,
        },
        ...maintenance.timeline,
      ],
    }

    return updatedMaintenance
  })

  saveMaintenances(updated)
  return updatedMaintenance
}

export function updateWorkshopMaintenanceSheet(
  id: string,
  sheet: {
    file_name: string
    file_type: string
    file_data_url: string
  },
) {
  const current = loadMaintenances()
  let updatedMaintenance: PreventiveMaintenance | null = null

  const updated = current.map((maintenance) => {
    if (maintenance.id !== id) {
      return maintenance
    }

    // Evitar duplicados (por ejemplo, doble ejecución en StrictMode)
    if (maintenance.maintenance_sheet?.file_name === sheet.file_name) {
      updatedMaintenance = maintenance
      return maintenance
    }

    const now = new Date().toISOString()
    updatedMaintenance = {
      ...maintenance,
      maintenance_sheet: {
        ...sheet,
        uploaded_at: now,
        uploaded_by_name: 'Taller',
      },
      updated_at: now,
      timeline: [
        {
          id: `maintenance-timeline-sheet-${Date.now()}`,
          event_type: 'scheduled',
          description: `Ficha de mantenimiento cargada: ${sheet.file_name}.`,
          user_name: 'Taller',
          created_at: now,
        },
        ...maintenance.timeline,
      ],
    }

    return updatedMaintenance
  })

  saveMaintenances(updated)
  return updatedMaintenance
}

export function removeWorkshopMaintenanceSheet(id: string) {
  const current = loadMaintenances()
  let updatedMaintenance: PreventiveMaintenance | null = null

  const updated = current.map((maintenance) => {
    if (maintenance.id !== id || !maintenance.maintenance_sheet) {
      return maintenance
    }

    const now = new Date().toISOString()
    updatedMaintenance = {
      ...maintenance,
      maintenance_sheet: undefined,
      updated_at: now,
      timeline: [
        {
          id: `maintenance-timeline-sheet-removed-${Date.now()}`,
          event_type: 'scheduled',
          description: 'Ficha de mantenimiento eliminada.',
          user_name: 'Taller',
          created_at: now,
        },
        ...maintenance.timeline,
      ],
    }

    return updatedMaintenance
  })

  saveMaintenances(updated)
  return updatedMaintenance
}

export function deleteWorkshopMaintenance(id: string) {
  const current = loadMaintenances()
  const next = current.filter((maintenance) => maintenance.id !== id)
  const deleted = next.length !== current.length

  if (deleted) {
    saveMaintenances(next)
  }

  return deleted
}

export function createWorkshopMaintenance(input: {
  machineCode: string
  machineName: string
  machineType: string
  siteName: string
  maintenanceType: MaintenanceType
  status: MaintenanceStatus
  scheduledDate: string
  estimatedDurationHours: number
  currentHours?: number
  intervalHours?: number
  assignedToNames?: string[]
  notes?: string
}) {
  const current = loadMaintenances()
  const now = new Date()
  const sequence = String(now.getTime()).slice(-4)
  const code = `PREV-${now.getFullYear()}-${sequence}`

  const maintenance: PreventiveMaintenance = {
    id: `workshop-maintenance-${now.getTime()}`,
    code,
    machine_id: input.machineCode.toLowerCase(),
    machine_code: input.machineCode,
    machine_name: input.machineName,
    machine_type: input.machineType,
    site_name: input.siteName,
    maintenance_type: input.maintenanceType,
    status: input.status,
    priority: input.status === 'overdue' ? 'critical' : input.status === 'due' ? 'high' : 'medium',
    alert_level: input.status === 'overdue' ? 'red' : input.status === 'due' || input.status === 'upcoming' ? 'yellow' : 'green',
    interval_type: 'days',
    interval_hours: input.intervalHours,
    interval_days: 30,
    days_remaining: 0,
    current_hours: input.currentHours,
    completion_percentage: input.status === 'scheduled' ? 0 : input.status === 'upcoming' ? 70 : input.status === 'due' ? 100 : input.status === 'in_progress' ? 45 : 110,
    scheduled_date: input.scheduledDate,
    due_date: input.scheduledDate,
    checklist: [],
    checklist_completion_percentage: input.status === 'in_progress' ? 45 : 0,
    materials: [],
    materials_ready: true,
    assigned_to_names: input.assignedToNames,
    estimated_duration_hours: input.estimatedDurationHours,
    notes: input.notes,
    created_at: now.toISOString(),
    created_by: 'workshop-redesign-user',
    created_by_name: 'Taller',
    updated_at: now.toISOString(),
    timeline: [
      {
        id: `maintenance-timeline-${now.getTime()}`,
        event_type: 'created',
        description: 'Mantenimiento preventivo generado automaticamente desde VEOSAT.',
        user_name: 'VEOSAT',
        created_at: now.toISOString(),
      },
    ],
  }

  saveMaintenances([maintenance, ...current])
  return maintenance
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
