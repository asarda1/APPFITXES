# 1. Objetivo del módulo
Centralizar la configuración funcional y administrativa de la aplicación.

## 2. Usuarios del módulo
- administradores
- responsables con permisos de configuración
- dirección de sistemas si aplica

## 3. Procesos del taller afectados
- gestión de usuarios
- permisos
- parámetros generales
- gobierno básico de la aplicación

## 4. Situación detectada en la propuesta actual de I+D
Configuración es un módulo muy inicial. La pantalla principal muestra acceso a Gestión de Usuarios y un bloque de Configuración General todavía no disponible. Hay control por permisos y una subruta específica para usuarios.

## 5. Propuesta funcional adaptada a taller
Mantener el alcance contenido. Configuración debe cubrir solo aquello que realmente necesita parametrización y administración, evitando mezclar aquí reglas operativas que deberían vivir en los módulos de negocio. La primera prioridad parece ser usuarios, roles y permisos.

## 6. Información que debe mostrarse
- usuarios
- roles
- permisos por módulo
- parámetros generales
- catálogos básicos si se confirman

## 7. Acciones principales del usuario
- revisar usuarios
- asignar permisos
- acceder a ajustes generales

## 8. Estados o etapas del módulo
- disponible
- restringido por permisos
- en desarrollo

## 9. Vistas o bloques recomendados
- portada de configuración
- gestión de usuarios
- configuración general
- futuras parametrizaciones específicas si se justifican

## 10. Relación con otros módulos
Afecta transversalmente a toda la aplicación por permisos y parametrización.

## 11. Criterios de consistencia visual
- mantener portada simple con tarjetas de acceso
- mantener gating por permisos
- mantener la estética sobria del resto de módulos administrativos

## 12. Ideas de rediseño
- separar claramente administración de usuarios de parámetros funcionales
- definir qué catálogos deben ser configurables y cuáles no
- evitar convertir este módulo en cajón de sastre

## 13. Dudas, supuestos o decisiones pendientes
- falta revisar el módulo de usuarios para documentarlo después
- falta decidir qué parte de configuración general entrará en alcance
- falta validar si ciertos catálogos se gestionarán aquí o en módulos específicos
