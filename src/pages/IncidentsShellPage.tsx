import { Link, Outlet, useLocation } from 'react-router-dom'

const incidentTabs = [
  { label: 'Incidencias abiertas', href: '/incidents' },
  { label: 'Historico de incidencias', href: '/incidents/history' },
]

export function IncidentsShellPage() {
  const location = useLocation()

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {incidentTabs.map((tab) => {
          const active =
            (tab.href === '/incidents' &&
              (location.pathname === '/incidents' || location.pathname === '/incidents/list')) ||
            (tab.href !== '/incidents' && location.pathname.startsWith(tab.href))

          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:border-primary hover:bg-primary/5'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
