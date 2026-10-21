# 1. Objetivo del módulo
Gestionar recambios, stock, pedidos y movimientos de almacén para asegurar la continuidad del trabajo del taller.

## 2. Usuarios del módulo
- almacén
- jefe de taller
- administrativos
- mecánicos

## 3. Procesos del taller afectados
- consulta de stock
- control de mínimos
- salidas y entradas
- compras a proveedor
- reserva o consumo de repuestos para OT

## 4. Situación detectada en la propuesta actual de I+D
Existe un módulo general de Repuestos y Almacén con KPIs, alertas de stock, accesos rápidos y enlaces a subrutas de inventario y pedidos. El router actual incluye `/inventory`, `/inventory/parts` y `/inventory/orders`. En la pantalla principal ya aparecen referencias, valor total, stock bajo, sin stock y pedidos pendientes, además de accesos a movimientos e inventario físico aunque esas rutas no están confirmadas en el router.

## 5. Propuesta funcional adaptada a taller
Mantener una portada del módulo con KPIs y alertas, pero organizar el trabajo alrededor de disponibilidad real para OT y mantenimientos. El módulo debe responder rápido si un recambio existe, dónde está, cuánto queda, qué OT lo necesita y si hay que pedirlo.

## 6. Información que debe mostrarse
- referencia y descripción
- marca y proveedor
- stock actual
- stock mínimo
- ubicación física
- valor y coste unitario
- movimientos recientes
- pedidos pendientes
- reservas o consumos vinculados a OT

## 7. Acciones principales del usuario
- localizar una referencia
- ver si hay stock suficiente
- registrar entrada o salida
- crear pedido a proveedor
- revisar alertas de mínimos y agotados

## 8. Estados o etapas del módulo
- stock correcto
- stock bajo
- sin stock
- pedido pendiente
- pedido recibido parcial o total

## 9. Vistas o bloques recomendados
- vista general del módulo
- listado de repuestos
- entradas y salidas
- pedidos a proveedor
- stock mínimo
- movimientos
- inventario físico

## 10. Relación con otros módulos
Se conecta con OT, Incidencias, Mantenimiento, Avisos y Gestión Económica.

## 11. Criterios de consistencia visual
- mantener tarjetas KPI y alertas superiores
- mantener tarjetas de acceso rápido a submódulos
- mantener listados y badges de stock por color
- mantener navegación por páginas y no por overlays complejos

## 12. Ideas de rediseño
- priorizar visibilidad de bloqueos de trabajo por falta de material
- distinguir stock general, stock reservado y stock disponible
- enlazar cada consumo a OT o mantenimiento

## 13. Dudas, supuestos o decisiones pendientes
- algunas rutas sugeridas por la UI no están implementadas en el router actual
- falta revisar el listado de repuestos y pedidos en detalle
- falta validar si el módulo debe cubrir compras completas o solo reposición operativa
