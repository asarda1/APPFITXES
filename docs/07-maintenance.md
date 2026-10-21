# 1. Objetivo del módulo
Planificar y seguir los mantenimientos preventivos de la maquinaria para reducir paradas y asegurar cumplimiento operativo.

- responsables de mantenimiento
- jefe de taller
- mecánicos
- administrativos de soporte

- planificación de preventivos
- seguimiento de mantenimientos programados
- control de cumplimiento
- reduccion de paradas por falta de preventivo
- análisis de vencimientos y carga de trabajo preventiva

## 4. Situación detectada en la propuesta actual de I+D
La propuesta de I+D mezcla en el mismo módulo dos naturalezas distintas:
- mantenimiento preventivo
- mantenimiento correctivo o reparaciones

Incluye dashboard unificado, preventivo, correctivo y alta rapida de averia. El enfoque es analitico y mezcla mantenimientos con averias.

## 5. Propuesta funcional adaptada a taller
En la propuesta de taller esta mezcla debe romperse.

Todo lo relativo a:
- reporte de averias
- incidencias correctivas
- clasificacion de averias
- generacion de OT de reparacion

debe vivir en `Incidencias`.

Por tanto, desde ahora este modulo debe centrarse unicamente en:
- mantenimientos preventivos
- planificacion preventiva
- cumplimiento preventivo
- historico preventivo
- proximos vencimientos
- ejecucion y seguimiento de mantenimientos programados
- generacion automatica de mantenimientos desde VEOSAT
- tipologias preventivas por horas reales: 250 h, 500 h, 1000 h, 1500 h, 2000 h, 3000 h
- integracion de la herramienta historica de creacion de fichas de mantenimiento como ventana propia dentro de este modulo

Como base visual y estructural inmediata, la capa de taller debe importar de I+D solo la parte preventiva de `Mantenimiento`, sin sustituirla ni sobrescribirla. Esto implica trasladar a la app paralela, como punto de partida, estas vistas:
- preventivo dashboard
- preventivo listado
- detalle preventivo

Las vistas de correctivo de I+D no deben seguir considerandose parte funcional de este modulo en taller. Si existen en la base original, deben tomarse solo como referencia historica de I+D, no como alcance activo del rediseño.

La entrada del modulo en taller debe abrir directamente la rama preventiva.

## 6. Informacion que debe mostrarse
- mantenimientos preventivos programados, vencidos y en curso
- proximas revisiones por maquina
- cumplimiento preventivo
- coste preventivo
- historico preventivo por maquina
- retrasos y vencimientos
- carga preventiva del dia o semana
- calendario mensual preventivo
- listado lateral compacto del mismo conjunto filtrado
- campos autocompletados desde VEOSAT: obra, horas acumuladas y umbral de mantenimiento
- lectura del tipo de mantenimiento en formato horario real, no en codigos A/B/C

## 7. Acciones principales del usuario
- abrir el panel preventivo
- consultar preventivos pendientes
- revisar detalle de maquina o mantenimiento
- planificar mantenimientos
- revisar vencidos y proximos
- hacer seguimiento del cumplimiento
- revisar mantenimientos generados automaticamente por VEOSAT
- validar mantenimientos ya volcados al calendario

## 8. Estados o etapas del modulo
- preventivo programado
  VEOSAT detecta que a una maquina le quedan X horas para llegar al mantenimiento y lo genera automaticamente.
- preventivo atrasado
  La maquina ya supera el umbral horario previsto y el mantenimiento sigue sin ejecutarse.
- preventivo en curso
  Ya se ha abierto la orden de mantenimiento correspondiente y el preventivo esta en ejecucion.
- preventivo completado
- preventivo cancelado

## 9. Vistas o bloques recomendados
- mantenimientos abiertos
- calendario preventivo
- listado preventivo
- historico de mantenimientos
  - alta de mantenimiento preventivo
- creacion de fichas de mantenimiento
- detalle preventivo
- planificacion o calendario
- historico preventivo

En esta fase, la propuesta de taller ya no debe arrancar desde el dashboard analitico de I+D. La entrada principal del modulo debe ser el calendario preventivo, inicialmente vacio, y el usuario debe poder poblarlo creando mantenimientos desde un boton especifico.

La vista `calendario` del modulo debe incorporar una composicion similar a la de `Incidencias`:
- calendario mensual
- vista lista propia del taller
- panel lateral con mantenimientos en formato lista compacta
- relacion visual entre tarjeta lateral y evento del calendario
- detalle desplegable en la lista lateral sin salir de la vista
- acceso a pantalla completa al pulsar un mantenimiento desde calendario o desde lista lateral
- modo eliminacion activable tanto en calendario como en lista
- boton de simulacion de generacion automatica para representar el alta desde VEOSAT
- boton integrado para abrir la herramienta de creacion de fichas de mantenimiento ya existente
- los mantenimientos generados deben verse en calendario y lateral con una lectura visual parecida a la de incidencias creadas
- la vista de alta no debe pedir manualmente obra, horas ni tipo: esos datos deben entrar ya rellenados
- la asignacion se resolvera en Ordenes de Trabajo, no en este detalle preventivo
- la fecha programada debe poder ajustarse manualmente desde taller
- la tipologia preventiva debe expresarse como intervalo horario real

## 10. Relacion con otros modulos
Se conecta con Maquinaria, OT, Inventario, Personal, Avisos y Gestion Economica. La relacion con `Incidencias` debe existir como dependencia externa, pero no como submodulo interno.

## 11. Criterios de consistencia visual
- mantener KPI cards, tablas y listas resumidas
- mantener uso de graficos solo donde ayuden a decidir
- mantener colores por criticidad, vencimiento y tipo de mantenimiento
- eliminar del modulo de taller cualquier navegacion que mezcle preventivo con correctivo

## 12. Ideas de rediseño
- simplificar la base preventiva de I+D para hacerla mas accionable
- reforzar planificacion y cumplimiento preventivo
- centrar el modulo en vencimientos, ejecucion diaria y proximos mantenimientos
- eliminar carga ficticia inicial para que la capa taller parta limpia
- usar el calendario como punto de trabajo principal del modulo
- tomar VEOSAT como origen principal de generacion preventiva por ubicacion y horas

## 13. Dudas, supuestos o decisiones pendientes
- hay rutas sugeridas como calendario, planes o historico preventivo que no estan completas
- falta revisar en detalle los submodulos de preventivo
- queda fijado que correctivo no vive aqui: vive en `Incidencias`
