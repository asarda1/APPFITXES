import sys

filepath = r"src\pages\IncidentDetailWorkshopPage.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
imports = """import { getBreakdownById, getPersonnelById } from '../../../src/data/mockDatabase'
import type { BreakdownReport } from '../../../src/types/correctiveMaintenance'
import { createIncidentWorkOrder, getIncidentWorkOrder, type WorkshopOrderCenter } from '../data/workshopWorkOrders'"""

content = content.replace("import { getBreakdownById, getPersonnelById } from '../../../src/data/mockDatabase'\nimport type { BreakdownReport } from '../../../src/types/correctiveMaintenance'", imports)

# 2. Add States and Logic
state_marker = """  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    report: true,
    media: true,
    timeline: true,
  })"""

new_state = """  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    report: true,
    media: true,
    timeline: true,
  })

  const [showCreateOtModal, setShowCreateOtModal] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState<WorkshopOrderCenter>('Taller Frares')

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
    const workOrder = createIncidentWorkOrder(incident, selectedCenter)
    setShowCreateOtModal(false)
    navigate(`/work-orders/${workOrder.id}`)
  }"""

content = content.replace(state_marker, new_state)

# 3. Update Button
old_button = """          <button
            type="button"
            onClick={() => navigate('/work-orders/new', { 
              state: { 
                incidentId: incident.id, 
                machineId: incident.machine_id, 
                title: incident.title, 
                description: incident.description 
              } 
            })}
            className="rounded-full border border-primary/30 bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Abrir OT
          </button>"""

new_button = """          <button
            type="button"
            onClick={handleOpenWorkOrder}
            className="rounded-full border border-primary/30 bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {existingWorkOrder ? 'Ver OT vinculada' : 'Abrir OT'}
          </button>"""

content = content.replace(old_button, new_button)

# 4. Add modal UI at the end of the file, before the helper functions (like `function SummaryCard` etc.)
# Find the end of the `return (...)` block in `IncidentDetailWorkshopPage`
# It's `<div className="h-full min-h-0 space-y-6 overflow-y-auto pr-2"> ... </div>` -> `    </div>\n  )\n}\n`

end_return_marker = """    </div>
  )
}"""

modal_ui = """
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
"""

content = content.replace(end_return_marker, modal_ui + "\n" + end_return_marker)

# Add InfoCard component at the end of the file
info_card_component = """
function InfoCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-base font-semibold text-foreground">{value}</div>
      <div className="mt-2 text-xs font-semibold text-red-600">{helper}</div>
    </div>
  )
}
"""

content = content + "\n" + info_card_component

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Applied IncidentDetailWorkshopPage modifications.")