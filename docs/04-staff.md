# 1. Objetivo del modulo
Gestionar el personal del taller, su disponibilidad y su relacion con las OT y los mantenimientos.

## 2. Usuarios del modulo
- jefe de taller
- administrativos
- responsables de mantenimiento
- RR. HH. o responsables internos si aplica

## 3. Procesos del taller afectados
- control de disponibilidad
- asignacion de personal
- consulta de perfiles y ubicacion
- seguimiento de vacaciones y ausencias

## 4. Situacion detectada en la propuesta actual de I+D
La base importada de I+D aportaba varias vistas de personal y un detalle individual, pero estaba pensada para un alcance mas amplio del necesario en taller.

## 5. Base visual ya adaptada a taller
La propuesta de taller ya deja:
- vista principal en formato lista
- tarjetas superiores por disponibilidad
- detalle individual de trabajador
- vista especifica de `Disponibilidad` en calendario mensual

## 6. Propuesta funcional adaptada a taller
El modulo debe responder a preguntas operativas simples:
- quien esta disponible
- quien esta de vacaciones
- en que taller esta cada mecanico
- que personal se puede asignar despues a una OT

## 7. Informacion que debe mostrarse
- codigo empleado
- nombre
- puesto
- taller
- disponibilidad actual
- contacto
- fecha de alta

## 8. Acciones principales del usuario
- consultar personal disponible
- abrir ficha del trabajador
- abrir calendario de disponibilidad
- marcar vacaciones sobre dias laborables

## 9. Estados o etapas del modulo
- disponible
- baja medica
- vacaciones
- no laborable
- festivo

## 10. Vistas o bloques recomendados
- listado principal
- calendario de disponibilidad
- ficha individual

## 11. Relacion con otros modulos
Se conecta con:
- `OT`
- `Mantenimiento`
- `Incidencias`

## 12. Criterios de consistencia visual
- mantener tarjetas superiores por disponibilidad
- mantener tabla simple como vista principal
- mantener boton visible `Disponibilidad`
- mantener semantica de color por estado

## 13. Vista de disponibilidad
La propuesta incorpora una vista mensual de `Disponibilidad`.

Objetivo:
- ver disponibilidad mensual de los mecanicos
- bloquear festivos y no laborables
- marcar vacaciones por clic

Reglas iniciales:
- por defecto, todos los mecanicos estan disponibles en dias laborables
- los festivos de Lleida 2026 quedan marcados como no laborables
- sabados y domingos quedan marcados como no laborables
- las vacaciones se pueden marcar y quitar sobre dias laborables

Lectura visual:
- `D` = disponible
- `V` = vacaciones
- `F` = festivo
- `NL` = no laborable

## 14. Dudas, supuestos o decisiones pendientes
- falta validar si aqui deben entrar tambien bajas y permisos
- falta definir si el jefe de taller podra editar ausencias distintas de vacaciones
- falta decidir si el calendario debe quedarse solo para mecanicos o incluir tambien jefe de taller
