import sys

filepath = r"src\pages\IncidentDetailWorkshopPage.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# The modal starts with `\n      {showCreateOtModal ? (`
modal_start = '\n      {showCreateOtModal ? ('

# Find all occurrences of modal_start
parts = content.split(modal_start)
if len(parts) > 1:
    # the original content (mostly) is in parts[0]
    # each subsequent part contains the modal code, followed by `    </div>\n  )\n}` and then the next function.
    # The modal code ends right before `    </div>\n  )\n}`
    
    # Let's just find the exact modal block that was injected and remove it everywhere.
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
    # Also I appended an InfoCard component at the very end
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
    # Strip everything out
    content = content.replace(modal_ui, "")
    # Wait, the modal might have a newline before it in my script. Let's just remove the exact string with newline
    content = content.replace("\n" + modal_ui + "\n", "")
    content = content.replace(modal_ui + "\n", "")
    content = content.replace(modal_ui, "")
    
    # Check if there are still any `showCreateOtModal ?`
    if "{showCreateOtModal ?" in content:
        print("Still found modal, doing manual strip")
        # Let's just do a regex or find/replace for the block
        
    # Re-insert the modal in the correct place: right before `function SummaryCard`
    # First, find `    </section>\n    </div>\n  )\n}\n\nfunction SummaryCard`
    
    target_marker = "    </div>\n  )\n}\n\nfunction SummaryCard"
    
    if target_marker in content:
        replacement = modal_ui + "\n" + target_marker
        content = content.replace(target_marker, replacement)
    else:
        # Fallback: find the first `function SummaryCard`
        idx = content.find("function SummaryCard")
        if idx != -1:
            # We want to insert the modal before the `    </div>\n  )\n}` that precedes `function SummaryCard`
            # Let's find the `    </div>\n  )\n}` just before idx
            prev_idx = content.rfind("    </div>\n  )\n}", 0, idx)
            if prev_idx != -1:
                content = content[:prev_idx] + modal_ui + content[prev_idx:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed IncidentDetailWorkshopPage.")
