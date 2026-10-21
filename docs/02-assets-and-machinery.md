# 1. Objetivo del módulo
Gestionar la maquinaria del taller y su contexto operativo, documental, técnico y económico.

## 2. Usuarios del módulo
- jefe de taller
- mecánicos
- responsables de mantenimiento
- administrativos

## 3. Procesos del taller afectados
- consulta de parque de maquinaria
- seguimiento de estado operativo
- revisión documental
- consulta de horas, costes y mantenimientos
- alta y detalle de máquinas

## 4. Situación detectada en la propuesta actual de I+D
El módulo de Maquinaria está bastante desarrollado. Tiene vistas `grid`, `list` y `kanban`, búsqueda, filtros por familia, estado, mantenimiento y documentación, ordenación y alta por modal. La lista muestra código, familia, marca, modelo, año, horas, costes, mantenimiento, documentación y estado. Existe detalle por activo con bloque de “Información básica” y bloque de “Documentación”, pero el enfoque documental actual sigue siendo de consulta interna y no resuelve de forma directa la localización rápida de documentos por parte de otros departamentos.

## 5. Propuesta funcional adaptada a taller
Mantener la estructura actual por su solidez, pero reordenar el módulo alrededor de la ficha operativa de máquina. La máquina debe ser nodo central para enlazar OT, averías, preventivos, documentación, repuestos consumidos, costes y trazabilidad histórica.

La principal adaptación para taller es convertir la documentación en acceso directo usable: al entrar en la ficha de una máquina, los botones de documentos clave como `CE`, `Ficha técnica` o `Permiso circulación` deben abrir directamente su repositorio real, preferiblemente en OneDrive o en la base documental corporativa enlazada. Esto elimina la dependencia de nomenclaturas poco intuitivas de archivos y reduce tiempos de búsqueda tanto en taller como en estudios, PRL y otros departamentos.

Además, el alta maestra de máquinas no debe hacerse en esta app. La creación se realizará en Navision / Business Central y, una vez creada allí, la máquina deberá generarse automáticamente en esta aplicación. El frontend de taller debe asumir esa integración y centrarse en consulta, filtrado, seguimiento documental y operativa técnica.

## 6. Información que debe mostrarse
- código interno y familia
- empresa propietaria
- marca, modelo, matrícula o serie si aplica
- fecha de adquisición
- estado operativo actual
- ubicación o taller/obra
- horas o kilometraje
- próxima revisión o mantenimiento
- estado documental
- incidencias abiertas
- OT activas e histórico
- coste acumulado y coste reciente
- enlaces directos a documentación clave
- procedencia ERP / sincronización maestra si aplica
- tarjetas resumen por estado de flota al inicio del módulo
- catálogo documental visible y ordenado por tipo
- ficha rápida de uso
- resumen de vencimientos
- timeline cronológico de eventos de máquina
- horas o km desde el último mantenimiento

En la ficha de `Información básica` debe quedar definido el origen de cada dato para backend:
- Familia: ERP
- Empresa propietaria: ERP
- Matrícula: ERP
- Fecha de adquisición: ERP
- Ubicación: VEOSAT
- Marca: editable aquí
- Número de serie: ERP
- Coste de adquisición: ERP
- Horas acumuladas: VEOSAT
- Modelo: editable aquí
- Combustible: editable aquí
- Gastos acumulados: cálculo automático a partir de los gastos acumulados registrados
- Estado: por definir

## 7. Acciones principales del usuario
- localizar una máquina rápidamente
- ver su estado real y restricciones
- abrir su ficha
- abrir documentación oficial en un clic
- consultar historial de averías y OT
- filtrar por año de adquisición
- filtrar por cualquier dato visible en información básica
- detectar vencimientos documentales o de mantenimiento
- acceder a carpetas documentales agrupadas cuando existan múltiples ficheros por categoría
- editar en ficha los campos manuales definidos para taller como marca, modelo y combustible
- descargar de una vez toda la información consolidada de la máquina
- revisar de un vistazo próximos vencimientos y últimos hitos de la máquina

## 8. Estados o etapas del módulo
- operativa
- operativa con revisión programada
- problema detectado / acudir al taller
- averiada / parada
- en mantenimiento
- baja

## 9. Vistas o bloques recomendados
- listado principal
- tarjetas KPI superiores por estado de maquinaria
- vista kanban por estado
- vista tarjetas resumidas
- ficha de máquina
- bloque de información básica ampliado
- bloque de ficha rápida de uso
- bloque de resumen de vencimientos
- bloque de documentación
- bloque de averías
- bloque de actuaciones
- bloque de histórico técnico
- bloque de costes
- bloque de repuestos
- bloque de timeline

La ficha de máquina debe incorporar una `Ficha rápida de uso` con lectura inmediata de:
- horas acumuladas
- horas o km desde el último mantenimiento
- próximo mantenimiento
- última obra
- última OT
- última reparación

La ficha de máquina debe incorporar un `Resumen de vencimientos` con visibilidad rápida de:
- ITV
- pólizas
- revisiones próximas
- documentación pendiente o próxima a vencer

La ficha de máquina debe incorporar un `Timeline` cronológico con eventos clave de la máquina, como mínimo:
- OT
- averías
- mantenimientos
- cambios de estado
- hitos documentales

En el bloque de `Documentación` debe existir un botón `Descargar toda la documentación` para exportar de golpe el paquete documental de la máquina.

En el bloque de documentación deben contemplarse, como mínimo, estos accesos:
- CE
- Ficha técnica
- Permiso de circulación
- Pólizas
- Ficha de características
- Fichas de mantenimientos
- ITV
- Informe de tacógrafo
- Factura de compra
- Distintivo ECO

Debajo de documentación, la ficha no debe incrustar directamente el detalle de:
- averías
- actuaciones
- gastos acumulados
- repuestos
- documentación histórica
- ubicaciones / movimientos

En su lugar, debe mostrar esos elementos como menús de acceso. Al pulsar cada uno, la información debe abrirse en una nueva pestaña con su propia vista independiente.

Cada una de esas vistas secundarias debe tener sus propios filtros:
- Averías: filtro de año y buscador por teclado
- Actuaciones: filtro de año y buscador por teclado
- Gastos acumulados: filtro de año y buscador por teclado; el importe mostrado debe corresponder solo al año seleccionado
- Repuestos: filtro por tipo de repuesto, cantidad, año y buscador por teclado
- Ubicaciones / movimientos: tabla con `Ubicación` y `Número de obra`; ambos campos se obtienen de `VEOSAT`

En cada una de esas vistas secundarias debe existir además una acción de exportación:
- `Exportar PDF`
- `Exportar Excel`

En `Actuaciones` no debe hablarse de mantenimientos o reparaciones de forma genérica, sino de:
- órdenes de mantenimiento
- órdenes de reparaciones

En la vista de `Actuaciones`, el usuario debe poder acceder a la orden correspondiente pulsando sobre ella.

En `Repuestos` debe mostrarse además un recuadro informativo con este criterio:
`Las referencias y trazabilidad se hará en función de como están creados los recambios en Navision/BC.`

## 10. Relación con otros módulos
Se conecta con OT, Incidencias, Mantenimiento, Inventario, Gestión Económica y Avisos.

## 11. Criterios de consistencia visual
- mantener toggle de vistas
- mantener filtros superiores y tablas con ordenación
- mantener colores por estado ya asumidos en la app
- mantener tarjetas y kanban como vistas alternativas
- mantener el bloque documental como una rejilla de accesos simples y directos, sin complejidad visual innecesaria
- mantener bloques cortos de lectura rápida antes del detalle documental extenso
- mantener debajo de documentación un bloque de accesos a áreas técnicas y económicas, no tablas embebidas
- mantener filtros propios en cada vista secundaria según el tipo de información
- mantener en cada vista secundaria acciones visibles de `Exportar PDF` y `Exportar Excel`
- diferenciar visualmente los campos sincronizados de los campos editables en taller dentro de `Información básica`
- mantener visible la acción `Descargar toda la documentación` dentro del bloque de `Documentación`

## 12. Ideas de rediseño
- reforzar la ficha de máquina como pantalla núcleo
- separar claramente estado operativo, estado de mantenimiento y estado documental
- incorporar trazabilidad temporal por eventos
- mantener cabecera de tarjetas resumen para lectura rápida del parque
- añadir filtros avanzados por todos los campos de información básica
- añadir filtro rápido por año de adquisición
- mostrar los documentos clave como botones de acceso directo y no solo como estado administrativo
- reflejar que el alta de máquina nace en ERP y aquí se consume operativamente
- agrupar en un único bloque tanto documentos unitarios como accesos a carpetas documentales
- evitar sobrecargar la ficha principal con tablas largas de averías, actuaciones, gastos o repuestos
- añadir trazabilidad completa con un timeline único de eventos por máquina
- dar prioridad visual a vencimientos y uso reciente para lectura rápida del jefe de taller

## 13. Dudas, supuestos o decisiones pendientes
- falta validar si todas las familias de activos deben convivir en un único listado
- falta confirmar si la ubicación principal es taller, obra o ambas
- se asume que el repositorio documental podrá resolverse vía enlace OneDrive, SharePoint o base documental equivalente
- queda por definir si los enlaces documentales se mantendrán desde ERP, desde esta app o desde una base documental intermedia
- queda por definir qué campos exactos de “Información básica” vendrán sincronizados desde Business Central y cuáles se enriquecerán en taller
- queda por definir la lógica exacta del campo `Estado`: si vendrá calculado, si será editable en taller o si dependerá de reglas combinadas con mantenimiento/incidencias
- queda por definir cuáles de los documentos serán enlace a archivo único y cuáles enlazarán a carpeta
- queda pendiente definir si los campos editables de taller guardarán directamente en esta app o si se sincronizarán después hacia ERP
- queda por definir el formato de `Descargar toda la documentación`: zip, PDF consolidado o ambos
- queda por definir si las exportaciones de `Averías`, `Actuaciones`, `Gastos acumulados` y `Repuestos` respetarán los filtros activos en el momento de exportar
