import sys

def replace_between(content, start_str, end_str, new_str):
    start = content.find(start_str)
    if start == -1:
        return content
    end = content.find(end_str, start)
    if end == -1:
        return content
    return content[:start] + new_str + content[end:]

# 1. Maintenance
filepath = r"src\pages\MaintenanceDetailPage.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start = "{/* Timeline */}"
end = "        </div>\n\n\n        <div className=\"flex flex-wrap items-center gap-2\">"
new_ui = """{/* Timeline */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
            <div className="flex h-8 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px]">
                1
              </span>
              Mantenimiento
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            {existingWorkOrder ? (
              <button 
                onClick={() => navigate(`/work-orders/${existingWorkOrder.id}`)}
                className="flex h-8 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground/30 text-[11px] bg-background">
                  2
                </span>
                Orden de trabajo
              </button>
            ) : (
              <div className="flex h-8 items-center rounded-full px-4 text-sm font-medium text-muted-foreground/50">
                <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-[11px]">
                  2
                </span>
                Orden de trabajo
              </div>
            )}
          </div>
"""

new_content = replace_between(content, start, end, new_ui)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Updated Maintenance")

# 2. Incident
filepath = r"src\pages\IncidentDetailWorkshopPage.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start = "{/* Timeline */}"
end = "        </div>\n\n        <div className=\"flex flex-wrap items-center gap-2\">"
new_ui = """{/* Timeline */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
            <div className="flex h-8 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm">
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px]">
                1
              </span>
              Incidencia
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            {existingWorkOrder ? (
              <button 
                onClick={() => navigate(`/work-orders/${existingWorkOrder.id}`)}
                className="flex h-8 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground/30 text-[11px] bg-background">
                  2
                </span>
                Orden de trabajo
              </button>
            ) : (
              <div className="flex h-8 items-center rounded-full px-4 text-sm font-medium text-muted-foreground/50">
                <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-[11px]">
                  2
                </span>
                Orden de trabajo
              </div>
            )}
          </div>
"""

new_content = replace_between(content, start, end, new_ui)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Updated Incident")

# 3. Work Order
filepath = r"..\src\pages\workOrders\WorkOrderDetail.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start = "{/* Timeline */}"
end = "                </div>\n\n                <div className=\"flex gap-2\">"
new_ui = """{/* Timeline */}
                <div className="hidden lg:flex items-center justify-center">
                    <div className="flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
                        {workOrder.origin_type === 'preventive' && workOrder.origin_id ? (
                            <button 
                                onClick={() => navigate(`/maintenance/preventive/workshop/${workOrder.origin_id}`)}
                                className="flex h-8 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground/30 text-[11px] bg-background">
                                    1
                                </span>
                                Mantenimiento
                            </button>
                        ) : workOrder.origin_type === 'corrective' && workOrder.origin_id ? (
                            <button 
                                onClick={() => navigate(`/incidents/${workOrder.origin_id}`)}
                                className="flex h-8 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border border-muted-foreground/30 text-[11px] bg-background">
                                    1
                                </span>
                                Incidencia
                            </button>
                        ) : (
                            <div className="flex h-8 items-center rounded-full px-4 text-sm font-medium text-muted-foreground/50">
                                <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-[11px]">
                                    1
                                </span>
                                Origen
                            </div>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                        <div className="flex h-8 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm">
                            <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px]">
                                2
                            </span>
                            Orden de trabajo
                        </div>
                    </div>
"""

new_content = replace_between(content, start, end, new_ui)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Updated Work Order")
