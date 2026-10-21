import { ClipboardList, Eye, FileText, MoveRight } from 'lucide-react'
import type { WorkshopModuleDefinition } from '../modules'

export function ModulePage({ module }: { module: WorkshopModuleDefinition }) {
  const Icon = module.icon
  const docPath = `frontend-redesign-workshop/docs/${getDocName(module.slug)}`

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Módulo
              </div>
              <h2 className="text-3xl font-bold">{module.title}</h2>
              <p className="mt-2 max-w-3xl text-muted-foreground">{module.objective}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Estado actual: <span className="font-semibold text-foreground">documentado y listo para evolucionar</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <ClipboardList className="h-4 w-4" />
            Detectado en I+D
          </div>
          <p className="mt-3 text-sm leading-6 text-foreground">{module.detected}</p>
        </article>

        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <FileText className="h-4 w-4" />
            Enfoque Taller
          </div>
          <p className="mt-3 text-sm leading-6 text-foreground">{module.redesign}</p>
        </article>

        <article className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Eye className="h-4 w-4" />
            Siguiente Paso Visual
          </div>
          <p className="mt-3 text-sm leading-6 text-foreground">{module.nextVisualStep}</p>
        </article>
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <MoveRight className="h-4 w-4" />
          Cómo se usará este módulo
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="text-sm font-semibold">Documento funcional de referencia</div>
            <p className="mt-2 text-sm text-muted-foreground">
              La definición funcional vive en <code>{docPath}</code>. Cada cambio de negocio quedará primero recogido ahí.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="text-sm font-semibold">Visualización inmediata</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Desde el primer cambio que decidas en este módulo, iremos reflejándolo también en esta capa visual paralela.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function getDocName(slug: string) {
  const names: Record<string, string> = {
    dashboard: '01-dashboard.md',
    'assets-and-machinery': '02-assets-and-machinery.md',
    'work-orders': '03-work-orders.md',
    staff: '04-staff.md',
    incidents: '05-incidents.md',
    'inventory-and-spare-parts': '06-inventory-and-spare-parts.md',
    maintenance: '07-maintenance.md',
    'notifications-and-alerts': '08-notifications-and-alerts.md',
    'financial-management': '09-financial-management.md',
    'reports-and-analytics': '10-reports-and-analytics.md',
    settings: '11-settings.md',
  }

  return names[slug] ?? '00-overview.md'
}
