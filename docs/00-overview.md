# 1. Objetivo del módulo
Definir el marco de trabajo para la readaptación funcional del frontend del taller sin alterar la propuesta original de I+D.

## 2. Usuarios del módulo
- jefe de taller
- mecánicos
- administrativos
- almacén
- responsables de mantenimiento
- dirección o responsables operativos

## 3. Procesos del taller afectados
- consulta transversal del estado del taller
- navegación entre módulos
- priorización de rediseño por fases
- alineación entre operativa real y frontend corporativo

## 4. Situación detectada en la propuesta actual de I+D
La aplicación actual está construida como SPA modular con `React`, `Vite`, `TypeScript`, `React Router`, `TanStack Query`, `lucide-react` y `recharts`. El patrón base es un `Layout` con sidebar lateral colapsable, contenido principal scrollable y páginas por módulo. Los módulos detectados en navegación son: Dashboard, Maquinaria, Órdenes de Trabajo, Personal, Averías e Incidencias, Repuestos y Almacén, Mantenimiento, Avisos, Gestión Económica, Informes y Configuración.

## 5. Propuesta funcional adaptada a taller
Usar esta carpeta como capa paralela de redefinición funcional. Cada archivo documenta un módulo independiente, tomando la solución actual solo como referencia. La evolución debe hacerse por módulo, empezando por análisis funcional y sin pasar a implementación hasta nueva indicación.

## 6. Información que debe mostrarse
- mapa de módulos existentes
- subrutas detectadas
- patrones de layout y navegación
- nivel de madurez funcional por módulo
- dependencias cruzadas entre máquinas, OT, averías, mantenimiento, inventario, personal y costes

## 7. Acciones principales del usuario
- revisar la estructura funcional actual
- decidir prioridades de rediseño
- validar supuestos de negocio
- solicitar evolución módulo a módulo

## 8. Estados o etapas del módulo
- analizado
- pendiente de redefinición funcional
- redefinido funcionalmente
- pendiente de implementación
- implementado en capa paralela

## 9. Vistas o bloques recomendados
- overview general del rediseño
- un documento por módulo principal
- futura carpeta `src` para prototipos o implementación validada

## 10. Relación con otros módulos
Este documento gobierna la relación entre todos los módulos y fija el criterio común de consistencia funcional y visual.

## 11. Criterios de consistencia visual
- mantener sidebar lateral, jerarquía por páginas y subrutas
- conservar cabeceras simples con título y acciones
- reutilizar tarjetas KPI, tablas, filtros desplegables, toggles de vista y paneles de detalle
- respetar estados visuales existentes por color: verde correcto, amarillo atención, rojo crítico, azul informativo

## 12. Ideas de rediseño
- documentar primero la realidad operativa antes de mover pantallas
- reforzar la trazabilidad entre módulos en todos los documentos
- clasificar cada módulo según utilidad diaria real y no solo por estructura técnica

## 13. Dudas, supuestos o decisiones pendientes
- falta validar con operativa real qué módulos son prioritarios
- `reports` y parte de `settings` parecen todavía conceptuales
- hay texto con problemas de codificación en algunos archivos originales, pero no afecta a esta capa documental
