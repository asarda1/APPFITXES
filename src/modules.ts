import { Bell, BarChart3, Calendar, Euro, LayoutDashboard, Package, Settings, Truck, TriangleAlert, Users, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface WorkshopModuleDefinition {
  slug: string
  title: string
  shortTitle: string
  icon: LucideIcon
  status: 'documented' | 'ready-for-visual' | 'in-progress'
  objective: string
  detected: string
  redesign: string
  nextVisualStep: string
}

// Orden del menú lateral (Propuesta Taller):
// 1) Dashboard 2) Maquinaria 3) Personal 4) Mantenimientos 5) Averías
// 6) Órdenes de Trabajo 7) Avisos 8) Económica 9) Informes 10) Configuración
export const modules: WorkshopModuleDefinition[] = [
  {
    slug: 'dashboard',
    title: 'Dashboard Taller',
    shortTitle: 'Dashboard',
    icon: LayoutDashboard,
    status: 'documented',
    objective: 'Dar una visiÃ³n rÃ¡pida del estado operativo diario del taller.',
    detected:
      'La propuesta I+D resume maquinaria, OT, personal e incidencias con KPIs agregados y filtro de fechas.',
    redesign:
      'La propuesta taller lo orienta a alertas crÃ­ticas, bloqueos operativos, preventivos vencidos y tareas del dÃ­a.',
    nextVisualStep:
      'Convertir el dashboard en centro de decisiÃ³n con bloques accionables y accesos directos a pendientes.',
  },
  {
    slug: 'assets-and-machinery',
    title: 'Maquinaria',
    shortTitle: 'Maquinaria',
    icon: Truck,
    status: 'in-progress',
    objective: 'Gestionar el parque de maquinaria y su ficha operativa.',
    detected:
      'I+D ya tiene listado potente con vistas grid/list/kanban, filtros, documentaciÃ³n, mantenimiento y detalle.',
    redesign:
      'La propuesta taller lo reordena alrededor de la ficha de mÃ¡quina, los accesos documentales directos y los filtros por datos bÃ¡sicos y aÃ±o de adquisiciÃ³n.',
    nextVisualStep:
      'Seguir llevando a vista real la ficha operativa, la integraciÃ³n con ERP y la lÃ³gica documental enlazada.',
  },
  {
    slug: 'staff',
    title: 'Personal',
    shortTitle: 'Personal',
    icon: Users,
    status: 'in-progress',
    objective: 'Controlar disponibilidad y capacidad operativa del personal.',
    detected:
      'I+D ya permite ver personal por listas, tarjetas y kanban con filtros por puesto y taller.',
    redesign:
      'La propuesta taller prioriza disponibilidad real, especialidades y carga de trabajo asignada.',
    nextVisualStep:
      'Crear una vista operativa para asignaciÃ³n rÃ¡pida y consulta de capacidades.',
  },
  {
    slug: 'maintenance',
    title: 'Mantenimiento',
    shortTitle: 'Mantenimientos',
    icon: Calendar,
    status: 'in-progress',
    objective: 'Planificar y seguir los mantenimientos preventivos de la maquinaria.',
    detected:
      'I+D mezcla en el mismo mÃ³dulo preventivo y correctivo, incluyendo averÃ­as y reparaciones.',
    redesign:
      'La propuesta taller separa conceptos: lo correctivo vive en Incidencias y este mÃ³dulo queda dedicado solo a mantenimientos preventivos.',
    nextVisualStep:
      'Replantear la base preventiva de I+D para convertirla en el panel operativo de mantenimientos programados, vencidos y en curso.',
  },
  {
    slug: 'incidents',
    title: 'AverÃ­as e Incidencias',
    shortTitle: 'Averias',
    icon: TriangleAlert,
    status: 'in-progress',
    objective: 'Registrar y seguir incidencias hasta su resoluciÃ³n o conversiÃ³n en OT.',
    detected:
      'I+D ya tiene listado, dashboard, alta, kanban, detalle e histÃ³rico por mÃ¡quina.',
    redesign:
      'La propuesta taller parte ya de la copia visual completa de I+D y aclara el papel de la incidencia como entrada rÃ¡pida y su relaciÃ³n con la OT.',
    nextVisualStep:
      'Empezar a adaptar la copia base de I+D a la operativa real del taller sin perder cobertura funcional.',
  },
  {
    slug: 'work-orders',
    title: 'Ã“rdenes de Trabajo',
    shortTitle: 'Ordenes de Trabajo',
    icon: Wrench,
    status: 'in-progress',
    objective: 'Gestionar apertura, seguimiento y cierre del trabajo ejecutado en taller.',
    detected:
      'I+D incluye listado, dashboard, alta, kanban y detalle con filtros y mÃ©tricas bastante maduras.',
    redesign:
      'La propuesta taller refuerza estados reales de ejecuciÃ³n y visibilidad de bloqueos por material o validaciÃ³n.',
    nextVisualStep:
      'DiseÃ±ar una vista principal que priorice OT abiertas, bloqueadas y pendientes de cierre.',
  },
  {
    slug: 'inventory-and-spare-parts',
    title: 'Repuestos y AlmacÃ©n',
    shortTitle: 'Inventario',
    icon: Package,
    status: 'documented',
    objective: 'Asegurar stock Ãºtil y continuidad operativa del taller.',
    detected:
      'La propuesta I+D ya incluye portada con KPIs, alertas de stock y accesos a repuestos y pedidos.',
    redesign:
      'La propuesta taller lo enfoca a disponibilidad real para OT y mantenimientos, reservas y bloqueos.',
    nextVisualStep:
      'Construir una vista donde el stock crÃ­tico y los consumos vinculados a trabajo estÃ©n en primer plano.',
  },
  {
    slug: 'notifications-and-alerts',
    title: 'Avisos y Alertas',
    shortTitle: 'Avisos',
    icon: Bell,
    status: 'documented',
    objective: 'Centralizar alertas operativas y eventos crÃ­ticos del sistema.',
    detected:
      'I+D ya agrupa avisos por prioridad y mÃ³dulo con portada y accesos rÃ¡pidos.',
    redesign:
      'La propuesta taller lo convierte en centro de excepciones accionables, no en buzÃ³n informativo.',
    nextVisualStep:
      'DiseÃ±ar una bandeja con separaciÃ³n clara entre crÃ­tico, operativo e informativo.',
  },
  {
    slug: 'financial-management',
    title: 'GestiÃ³n EconÃ³mica',
    shortTitle: 'EconÃ³mica',
    icon: Euro,
    status: 'documented',
    objective: 'Controlar costes y rentabilidad ligados a la actividad del taller.',
    detected:
      'I+D tiene estructura madura por tabs: resumen, mano de obra, materiales, mÃ¡quinas, obras y anÃ¡lisis.',
    redesign:
      'La propuesta taller conecta mejor el coste con mÃ¡quina, OT, consumo y desviaciÃ³n real.',
    nextVisualStep:
      'Crear una lectura econÃ³mica mÃ¡s cercana a la operaciÃ³n y menos separada del trabajo tÃ©cnico.',
  },
  {
    slug: 'reports-and-analytics',
    title: 'Informes y AnalÃ­tica',
    shortTitle: 'Informes',
    icon: BarChart3,
    status: 'documented',
    objective: 'Concentrar reporting transversal una vez maduren los mÃ³dulos operativos.',
    detected:
      'I+D lo mantiene todavÃ­a en estado muy inicial con KPIs genÃ©ricos y mÃ³dulo en desarrollo.',
    redesign:
      'La propuesta taller deja este mÃ³dulo en definiciÃ³n contenida para evitar duplicar dashboards prematuros.',
    nextVisualStep:
      'Esperar a estabilizar OT, mantenimiento e inventario antes de diseÃ±ar el reporting transversal.',
  },
  {
    slug: 'settings',
    title: 'ConfiguraciÃ³n',
    shortTitle: 'ConfiguraciÃ³n',
    icon: Settings,
    status: 'documented',
    objective: 'Centralizar administraciÃ³n bÃ¡sica y parametrizaciÃ³n controlada.',
    detected:
      'I+D solo expone gestiÃ³n de usuarios y una configuraciÃ³n general aÃºn no desarrollada.',
    redesign:
      'La propuesta taller mantiene el alcance contenido y evita convertirlo en un cajÃ³n de sastre.',
    nextVisualStep:
      'Definir quÃ© parÃ¡metros realmente necesitan interfaz propia y cuÃ¡les no.',
  },
]
