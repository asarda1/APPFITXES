import sys

filepath = r"..\src\pages\personnel\PersonnelDetail.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update state
old_state = """    // Filtros múltiples de OT
    const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
    const [selectedYears, setSelectedYears] = useState<number[]>([]);"""

new_state = """    // Filtros avanzados de OT
    const [machineFilter, setMachineFilter] = useState<string>('all');
    const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');
    const [yearFilter, setYearFilter] = useState<number | 'all'>('all');"""

content = content.replace(old_state, new_state)

# 2. Update filtering logic
old_logic = """    const filteredAssignedWorkOrders = useMemo(() => {
        return assignedWorkOrders.filter(order => {
            if (selectedMachines.length > 0 && !selectedMachines.includes(order.machine_code || '')) return false;
            const orderDate = new Date(order.created_at);
            if (selectedMonths.length > 0 && !selectedMonths.includes(orderDate.getMonth() + 1)) return false;
            if (selectedYears.length > 0 && !selectedYears.includes(orderDate.getFullYear())) return false;
            return true;
        });
    }, [assignedWorkOrders, selectedMachines, selectedMonths, selectedYears]);"""

new_logic = """    const filteredAssignedWorkOrders = useMemo(() => {
        return assignedWorkOrders.filter(order => {
            if (machineFilter !== 'all' && order.machine_code !== machineFilter) return false;
            const orderDate = new Date(order.created_at);
            if (monthFilter !== 'all' && (orderDate.getMonth() + 1) !== monthFilter) return false;
            if (yearFilter !== 'all' && orderDate.getFullYear() !== yearFilter) return false;
            return true;
        });
    }, [assignedWorkOrders, machineFilter, monthFilter, yearFilter]);"""

content = content.replace(old_logic, new_logic)

# 3. Update UI
start_marker = "                                        {/* Advanced Filters (Machine, Month, Year) */}"
end_marker = "                                        {/* Órdenes Abiertas */}"
end_marker_alt = "                                        {/* rdenes Abiertas */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)
if end_idx == -1:
    end_idx = content.find(end_marker_alt)

if start_idx != -1 and end_idx != -1:
    new_ui = """                                        {/* Advanced Filters (Machine, Month, Year) */}
                                        <div className="flex flex-wrap items-center gap-4 py-2">
                                            {(machineFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all') && (
                                                <button
                                                    onClick={() => {
                                                        setMachineFilter('all');
                                                        setMonthFilter('all');
                                                        setYearFilter('all');
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
                                                        {availableMachines.map(([code]) => (
                                                            <option key={code} value={code}>
                                                                {code}
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
                                                            const monthNameRaw = new Date(2000, month - 1, 1).toLocaleString('es-ES', { month: 'long' });
                                                            const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1);
                                                            return (
                                                                <option key={month} value={month}>
                                                                    {monthName}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
"""
    content = content[:start_idx] + new_ui + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated filters to dropdowns.")