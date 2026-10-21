# 1. Objetivo del módulo
Registrar, clasificar y seguir averías e incidencias desde su detección hasta su resolución o conversión en trabajo ejecutable.

## 2. Usuarios del módulo
- jefe de taller
- mecánicos
- responsables de mantenimiento
- usuarios que reportan incidencias

## 3. Procesos del taller afectados
- reporte de averías
- priorización de incidencias
- diagnóstico y seguimiento
- relación con máquinas y OT
- histórico técnico por máquina

## 4. Situación detectada en la propuesta actual de I+D
El módulo dispone de listado, dashboard, nueva incidencia, kanban, detalle y vista de historial por máquina. En el listado hay búsqueda, filtros de severidad y estado, vistas `grid/list/kanban`, tarjetas contador por estado y enlace a reportar avería. Los estados detectados en lista son `reported`, `repairing` y `resolved`. Además el router incluye detalle e historial por máquina.

## 5. Propuesta funcional adaptada a taller
Mantener la separación entre incidencia y OT si aporta valor real: la incidencia como entrada rápida y la OT como ejecución formal. El rediseño debe dejar muy claro cuándo una incidencia se resuelve directamente, cuándo genera OT y cómo se consulta el historial repetitivo por máquina.

Como base visual y estructural inmediata, la capa de taller debe importar íntegramente la propuesta actual de I+D en `Incidencias`, sin sustituirla ni sobrescribirla. Esto implica trasladar a la app paralela, como punto de partida, estas vistas:
- listado
- dashboard
- kanban
- nueva incidencia
- detalle de incidencia

La entrada operativa del módulo en taller debe cambiar respecto a I+D:
- la vista principal debe ser un calendario mensual
- cada incidencia debe aparecer automáticamente en el día que corresponda según su fecha de creación
- el calendario debe permitir navegar meses hacia delante y hacia atrás
- la segunda vista principal debe ser una vista en formato lista, equivalente a la vista actual de entrada en I+D
- la navegación superior del módulo debe quedar en `Incidencias abiertas` e `Historico de incidencias`
- dentro de `Incidencias abiertas`, `calendario` y `lista` deben funcionar como modos de visualización internos, no como pestañas superiores
- a la derecha de `Incidencias abiertas` debe existir un acceso a `Historico de incidencias`
- la creación debe resolverse con un botón de acción, no con una pestaña adicional
- en `Incidencias abiertas` debe existir un botón visible de `Reportar incidencia`
- la acción de `reportar avería` debe mantener el patrón visual de I+D, pero simplificada para uso móvil y operarios con poca formación digital
- la vista de reporte debe presentarse en formato claramente móvil, con composición de app de teléfono, elementos apilados y botones táctiles grandes
- el tipo de avería no debe elegirse escribiendo, sino mediante tarjetas táctiles de selección
- el flujo de reporte no debe arrancar preguntando por una avería, sino por un `problema con la máquina`
- antes de crear una avería, el sistema debe clasificar el caso entre:
- `averías críticas`
- `averías leves`
- `dudas de funcionamiento`
- el sistema debe usar preguntas simples para evitar escalar al taller problemas por mal uso, desconocimiento o falsas alarmas
- aunque el resultado sea `duda de funcionamiento` o `avería leve`, la incidencia debe registrarse igualmente para poder analizar patrones, detectar desconocimiento recurrente y preparar formaciones

## 6. Información que debe mostrarse
- código de incidencia
- máquina afectada
- descripción y síntomas
- severidad
- estado
- reportado por y fecha
- relación con OT asociada
- ubicación
- historial de incidencias previas
- tiempo de parada si aplica
- fecha y hora de creacion en vistas tipo lista

## 7. Acciones principales del usuario
- reportar una avería en pocos pasos
- reportar un problema con lenguaje simple, sin exigir al operario diagnóstico técnico
- filtrar incidencias activas
- pasar una incidencia a OT
- seguir estado y responsable
- consultar historial por máquina
- revisar incidencias por día natural en calendario mensual
- crear una incidencia y volver al calendario para verla inmediatamente en su fecha de creación
- reportar una incidencia desde obra mediante un formulario corto, táctil y fácil de usar
- generar una notificacion interna cuando se crea un nuevo reporte

## 8. Estados o etapas del módulo
- reportada
- en diagnóstico
- en reparación
- pendiente de material si aplica
- resuelta
- convertida en OT si aplica

## 9. Vistas o bloques recomendados
- calendario mensual
- listado principal
- dashboard de incidencias
- alta rápida
- kanban
- detalle de incidencia
- historial por máquina

En esta fase, la propuesta de taller debe partir de la copia visual completa del módulo I+D antes de introducir readaptaciones funcionales propias.

El `detalle de incidencia` en la capa taller debe reorganizarse para lectura rápida y no replicar sin filtro toda la densidad técnica de I+D. Debe priorizar:
- resumen superior de impacto operativo
- contexto del aviso
- un único bloque de lectura del reporte que integre:
- impacto operativo
- señales clave para taller
- contenido del reporte guiado
- un bloque específico de `Fotos y videos` con acceso de previsualización
- cronología clara
- accesos a máquina y OT asociada

La `alta rápida` debe rediseñarse como asistente guiado en 3 pasos:
- selección de máquina y tipo de problema en lenguaje simple
- comprobación rápida con preguntas cerradas y checklist distinta según el síntoma elegido
- decisión del sistema sobre si debe escalarse a taller o no
- las preguntas del asistente no deben repetir información ya implícita por la tarjeta elegida; por ejemplo, si el operario marca `pierde aceite o liquido`, no se le debe volver a preguntar si hay fuga visible
- si el operario marca `no se usar una funcion`, el flujo no debe pasar por comprobación técnica estándar, sino por preguntas de contexto de uso adaptadas a maquinaria de asfalto, estabilizado y movimiento de tierras
- cuando el sistema concluya que no es avería real, debe seguir ofreciendo salidas claras como ayuda rápida o revisión con encargado, pero sin impedir el registro de la incidencia
- en casos críticos como fugas o alarmas, la app debe exigir evidencia visual antes de enviar el reporte al taller
- tanto la vista de calendario como la vista de lista deben permitir filtrar por: `averías críticas`, `averías leves` y `dudas de funcionamiento`
- el módulo debe mostrar contadores superiores para `averías críticas`, `averías leves` y `dudas de funcionamiento`, y dichos contadores deben actuar como acceso rápido al filtro correspondiente
- tanto en calendario como en lista debe existir acción de eliminar incidencia creada, con confirmación previa para evitar borrados accidentales
- en la vista lista, la eliminación no debe ocupar una columna fija; debe activarse mediante un botón externo de modo borrado, mostrando entonces un botón `-` junto a cada incidencia
- `Historico de incidencias` debe mostrarse en formato lista y debe incorporar filtro por tipo de avería
- en la vista de calendario debe existir un panel lateral con las incidencias en formato lista compacta, ocupando menos espacio que la vista lista principal
- cada incidencia del panel lateral debe tener un desplegable para mostrar más características sin salir de la vista de calendario

## 10. Relación con otros módulos
Se conecta con Maquinaria, OT, Mantenimiento, Inventario y Avisos.

## 11. Criterios de consistencia visual
- mantener tarjetas contador por estado
- sustituir la entrada del módulo por toggle `calendario/lista`
- mantener badges de severidad y estado
- mantener tabla de lectura rápida y cabecera simple
- mantener en alta de incidencia un patrón visual claro, táctil y con tarjetas grandes para selección
- priorizar botones grandes, lenguaje no técnico y respuestas cerradas para uso futuro en app móvil

## 12. Ideas de rediseño
- distinguir mejor incidencia rápida frente a avería técnica compleja
- reforzar la conversión controlada a OT
- explotar más el historial por máquina para detección de recurrencias
- reutilizar primero todo el alcance visual actual de I+D para no perder cobertura funcional al pasar a la capa taller

## 14. Flujo móvil de reporte de averías

### 14.1 Objetivo del flujo
Permitir que un operario de obra reporte un problema de máquina en muy pocos pasos, con lenguaje no técnico, recogiendo síntomas observables y contexto útil para que el sistema priorice correctamente y el taller no reciba ruido innecesario.

Este flujo está orientado a uso real sobre maquinaria de:
- asfalto
- estabilizado
- movimiento de tierras

Y especialmente pensado para:
- extendedoras
- fresadoras
- compactadores
- estabilizadoras
- palas
- retroexcavadoras
- dumpers
- equipos auxiliares

### 14.2 Qué se detecta en el flujo actual
La propuesta móvil ya ha mejorado respecto a I+D en varios puntos:
- usa tarjetas grandes
- evita pedir diagnóstico técnico
- diferencia gravedad
- pregunta si la máquina puede seguir trabajando
- recoge evidencia visual

Aun así, el flujo actual sigue teniendo carencias respecto al enfoque de maquinaria pesada en obra:
- el paso 1 todavía depende demasiado de selectores manuales
- el paso 2 aún no está planteado por completo desde síntomas puramente observables de campo
- parte de la lógica sigue partiendo de comprobaciones genéricas más que de contexto operativo
- no se ha formalizado del todo la lógica de contención para evitar avisos innecesarios
- falta documentar de forma cerrada la priorización entre máquina operativa, limitada o parada
- falta dejar definido el cierre del flujo con mensajes finales distintos según nivel de impacto

### 14.3 Estructura objetivo del flujo
El flujo debe comportarse como un asistente guiado de obra en 3 pasos:

1. Identificar máquina
2. Qué está pasando
3. Añadir información y enviar

No debe sentirse como un formulario tradicional.

### 14.4 Paso 1: Identificar máquina

#### Objetivo
Saber rápidamente qué equipo está afectado sin hacer perder tiempo al operario.

#### Campos
- máquina: obligatorio
- obra: solo si no viene precargada
- usuario: no se pide si ya está logado

#### Reglas funcionales
- priorizar autocompletado
- priorizar máquina asignada o última usada
- minimizar selectores manuales
- permitir:
- `No encuentro la máquina`
- `No sé cuál es`

#### Criterios UX
- máximo 1 o 2 campos visibles
- botón grande `Continuar`
- sin scroll innecesario
- lenguaje claro y directo

#### Textos de interfaz
Título:
`Tengo un problema con una máquina`

Subtítulo:
`Selecciona la máquina para continuar`

### 14.5 Paso 2: Qué está pasando

#### Objetivo
Capturar el síntoma real que el operario ve o nota, sin pedirle que diagnostique la causa.

#### Principio funcional
Las opciones deben describir cosas observables, no diagnósticos técnicos.

#### Tarjetas de síntoma recomendadas
- `No arranca`
- `Se ha parado trabajando`
- `Sale una alarma o aviso`
- `Pierde aceite / gasoil / hidráulico`
- `Hace un ruido raro`
- `No tiene fuerza / va lenta`
- `No funciona una parte`
- `Se ha roto o golpeado algo`
- `Otro problema`

#### Pregunta clave obligatoria
Debe aparecer siempre:
`¿La máquina puede seguir trabajando?`

Opciones:
- `Sí, sin problema`
- `Sí, pero con limitaciones`
- `No, está parada`

Esta pregunta es la base de priorización para taller.

#### Preguntas dinámicas por síntoma
El flujo debe mostrar solo 2 o 3 preguntas cortas después de elegir el síntoma.

Ejemplos:

`No arranca`
- `¿Da contacto?`
- `¿Hace intento de arranque?`
- `¿Arrancaba antes hoy?`

`Se ha parado trabajando`
- `¿Se ha parado de golpe o progresivo?`
- `¿Ha salido algún aviso?`
- `¿Se puede volver a arrancar?`

`Pierde aceite / gasoil / hidráulico`
- `¿La fuga es activa ahora?`
- `¿Hay charco o solo manchas?`
- `¿La máquina sigue funcionando?`

`No tiene fuerza / va lenta`
- `¿En qué trabajo lo notas?`
- `¿Es continuo o puntual?`
- `¿Empeora con el uso?`

`No funciona una parte`
- `¿Qué parte?`
- `¿Impide trabajar?`
- `¿Funciona a ratos?`

#### Adaptación específica a maquinaria pesada
En maquinaria de asfalto, estabilizado y movimiento de tierras conviene priorizar preguntas sobre:
- avance o desplazamiento
- regla, tolva o cinta
- tambor o vibración
- brazo, cazo o implemento
- mandos y selectores
- alarmas visibles
- fugas activas
- pérdida real de capacidad de trabajo

### 14.6 Lógica de decisión interna
El sistema debe clasificar internamente cada caso en:
- `Aviso menor`
- `Incidencia a revisar`
- `Avería grave (máquina parada)`

Estos nombres pueden no mostrarse al operario, pero deben gobernar la priorización.

#### Correspondencia operativa recomendada
- `Aviso menor`
  cuando la máquina sigue trabajando sin síntomas graves ni fuga activa
- `Incidencia a revisar`
  cuando la máquina sigue operativa con limitaciones, hay duda razonable o síntoma repetitivo sin parada total
- `Avería grave`
  cuando la máquina está parada, hay fuga activa relevante, rotura clara o imposibilidad de continuar

### 14.7 Lógica de priorización
La priorización debe construirse desde el impacto real en la operación:

- `Máquina operativa`
  puede seguir trabajando sin afectar de forma relevante

- `Máquina con limitaciones`
  trabaja pero con pérdida de rendimiento, restricción funcional o riesgo de empeorar

- `Máquina parada`
  no puede continuar o debe detenerse

La app debe traducir esto después a prioridad interna para taller.

### 14.8 Lógica de contención
El sistema debe evitar que todo acabe escalando como avería de taller.

Ejemplo de contención:
Si:
- la máquina sigue trabajando
- no hay fuga activa
- no hay síntoma grave
- no hay parada real

Entonces:
- registrar como aviso leve o incidencia a revisar
- permitir continuar trabajando
- informar que taller lo revisará sin tratarlo como parada crítica

La contención no debe impedir registrar, pero sí debe modular prioridad y tratamiento.

### 14.9 Paso 3: Añadir información y enviar

#### Objetivo
Dar al taller solo la información mínima útil para actuar.

#### Elementos
1. Foto
- botón grande `Hacer foto`
- opcional, pero muy recomendable

2. Comentario
- campo corto
- con ayuda tipo:
`Describe brevemente qué ha pasado o cuándo empezó`

#### Resumen previo al envío
Antes de enviar debe mostrarse:
- máquina
- síntoma
- si puede seguir trabajando
- foto: sí/no
- comentario: sí/no

Botón principal:
`Enviar aviso`

### 14.10 Confirmación final
El cierre del flujo debe ser claro, breve y sin ambigüedad.

Ejemplos:

Caso leve:
`Aviso registrado. La máquina puede seguir trabajando. Taller lo revisará.`

Caso intermedio:
`Incidencia registrada. Taller revisará la máquina.`

Caso grave:
`Avería registrada como máquina parada. Taller avisado con prioridad.`

Además, al registrar cualquier nuevo reporte, la capa de taller debe generar una notificación interna visible en cabecera para que el usuario pueda abrir directamente la incidencia recién creada desde el visor.

### 14.11 Textos de interfaz recomendados

Paso 1
Título:
`Tengo un problema con una máquina`

Subtítulo:
`Selecciona la máquina para continuar`

Paso 2
Título:
`¿Qué le pasa a la máquina?`

Subtítulo:
`Marca lo que ves, no hace falta saber la causa`

Paso 3
Título:
`Añadir información`

Subtítulo:
`Revisa el aviso antes de enviarlo`

### 14.12 Ejemplos reales de uso

Extendedora:
- síntoma: `No funciona una parte`
- contexto: la regla no responde igual en un lado
- estado: `Sí, pero con limitaciones`
- salida: incidencia a revisar

Fresadora:
- síntoma: `Sale una alarma o aviso`
- estado: `No, está parada`
- salida: avería grave

Compactador:
- síntoma: `Hace un ruido raro`
- estado: `Sí, sin problema`
- salida: aviso menor

Retroexcavadora:
- síntoma: `Pierde aceite / gasoil / hidráulico`
- fuga activa
- estado: `Sí, pero con limitaciones` o `No, está parada`
- salida: prioridad alta

Estabilizadora:
- síntoma: `No tiene fuerza / va lenta`
- estado: `Sí, pero con limitaciones`
- salida: incidencia a revisar

### 14.13 Mejoras respecto a la propuesta original
- reduce texto libre
- elimina necesidad de diagnóstico técnico
- estructura el reporte por síntomas observables
- introduce priorización real por capacidad de trabajo
- contiene mejor los avisos innecesarios
- adapta el lenguaje al entorno de obra
- prepara mejor la explotación futura de datos para mantenimiento y formación

### 14.14 Estructura futura de componentes
Opcionalmente, esta UI podrá separarse después en:
- `mobile-incident-flow`
- `identify-step`
- `symptom-step`
- `evidence-step`
- `components/symptom-card`
- `components/work-status-selector`
- `components/photo-input`
- `components/report-summary`

### 14.15 Dudas pendientes del flujo
- definir si la máquina vendrá preseleccionada por contexto o QR
- definir si la obra llegará precargada automáticamente
- cerrar el catálogo exacto de preguntas dinámicas por familia de máquina
- decidir cuándo la foto será obligatoria y cuándo solo recomendada
- definir si el usuario verá o no un nivel de prioridad explícito antes de enviar

## 15. Criterio de adjuntos para backend

### 15.1 Recomendación funcional
Los adjuntos de incidencias no deberían guardarse solo como nombre de archivo. Backend debe devolver una estructura de adjuntos por incidencia, preparada para visualización directa en frontend.

### 15.2 Estructura recomendada
Cada incidencia debería poder devolver una colección `attachments` con, como mínimo:
- `id`
- `type`: `image` o `video`
- `file_name`
- `file_url`
- `thumbnail_url` si aplica
- `uploaded_at`
- `uploaded_by`

### 15.3 Criterio recomendado de almacenamiento
La opción más limpia para este flujo es:
- almacenamiento físico en repositorio de archivos o blob storage
- persistencia en base de datos solo de la metadata y URL de acceso

Esto permite:
- previsualizar desde frontend
- descargar archivo original
- no sobrecargar la base de datos con binarios
- escalar mejor cuando aumenten fotos y videos de obra

### 15.4 Comportamiento esperado en frontend
El detalle de incidencia debe poder:
- listar imágenes y videos adjuntos
- abrir previsualización
- abrir archivo real
- descargar archivo si el permiso lo permite

### 15.5 Alternativas aceptables
También podría funcionar si backend entrega:
- URL firmada temporal
- ruta interna securizada
- enlace documental corporativo

Pero para la app de taller, la recomendación principal sigue siendo `metadata + URL accesible`.

## 13. Dudas, supuestos o decisiones pendientes
- falta revisar el dashboard de incidencias y el detalle para documentarlos con más precisión
- falta validar el catálogo real de severidades y estados
- falta decidir si el usuario reportante puede ser alguien fuera del taller
