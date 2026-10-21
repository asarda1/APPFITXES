import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useInventoryExcel } from '../hooks/useInventoryExcel'
import { MOCK_INVENTORY_ORDERS } from '../data/mockInventoryOrders'
import type { WorkOrderMaterial } from '../types/workOrder'
import { addHistoryEntryToWorkOrder, addMaterialToWorkOrder, MOCK_WORK_ORDERS } from '../data/mockDatabase'
import { cn, formatDecimal } from '../lib/utils'
import { usePermissions } from '../hooks/usePermissions'
import { openPurchaseOrderPrintWindow } from '../utils/purchaseOrderPdf'

export default function InventoryPage() {
  const { items, isLoading, error } = useInventoryExcel()
  const [searchTerm, setSearchTerm] = useState('')
  const location = useLocation()
  const { role } = usePermissions()

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const workOrderIdFromUrl = params.get('ot') || params.get('workOrderId')
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>('')
  const workOrderId = workOrderIdFromUrl || selectedWorkOrderId || null

  const [addToOtOpen, setAddToOtOpen] = useState(false)
  const [addToOtQuantity, setAddToOtQuantity] = useState(1)
  const [addToOtItemCode, setAddToOtItemCode] = useState<string | null>(null)
  const [addToOtMessage, setAddToOtMessage] = useState<string | null>(null)

  const [createOrderOpen, setCreateOrderOpen] = useState(false)
  const [createOrderSupplier, setCreateOrderSupplier] = useState('')
  const [createOrderExpectedAt, setCreateOrderExpectedAt] = useState('')
  const [createOrderNotes, setCreateOrderNotes] = useState('')
  const [createOrderMaterialSearch, setCreateOrderMaterialSearch] = useState('')
  const [createOrderLines, setCreateOrderLines] = useState<Array<{ code: string; quantity: number }>>([])

  const stats = useMemo(() => {
    const totalParts = items.length
    const lowStock = items.filter((item) => item.stock_quantity > 0 && item.stock_quantity <= 5).length
    return { totalParts, lowStock }
  }, [items])

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) => {
      const haystack = `${item.code} ${item.name} ${item.alias ?? ''} ${item.description ?? ''} ${item.category}`.toLowerCase()
      return haystack.includes(term)
    })
  }, [items, searchTerm])

  const pendingOrders = useMemo(() => {
    return MOCK_INVENTORY_ORDERS.filter(
      (order) => order.status === 'draft' || order.status === 'sent' || order.status === 'partial',
    )
  }, [])

  const availableWorkOrders = useMemo(() => {
    try {
      const stored = localStorage.getItem('workOrders')
      if (stored) {
        const parsed = JSON.parse(stored) as Array<{ id?: string; code?: string; title?: string }>
        return parsed
          .filter((item) => typeof item?.id === 'string' && item.id.length > 0)
          .map((item) => ({ id: item.id as string, label: `${item.code ?? item.id} · ${item.title ?? ''}`.trim() }))
      }
    } catch {
      // ignore
    }

    return MOCK_WORK_ORDERS.map((item) => ({ id: item.id, label: `${item.code} · ${item.title}` }))
  }, [])

  const listRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const rowHeight = 44
  const viewportHeight = 520
  const overscan = 12

  useEffect(() => {
    setScrollTop(0)
    if (listRef.current) listRef.current.scrollTop = 0
  }, [searchTerm])

  const virtual = useMemo(() => {
    const total = filteredItems.length
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
    const endIndex = Math.min(total - 1, Math.floor((scrollTop + viewportHeight) / rowHeight) + overscan)
    const slice = total === 0 ? [] : filteredItems.slice(startIndex, endIndex + 1)
    return { total, startIndex, slice, totalHeight: total * rowHeight }
  }, [filteredItems, scrollTop])

  const gridTemplateColumns = useMemo(() => {
    return workOrderId
      ? '180px 1.5fr 1fr 140px 120px 120px 120px'
      : '180px 1.5fr 1fr 140px 120px 120px'
  }, [workOrderId])

  const handleOpenAddToOt = (code: string) => {
    if (!workOrderId) return
    setAddToOtItemCode(code)
    setAddToOtQuantity(1)
    setAddToOtMessage(null)
    setAddToOtOpen(true)
  }

  const handleConfirmAddToOt = () => {
    if (!workOrderId || !addToOtItemCode) return
    const item = items.find((it) => it.code === addToOtItemCode)
    if (!item) return

    const userName = role === 'admin' ? 'Admin Usuario' : role === 'mechanic' ? 'Mecánico Usuario' : 'Usuario'
    const now = new Date().toISOString()
    const quantity = Math.max(1, Number(addToOtQuantity) || 1)

    const material: WorkOrderMaterial = {
      id: `mat-${Date.now()}-${Math.random()}`,
      material_id: item.id,
      material_code: item.code,
      material_name: item.name,
      quantity,
      unit_cost: item.unit_cost,
      total_cost: item.unit_cost * quantity,
      stock_available: item.stock_quantity > 0,
      requested_at: now,
      requested_by: userName,
    }

    const ok = addMaterialToWorkOrder(workOrderId, material)
    if (ok) {
      addHistoryEntryToWorkOrder(workOrderId, {
        id: `hist-${Date.now()}-${Math.random()}`,
        timestamp: now,
        action: 'Material añadido',
        user_id: 'current-user',
        user_name: userName,
        field_changed: 'Materiales',
        new_value: `${item.code} - ${item.name} (Cantidad: ${quantity})`,
        notes: `Coste unitario: ${formatDecimal(item.unit_cost)}€, Coste total: ${formatDecimal(material.total_cost)}€`,
      })
      setAddToOtMessage(`Añadido a la OT ${workOrderId}: ${item.code} x${quantity}`)
      setAddToOtOpen(false)
    } else {
      setAddToOtMessage('No se pudo añadir a la OT (OT no encontrada).')
    }
  }

  const materialSearchMatches = useMemo(() => {
    const term = createOrderMaterialSearch.trim().toLowerCase()
    if (!term) return []
    return items
      .filter((item) => {
        const haystack = `${item.code} ${item.name} ${item.alias ?? ''}`.toLowerCase()
        return haystack.includes(term)
      })
      .slice(0, 20)
  }, [createOrderMaterialSearch, items])

  const createOrderLineDetails = useMemo(() => {
    const map = new Map(items.map((item) => [item.code, item]))
    return createOrderLines
      .map((line) => {
        const item = map.get(line.code)
        return {
          code: line.code,
          name: item?.name ?? line.code,
          alias: item?.alias,
          unitCost: item?.unit_cost ?? 0,
          quantity: Math.max(1, Number(line.quantity) || 1),
        }
      })
  }, [createOrderLines, items])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Repuestos y Almacén</h1>
        <p className="text-muted-foreground">Control de inventario y stock</p>
      </div>

      {isLoading && (
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          Cargando inventario desde <span className="font-medium">INVENTARIO.xlsx</span>...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Error cargando el inventario: <span className="font-mono">{error.message}</span>
          <div className="mt-1 text-xs text-red-700/80">
            Comprueba que exista <span className="font-mono">public/INVENTARIO.xlsx</span> y que el navegador pueda abrir{' '}
            <span className="font-mono">/INVENTARIO.xlsx</span>.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Total Repuestos</h3>
          <p className="text-3xl font-bold text-primary">{stats.totalParts}</p>
        </div>
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Stock Bajo</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.lowStock}</p>
        </div>
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Pedidos Pendientes</h3>
          <p className="text-3xl font-bold text-blue-600">{pendingOrders.length}</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold">Inventario</h2>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end md:gap-3 w-full">
            {!workOrderIdFromUrl && (
              <div className="w-full md:max-w-sm">
                <select
                  value={selectedWorkOrderId}
                  onChange={(e) => setSelectedWorkOrderId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Acción rápida: seleccionar OT…</option>
                  {availableWorkOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, descripción, categoría..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            </div>
          </div>
        </div>

        {!isLoading && !error && filteredItems.length === 0 ? (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            No hay resultados para los filtros actuales.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <div className="grid gap-2 bg-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground" style={{ gridTemplateColumns }}>
              <div>Código</div>
              <div>Descripción</div>
              <div>Descripción Alias</div>
              <div>Categoría</div>
              <div className="text-right">Stock</div>
              <div className="text-right">Coste</div>
              {workOrderId && <div className="text-right">Acción</div>}
            </div>

            <div
              ref={listRef}
              className="relative overflow-y-auto"
              style={{ height: viewportHeight }}
              onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
            >
              <div style={{ height: virtual.totalHeight }} />
              {virtual.slice.map((item, index) => {
                const absoluteIndex = virtual.startIndex + index
                return (
                  <div
                    key={item.id}
                    className="absolute left-0 right-0 border-t bg-card hover:bg-muted/30"
                    style={{ top: absoluteIndex * rowHeight, height: rowHeight }}
                  >
                    <div className="grid h-full items-center gap-2 px-4 text-sm" style={{ gridTemplateColumns }}>
                      <div className="font-medium text-foreground truncate leading-none">{item.code}</div>
                      <div className="text-muted-foreground truncate leading-none">{item.name}</div>
                      <div className="text-muted-foreground truncate leading-none">{item.alias ?? '-'}</div>
                      <div className="text-muted-foreground truncate leading-none">{item.category}</div>
                      <div className="text-right">
                        <span
                          className={
                            item.stock_quantity === 0
                              ? 'text-red-600 font-semibold'
                              : item.stock_quantity <= 5
                                ? 'text-yellow-700 font-semibold'
                                : 'text-green-700 font-semibold'
                          }
                        >
                          {item.stock_quantity}
                        </span>
                      </div>
                      <div className="text-right text-muted-foreground">
                        {item.unit_cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </div>
                      {workOrderId && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenAddToOt(item.code)}
                            className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
                          >
                            Añadir a OT
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div>Mostrando {filteredItems.length} referencias</div>
          {addToOtMessage && <div className="text-primary">{addToOtMessage}</div>}
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-xl font-semibold">Pedidos Pendientes</h2>
          <button
            type="button"
            onClick={() => {
              setCreateOrderOpen(true)
              setCreateOrderSupplier('')
              setCreateOrderExpectedAt('')
              setCreateOrderNotes('')
              setCreateOrderMaterialSearch('')
              setCreateOrderLines([])
            }}
            className="inline-flex items-center justify-center rounded-lg border border-primary bg-transparent px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            Realizar pedido
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Base temporal (mock) hasta integrar con ERP. Un pedido cuenta como pendiente si su estado es{' '}
          <span className="font-medium">borrador</span>, <span className="font-medium">enviado</span> o{' '}
          <span className="font-medium">recepción parcial</span>.
        </p>

        {pendingOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No hay pedidos pendientes.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-[140px_1fr_160px_160px] gap-2 bg-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <div>Pedido</div>
              <div>Proveedor</div>
              <div>Estado</div>
              <div>Entrega</div>
            </div>
            <div className="divide-y">
              {pendingOrders.map((order) => (
                <div key={order.id} className="grid grid-cols-[140px_1fr_160px_160px] gap-2 px-4 py-3 text-sm">
                  <div className="font-medium text-foreground">{order.code}</div>
                  <div className="text-muted-foreground">{order.supplier}</div>
                  <div className="text-muted-foreground">
                    {order.status === 'draft' ? 'Borrador' : order.status === 'sent' ? 'Enviado' : 'Recepción parcial'}
                  </div>
                  <div className="text-muted-foreground">
                    {order.expected_at ? new Date(order.expected_at).toLocaleDateString('es-ES') : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {addToOtOpen && workOrderId && addToOtItemCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
          <div className="bg-card border rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b">
              <div className="text-lg font-semibold">Añadir a OT</div>
              <div className="text-sm text-muted-foreground mt-1">
                OT: <span className="font-mono">{workOrderId}</span> · Material: <span className="font-mono">{addToOtItemCode}</span>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-sm font-medium">Cantidad</label>
              <input
                type="number"
                min={1}
                value={addToOtQuantity}
                onChange={(e) => setAddToOtQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="p-5 border-t flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddToOtOpen(false)}
                className="px-4 py-2 text-sm font-medium border border-muted-foreground text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAddToOt}
                className="px-4 py-2 text-sm font-medium border border-primary text-primary bg-transparent rounded-lg hover:bg-primary/10 transition-colors"
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}

      {createOrderOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4">
          <div className="bg-card border rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="p-5 border-b flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Realizar pedido</div>
                <div className="text-sm text-muted-foreground mt-1">Genera un PDF corporativo para enviar al proveedor.</div>
              </div>
              <button
                type="button"
                onClick={() => setCreateOrderOpen(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proveedor</label>
                  <input
                    value={createOrderSupplier}
                    onChange={(e) => setCreateOrderSupplier(e.target.value)}
                    placeholder="Nombre del proveedor"
                    className="mt-2 w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entrega estimada</label>
                  <input
                    type="date"
                    value={createOrderExpectedAt}
                    onChange={(e) => setCreateOrderExpectedAt(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notas</label>
                <textarea
                  value={createOrderNotes}
                  onChange={(e) => setCreateOrderNotes(e.target.value)}
                  rows={3}
                  placeholder="Condiciones, dirección de entrega, persona de contacto…"
                  className="mt-2 w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-sm font-semibold mb-2">Añadir materiales</div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={createOrderMaterialSearch}
                    onChange={(e) => setCreateOrderMaterialSearch(e.target.value)}
                    placeholder="Buscar por código, descripción o alias…"
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {materialSearchMatches.length > 0 && (
                  <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border bg-card">
                    {materialSearchMatches.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setCreateOrderLines((current) => {
                            const existing = current.find((line) => line.code === item.code)
                            if (existing) {
                              return current.map((line) =>
                                line.code === item.code ? { ...line, quantity: line.quantity + 1 } : line,
                              )
                            }
                            return [...current, { code: item.code, quantity: 1 }]
                          })
                          setCreateOrderMaterialSearch('')
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                      >
                        <div className="font-medium text-foreground">{item.code}</div>
                        <div className="text-xs text-muted-foreground">{item.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border">
                <div className="grid grid-cols-[160px_1fr_120px_120px_48px] gap-2 bg-muted/60 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <div>Código</div>
                  <div>Material</div>
                  <div className="text-right">Cantidad</div>
                  <div className="text-right">Coste</div>
                  <div />
                </div>
                <div className="divide-y">
                  {createOrderLineDetails.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-muted-foreground">Añade al menos una línea para generar el pedido.</div>
                  ) : (
                    createOrderLineDetails.map((line) => (
                      <div key={line.code} className="grid grid-cols-[160px_1fr_120px_120px_48px] items-center gap-2 px-4 py-2 text-sm">
                        <div className="font-medium text-foreground">{line.code}</div>
                        <div className="min-w-0">
                          <div className="truncate text-muted-foreground">{line.name}</div>
                          {line.alias && <div className="truncate text-xs text-muted-foreground">Alias: {line.alias}</div>}
                        </div>
                        <div className="text-right">
                          <input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) => {
                              const quantity = Math.max(1, Number(e.target.value) || 1)
                              setCreateOrderLines((current) =>
                                current.map((l) => (l.code === line.code ? { ...l, quantity } : l)),
                              )
                            }}
                            className="w-24 px-2 py-1 border rounded text-right text-sm"
                          />
                        </div>
                        <div className="text-right text-muted-foreground">
                          {line.unitCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => setCreateOrderLines((current) => current.filter((l) => l.code !== line.code))}
                            className="rounded-lg border px-2 py-1 text-xs hover:bg-muted"
                            title="Quitar línea"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 border-t flex items-center justify-end gap-2">
              {(createOrderSupplier.trim() === '' || createOrderLineDetails.length === 0) && (
                <div className="mr-auto text-xs text-muted-foreground">
                  Completa <span className="font-semibold">Proveedor</span> y añade al menos{' '}
                  <span className="font-semibold">1 material</span> para habilitar el PDF.
                </div>
              )}
              <button
                type="button"
                onClick={() => setCreateOrderOpen(false)}
                className="px-4 py-2 text-sm font-medium border border-muted-foreground text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={createOrderSupplier.trim() === '' || createOrderLineDetails.length === 0}
                onClick={() => {
                  const userName = role === 'admin' ? 'Admin Usuario' : role === 'mechanic' ? 'Mecánico Usuario' : 'Usuario'
                  const now = new Date().toISOString()
                  const code = `PED-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(Math.floor(Math.random() * 900) + 100)}`

                  try {
                    openPurchaseOrderPrintWindow({
                      code,
                      supplier: createOrderSupplier.trim(),
                      requestedBy: userName,
                      createdAtIso: now,
                      expectedAtIso: createOrderExpectedAt ? new Date(createOrderExpectedAt).toISOString() : undefined,
                      notes: createOrderNotes.trim() || undefined,
                      lines: createOrderLineDetails,
                    })
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'No se pudo generar el PDF')
                  }
                }}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-lg transition-colors',
                  createOrderSupplier.trim() === '' || createOrderLineDetails.length === 0
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'border border-primary text-primary hover:bg-primary/10',
                )}
              >
                Generar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
