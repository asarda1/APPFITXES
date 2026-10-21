# 1. Objetivo del módulo
Controlar costes, presupuestos y análisis económico asociados a la actividad del taller.

## 2. Usuarios del módulo
- administrativos
- dirección
- jefe de taller
- responsables financieros u operativos

## 3. Procesos del taller afectados
- seguimiento de costes
- análisis de mano de obra y materiales
- control por máquina o por obra
- presupuestos
- trabajos externos e inventario valorado

## 4. Situación detectada en la propuesta actual de I+D
El módulo tiene una estructura propia más madura que otros: layout con tabs y subrutas para resumen, mano de obra, materiales, máquinas, obras, presupuestos, externos, inventario y análisis. La portada del layout ya define el módulo como control de costes, presupuestos y rentabilidad. El acceso está protegido por permisos.

## 5. Propuesta funcional adaptada a taller
Mantener la arquitectura por pestañas porque encaja con el tamaño del dominio, pero enfocar la información a lectura operativa: coste por OT, coste por máquina, desviaciones, consumos relevantes y comparación entre trabajo interno y externo. Debe conectar mejor con la realidad diaria del taller y no quedarse solo en vistas analíticas.

## 6. Información que debe mostrarse
- coste de mano de obra
- coste de materiales
- coste por máquina
- coste por obra
- presupuestos y desviaciones
- trabajos externos
- impacto del inventario
- tendencias y análisis comparativos

## 7. Acciones principales del usuario
- navegar por área económica
- comparar costes
- detectar desviaciones
- revisar detalle por máquina u obra
- consultar análisis agregado

## 8. Estados o etapas del módulo
- presupuesto abierto
- presupuesto aprobado
- en ejecución
- cerrado
- desviado sobre coste

## 9. Vistas o bloques recomendados
- dashboard
- mano de obra
- materiales
- costes por máquina
- costes por obra
- presupuestos
- trabajos externos
- inventario económico
- análisis

## 10. Relación con otros módulos
Se conecta con OT, Maquinaria, Inventario, Personal y Mantenimiento.

## 11. Criterios de consistencia visual
- mantener header del módulo y navegación por tabs
- mantener tablas y tarjetas KPI coherentes con el resto de la app
- mantener gráficos solo donde ayuden a explicar variaciones o tendencias

## 12. Ideas de rediseño
- llevar al primer plano el coste por intervención y por máquina
- cruzar desviaciones con averías recurrentes y consumo de repuestos
- reducir lenguaje excesivamente financiero en favor de lectura operativa

## 13. Dudas, supuestos o decisiones pendientes
- falta revisar las pantallas internas para documentarlas una a una
- falta validar si el eje principal del análisis es máquina, OT, obra o centro de coste
- falta confirmar alcance real de presupuestos y externos
