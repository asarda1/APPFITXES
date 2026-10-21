# 1. Objetivo del módulo
Centralizar avisos y alertas generados por el sistema para priorizar acciones pendientes y excepciones operativas.

## 2. Usuarios del módulo
- jefe de taller
- almacén
- responsables de mantenimiento
- administrativos

## 3. Procesos del taller afectados
- priorización de urgencias
- seguimiento de eventos críticos
- control de excepciones por módulo
- acceso rápido al origen del problema

## 4. Situación detectada en la propuesta actual de I+D
Existe un módulo de Avisos con portada y listado. La portada muestra KPIs de total, pendientes, críticos, urgentes y resueltos, un bloque de avisos prioritarios y accesos rápidos a filtros predefinidos. Los avisos se etiquetan por prioridad y por módulo fuente, como recambios, órdenes de trabajo, mantenimiento, averías, facturación o maquinaria.

## 5. Propuesta funcional adaptada a taller
Mantenerlo como centro de alertas transversal, no como buzón decorativo. Debe servir para detectar qué requiere acción inmediata y dirigir al usuario al punto exacto del trabajo. Conviene diferenciar entre aviso informativo, aviso operativo y bloqueo crítico.

La creación de un nuevo reporte en `Incidencias` debe generar automáticamente una notificación interna en cabecera y en este módulo de avisos, con acceso directo a la incidencia creada.

## 6. Información que debe mostrarse
- título del aviso
- prioridad
- módulo origen
- estado del aviso
- mensaje accionable
- fecha de generación
- elemento afectado
- enlace al registro origen

## 7. Acciones principales del usuario
- revisar pendientes
- filtrar por prioridad, estado o módulo
- abrir el contexto afectado
- marcar o resolver avisos si aplica

## 8. Estados o etapas del módulo
- pendiente
- en revisión
- resuelto
- descartado si aplica

## 9. Vistas o bloques recomendados
- portada con KPIs
- lista de avisos prioritarios
- listado completo filtrable
- accesos rápidos por tipo de aviso

## 10. Relación con otros módulos
Recibe eventos de Inventario, OT, Mantenimiento, Incidencias, Maquinaria y potencialmente Gestión Económica.

## 11. Criterios de consistencia visual
- mantener tarjetas KPI y listado de avisos
- mantener badges por prioridad y módulo
- mantener accesos rápidos tipo tarjeta
- mantener color rojo y naranja para niveles altos de urgencia

## 12. Ideas de rediseño
- separar alertas críticas que bloquean operación de avisos informativos
- permitir agrupación por módulo o elemento afectado
- hacer visible la trazabilidad de resolución

## 13. Dudas, supuestos o decisiones pendientes
- falta revisar el listado completo de avisos
- falta definir si el usuario puede actuar sobre el aviso o solo consumirlo
- falta confirmar reglas de generación automática por módulo
