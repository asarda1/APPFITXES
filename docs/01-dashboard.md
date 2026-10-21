# 1. Objetivo del módulo
Dar una visión rápida del estado operativo del taller y de sus áreas clave para facilitar priorización y seguimiento diario.

## 2. Usuarios del módulo
- jefe de taller
- responsables de mantenimiento
- administrativos
- dirección operativa

## 3. Procesos del taller afectados
- apertura diaria de actividad
- seguimiento de carga de trabajo
- control de maquinaria, OT, personal e incidencias
- detección de cuellos de botella

## 4. Situación detectada en la propuesta actual de I+D
El dashboard actual es una pantalla agregada con filtro temporal y bloques por Maquinaria, Órdenes de Trabajo, Personal y Averías e Incidencias. Cada bloque usa tarjetas KPI con colores fuertes y conteos agregados obtenidos de datos mock. No se detectan accesos profundos ni una priorización explícita de tareas críticas del día.

## 5. Propuesta funcional adaptada a taller
Mantener el formato de dashboard resumido, pero orientarlo a operativa diaria real: tareas pendientes, máquinas paradas, OT abiertas prioritarias, incidencias sin asignar, mantenimientos vencidos y carencias de stock que bloquean trabajo. El dashboard debe servir más como centro de decisión que como cuadro estadístico general.

## 6. Información que debe mostrarse
- máquinas fuera de servicio
- OT abiertas y OT bloqueadas
- incidencias críticas sin atender
- preventivos vencidos o de hoy
- disponibilidad real de personal
- repuestos sin stock que afectan OT o averías
- costes o desviaciones relevantes del periodo

## 7. Acciones principales del usuario
- entrar al módulo problemático en un clic
- filtrar por periodo útil
- detectar urgencias del día
- revisar carga de personal y de maquinaria

## 8. Estados o etapas del módulo
- normal
- con alertas
- con incidencias críticas
- con bloqueos operativos

## 9. Vistas o bloques recomendados
- cabecera con periodo y resumen operativo
- bloque de alertas críticas del día
- bloque de maquinaria
- bloque de OT
- bloque de incidencias
- bloque de mantenimiento
- bloque de personal
- bloque de stock crítico

## 10. Relación con otros módulos
Se relaciona directamente con Maquinaria, OT, Incidencias, Mantenimiento, Inventario, Personal y Gestión Económica.

## 11. Criterios de consistencia visual
- mantener tarjetas KPI por bloque
- mantener cabecera simple con filtro de fechas
- mantener colores de estado ya usados en I+D
- mantener secciones apiladas con títulos visibles y lectura rápida

## 12. Ideas de rediseño
- sustituir parte del dato agregado por listas cortas accionables
- introducir accesos directos a elementos atascados
- separar indicadores estratégicos de indicadores operativos diarios

## 13. Dudas, supuestos o decisiones pendientes
- falta definir si el dashboard debe ser común o distinto por rol
- falta validar qué KPIs son realmente consultados a diario
- falta confirmar si el dashboard debe incluir avisos y costes de forma nativa
