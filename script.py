import sys

filepath = r"..\src\pages\personnel\PersonnelDetail.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
if "import { useState, useRef, useEffect, useMemo } from 'react';" not in content:
    content = content.replace("import { useState, useRef, useEffect } from 'react';", "import { useState, useRef, useEffect, useMemo } from 'react';")

if "FilterX," not in content:
    content = content.replace("import {\n    ArrowLeft,", "import {\n    ArrowLeft,\n    FilterX,")

# 2. Add state
state_injection = """
    const [isClosedWOOpen, setIsClosedWOOpen] = useState(false);
    const [isStatsOpen, setIsStatsOpen] = useState(true);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);

    // Filtros múltiples de OT
    const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
    const [selectedYears, setSelectedYears] = useState<number[]>([]);
"""
if "const [selectedMachines, setSelectedMachines] = useState<string[]>([]);" not in content:
    content = content.replace("    const [isClosedWOOpen, setIsClosedWOOpen] = useState(false);\n    const [isStatsOpen, setIsStatsOpen] = useState(true);\n    const [isHistoryOpen, setIsHistoryOpen] = useState(true);", state_injection)

# 3. Add filtering logic
logic_injection = """
    // Get work orders assigned to this person
    const assignedWorkOrders = MOCK_WORK_ORDERS.filter(wo =>
        wo.assigned_to?.includes(id || '') ||
        wo.labor_entries?.some(entry => entry.mechanic_id === id)
    );

    const availableMachines = useMemo(() => {
        const machines = new Map<string, string>();
        assignedWorkOrders.forEach(o => {
            if (o.machine_code) machines.set(o.machine_code, o.machine_code);
        });
        return Array.from(machines.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [assignedWorkOrders]);

    const availableMonths = useMemo(() => {
        const months = new Set(assignedWorkOrders.map(o => new Date(o.created_at).getMonth() + 1));
        return Array.from(months).sort((a, b) => a - b);
    }, [assignedWorkOrders]);

    const availableYears = useMemo(() => {
        const years = new Set(assignedWorkOrders.map(o => new Date(o.created_at).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [assignedWorkOrders]);

    const filteredAssignedWorkOrders = useMemo(() => {
        return assignedWorkOrders.filter(order => {
            if (selectedMachines.length > 0 && !selectedMachines.includes(order.machine_code || '')) return false;
            const orderDate = new Date(order.created_at);
            if (selectedMonths.length > 0 && !selectedMonths.includes(orderDate.getMonth() + 1)) return false;
            if (selectedYears.length > 0 && !selectedYears.includes(orderDate.getFullYear())) return false;
            return true;
        });
    }, [assignedWorkOrders, selectedMachines, selectedMonths, selectedYears]);
"""
if "const availableMachines = useMemo(() => {" not in content:
    content = content.replace("""    // Get work orders assigned to this person
    const assignedWorkOrders = MOCK_WORK_ORDERS.filter(wo =>
        wo.assigned_to?.includes(id || '') ||
        wo.labor_entries?.some(entry => entry.mechanic_id === id)
    );""", logic_injection)

# 4. Use `filteredAssignedWorkOrders` for sortWorkOrders
content = content.replace("const sortWorkOrders = (orders: typeof assignedWorkOrders) => {", "const sortWorkOrders = (orders: typeof filteredAssignedWorkOrders) => {")
content = content.replace("const openWorkOrders = sortWorkOrders(assignedWorkOrders.filter(wo => wo.status !== 'closed'));", "const openWorkOrders = sortWorkOrders(filteredAssignedWorkOrders.filter(wo => wo.status !== 'closed'));")
content = content.replace("const closedWorkOrders = sortWorkOrders(assignedWorkOrders.filter(wo => wo.status === 'closed'));", "const closedWorkOrders = sortWorkOrders(filteredAssignedWorkOrders.filter(wo => wo.status === 'closed'));")

# 5. Inject UI before `{/* "rdenes Abiertas */}` inside the WorkOrders section.
ui_injection = """                                    <div className="space-y-4">
                                        {/* Advanced Filters (Machine, Month, Year) */}
                                        <div className="space-y-4 rounded-xl border p-4 bg-muted/30">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-foreground">Filtros Avanzados (Múltiple)</h3>
                                                {(selectedMachines.length > 0 || selectedMonths.length > 0 || selectedYears.length > 0) && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMachines([]);
                                                            setSelectedMonths([]);
                                                            setSelectedYears([]);
                                                        }}
                                                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                                                    >
                                                        <FilterX className="h-3.5 w-3.5" />
                                                        Limpiar filtros
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {availableMachines.length > 0 && (
                                                <div>
                                                    <div className="mb-2 text-xs font-medium text-muted-foreground">Máquinas</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {availableMachines.map(([code]) => {
                                                            const isSelected = selectedMachines.includes(code);
                                                            return (
                                                                <button
                                                                    key={code}
                                                                    type="button"
                                                                    onClick={() => setSelectedMachines(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])}
                                                                    className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${isSelected ? 'border-primary bg-primary/10 text-primary font-semibold' : 'bg-background hover:bg-muted text-foreground'}`}
                                                                >
                                                                    {code}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {availableYears.length > 0 && (
                                                <div>
                                                    <div className="mb-2 text-xs font-medium text-muted-foreground">Años</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {availableYears.map(year => {
                                                            const isSelected = selectedYears.includes(year);
                                                            return (
                                                                <button
                                                                    key={year}
                                                                    type="button"
                                                                    onClick={() => setSelectedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year])}
                                                                    className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${isSelected ? 'border-primary bg-primary/10 text-primary font-semibold' : 'bg-background hover:bg-muted text-foreground'}`}
                                                                >
                                                                    {year}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {availableMonths.length > 0 && (
                                                <div>
                                                    <div className="mb-2 text-xs font-medium text-muted-foreground">Meses</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {availableMonths.map(month => {
                                                            const isSelected = selectedMonths.includes(month);
                                                            const monthNameRaw = new Date(2000, month - 1, 1).toLocaleString('es-ES', { month: 'long' });
                                                            const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);
                                                            return (
                                                                <button
                                                                    key={month}
                                                                    type="button"
                                                                    onClick={() => setSelectedMonths(prev => prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month])}
                                                                    className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${isSelected ? 'border-primary bg-primary/10 text-primary font-semibold' : 'bg-background hover:bg-muted text-foreground'}`}
                                                                >
                                                                    {monthName}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
"""
if "Filtros Avanzados (Múltiple)" not in content:
    content = content.replace('                                    <div className="space-y-4">', ui_injection)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
