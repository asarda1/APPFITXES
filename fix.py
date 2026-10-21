import sys

filepath = r"..\src\pages\personnel\PersonnelDetail.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

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

# Find occurrences of ui_injection
count = content.count(ui_injection)
if count > 1:
    # Replace all occurrences with a placeholder, then put back the first one as ui_injection, and the others as the original string
    parts = content.split(ui_injection)
    new_content = parts[0] + ui_injection + parts[1]
    for p in parts[2:]:
        new_content += '                                    <div className="space-y-4">' + p
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Fixed {count-1} duplicate injections.")
else:
    print("No duplicates found.")
