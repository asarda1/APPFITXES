# 1. Objetivo del módulo
Gestionar las órdenes de trabajo como unidad principal de ejecución, seguimiento y cierre del trabajo real del taller.

## 2. Usuarios del módulo
- jefe de taller
- mecánicos
- administrativos
- responsables de mantenimiento

## 3. Procesos del taller afectados
- apertura de trabajos
- asignación de personal
- seguimiento de ejecución
- cierre y trazabilidad
- imputación de mano de obra y materiales

## 4. Situación detectada en la propuesta actual de I+D
Es uno de los módulos más desarrollados. Tiene listado principal, dashboard, alta nueva, kanban y detalle. El listado incluye búsqueda, filtros, periodos, ordenación, vistas `grid/list/kanban` y creación por modal. La tabla muestra estado, código, descripción, máquina, trabajadores, fechas, taller y categoría. El dashboard del módulo añade KPIs y gráficos de estado, prioridad, categoría, costes y tendencia.

## 5. Base visual ya importada a taller
La propuesta de taller ya parte de la importacion directa de la base visual de I+D para `OT`, incluyendo:
- listado principal
- dashboard
- nueva OT
- kanban
- detalle de OT

La siguiente fase ya no es importar mas pantallas, sino readaptar esta base a la operativa real del taller.

## 6. Propuesta funcional adaptada a taller
El módulo de `OT` no debe plantearse como un módulo aislado que siempre se crea desde cero. Debe actuar como módulo receptor del trabajo que ya nace en los módulos operativos que hemos definido:

- `Mantenimiento` genera `Ordenes de mantenimiento`
- `Incidencias` genera `Ordenes de reparacion`

La acción principal de entrada a OT debe ser el botón `Abrir OT` desde:
- la ficha de un mantenimiento
- la ficha de una incidencia

## 7. Tipos principales de OT
La propuesta de taller debe simplificarse alrededor de dos tipos principales:

- `Orden de mantenimiento`
  nace desde un mantenimiento preventivo
- `Orden de reparacion`
  nace desde una incidencia o averia

Esta diferenciacion debe verse claramente en:
- listado
- tarjetas resumen
- filtros
- detalle de la OT

## 8. Lógica de apertura
La OT debe heredar automáticamente el contexto del módulo de origen. No debe pedir de nuevo información que ya existe.

Al abrir una OT desde `Mantenimiento`, la OT debe heredar:
- maquina
- obra
- tipo de mantenimiento
- fecha programada
- origen: mantenimiento

Al abrir una OT desde `Incidencias`, la OT debe heredar:
- maquina
- obra
- tipo de incidencia
- prioridad
- descripcion del aviso
- origen: incidencia

## 9. Información que debe mostrarse
- codigo OT
- tipo de OT (`mantenimiento` o `reparacion`)
- maquina afectada
- obra
- origen del trabajo
- descripcion operativa corta
- prioridad
- estado actual
- motivo de bloqueo si existe
- personal asignado
- fechas clave
- materiales y repuestos asociados
- horas imputadas
- coste estimado y real
- referencia al mantenimiento o incidencia de origen

## 10. Acciones principales del usuario
- abrir OT desde mantenimiento
- abrir OT desde incidencia
- asignar responsables y mecánicos
- cambiar estado con trazabilidad
- registrar mano de obra y materiales
- cerrar OT
- consultar historico por maquina o periodo

## 11. Estados o etapas del modulo
- pendiente de abrir
- abierta
- en diagnostico
- pendiente de material
- en curso
- pendiente de cierre
- cerrada
- cancelada si aplica

## 12. Vistas o bloques recomendados
- `OT abiertas`
- `Historico de OT`
- listado principal
- dashboard operativo
- kanban por estado
- detalle completo

La alta manual de OT no debe ser la entrada principal del modulo. La entrada principal debe ser la OT abierta desde `Mantenimiento` o `Incidencias`.

## 13. Tarjetas superiores recomendadas
Dentro de `OT abiertas`, la lectura operativa recomendada es:
- `Pendientes de abrir`
- `Abiertas`
- `En curso`
- `Pendientes de material`
- `Pendientes de cierre`

Y como filtros horizontales:
- `Todas`
- `Ordenes de mantenimiento`
- `Ordenes de reparacion`

## 14. Relacion con otros modulos
Se relaciona directamente con:
- `Mantenimiento`
- `Incidencias`
- `Maquinaria`
- `Inventario`
- `Personal`
- `Gestión económica`
- `Avisos`

## 15. Criterios de consistencia visual
- mantener vistas `grid/list/kanban` de la base I+D mientras se readapta
- mantener tabla principal con ordenacion y filtros
- mantener dashboard separado del listado
- mantener badges de estado y tipo de OT
- hacer visible el origen de la OT desde mantenimiento o incidencia

## 16. Ideas de rediseño
- convertir la OT en modulo receptor de trabajo desde `Mantenimiento` e `Incidencias`
- diferenciar visualmente `Orden de mantenimiento` y `Orden de reparacion`
- hacer mas explicito el bloqueo por falta de material o validacion
- reducir la alta manual a casos excepcionales
- reforzar la trazabilidad de costes, materiales y mano de obra

## 17. Dudas, supuestos o decisiones pendientes
- falta revisar el detalle de OT en profundidad
- falta definir si una incidencia puede abrir mas de una OT o solo una
- falta decidir si una OT de mantenimiento puede generar subtareas internas
- falta validar el catalogo real de estados del taller
