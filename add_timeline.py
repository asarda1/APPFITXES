import sys
import re

# 1. MaintenanceDetailPage.tsx
filepath = r"src\pages\MaintenanceDetailPage.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if "ChevronRight" not in content:
    content = content.replace("ChevronDown,", "ChevronDown,\n  ChevronRight,")

timeline_ui = """
        {/* Timeline */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-sm font-semibold mx-auto">
          <span className="text-foreground flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">1</span>
            Mantenimiento
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {existingWorkOrder ? (
            <button 
              onClick={() => navigate(`/work-orders/${existingWorkOrder.id}`)}
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border bg-background text-[10px]">2</span>
              Orden de trabajo
            </button>
          ) : (
            <span className="text-muted-foreground opacity-50 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed text-[10px]">2</span>
              Orden de trabajo
            </span>
          )}
        </div>
"""

target = """          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Mantenimiento</div>
            <h1 className="mt-1 text-3xl font-bold text-foreground">{maintenance.code}</h1>
          </div>
        </div>"""

if "Mantenimiento\n          </span>" not in content:
    content = content.replace(target, target + "\n" + timeline_ui)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated MaintenanceDetailPage.tsx")

# 2. IncidentDetailWorkshopPage.tsx
filepath = r"src\pages\IncidentDetailWorkshopPage.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if "ChevronRight" not in content:
    content = content.replace("ChevronDown,", "ChevronDown,\n  ChevronRight,")

timeline_ui = """
        {/* Timeline */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-sm font-semibold mx-auto">
          <span className="text-foreground flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">1</span>
            Incidencia
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {existingWorkOrder ? (
            <button 
              onClick={() => navigate(`/work-orders/${existingWorkOrder.id}`)}
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border bg-background text-[10px]">2</span>
              Orden de trabajo
            </button>
          ) : (
            <span className="text-muted-foreground opacity-50 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed text-[10px]">2</span>
              Orden de trabajo
            </span>
          )}
        </div>
"""

target = """          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Incidencia
            </div>
            <h1 className="mt-1 text-3xl font-bold">{incident.code}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{incident.title}</p>
          </div>
        </div>"""

if "Incidencia\n          </span>" not in content:
    content = content.replace(target, target + "\n" + timeline_ui)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated IncidentDetailWorkshopPage.tsx")

# 3. WorkOrderDetail.tsx
filepath = r"..\src\pages\workOrders\WorkOrderDetail.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if "ChevronRight" not in content:
    content = content.replace("ChevronDown,", "ChevronDown, ChevronRight,")

timeline_ui = """
                {/* Timeline */}
                <div className="hidden lg:flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-sm font-semibold mx-auto">
                    {workOrder.origin_type === 'preventive' && workOrder.origin_id ? (
                        <button 
                            onClick={() => navigate(`/maintenance/preventive/workshop/${workOrder.origin_id}`)}
                            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                        >
                            <span className="flex h-5 w-5 items-center justify-center rounded-full border bg-background text-[10px]">1</span>
                            Mantenimiento
                        </button>
                    ) : workOrder.origin_type === 'corrective' && workOrder.origin_id ? (
                        <button 
                            onClick={() => navigate(`/incidents/${workOrder.origin_id}`)}
                            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                        >
                            <span className="flex h-5 w-5 items-center justify-center rounded-full border bg-background text-[10px]">1</span>
                            Incidencia
                        </button>
                    ) : (
                        <span className="text-muted-foreground opacity-50 flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed text-[10px]">1</span>
                            Origen
                        </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">2</span>
                        Orden de trabajo
                    </span>
                </div>
"""

target = """                <div className="flex items-start gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors mt-1"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        {/* Cdigo OT */}
                        <h1 className="text-3xl font-bold text-foreground">{workOrder.code}</h1>
                    </div>
                </div>"""

# Ensure encoding issues with Cdigo OT don't break the replace by using regex or generic parts
# Let's replace just after the `</div>\n                </div>` of the first block in the header.
header_end = """                        <h1 className="text-3xl font-bold text-foreground">{workOrder.code}</h1>
                    </div>
                </div>"""

if "Orden de trabajo\n                    </span>" not in content:
    content = content.replace(header_end, header_end + "\n" + timeline_ui)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated WorkOrderDetail.tsx")
