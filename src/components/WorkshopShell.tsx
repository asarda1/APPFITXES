import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Layers3 } from 'lucide-react'
import { modules } from '../modules'
import {
  getWorkshopNotifications,
  markAllWorkshopNotificationsAsRead,
  markWorkshopNotificationAsRead,
  subscribeWorkshopNotifications,
} from '../data/workshopNotifications'

function getStatusLabel(status: string) {
  if (status === 'in-progress') return 'En visual'
  if (status === 'ready-for-visual') return 'Listo para vista'
  return 'Documentado'
}

export function WorkshopShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    return subscribeWorkshopNotifications(() => setRefreshKey((current) => current + 1))
  }, [])

  const notifications = useMemo(() => getWorkshopNotifications(), [refreshKey])
  const unreadCount = notifications.filter((notification) => !notification.read).length
  const activeModule = useMemo(
    () =>
      modules.find(
        (module) =>
          location.pathname === `/${module.slug}` || location.pathname.startsWith(`/${module.slug}/`),
      ),
    [location.pathname],
  )

  const handleOpenNotification = (id: string, href?: string) => {
    markWorkshopNotificationAsRead(id)
    setRefreshKey((current) => current + 1)
    setNotificationsOpen(false)
    if (href) navigate(href)
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="grid h-screen md:grid-cols-[280px_minmax(0,_1fr)]">
        <aside className="flex h-full flex-col overflow-hidden border-r bg-card">
          <div
            className="flex h-16 shrink-0 items-center justify-between px-4 text-white"
            style={{ backgroundColor: 'rgb(250, 166, 26)' }}
          >
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Taller</div>
              <div className="text-lg font-bold">Frontend Redesign</div>
            </div>
            <Layers3 className="h-5 w-5" />
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {modules.map((module) => {
              const active =
                location.pathname === `/${module.slug}` ||
                location.pathname.startsWith(`/${module.slug}/`)
              const Icon = module.icon

              return (
                <Link
                  key={module.slug}
                  to={`/${module.slug}`}
                  className={`block rounded-lg border px-3 py-3 transition-colors ${
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:border-border hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 rounded-md p-2 ${
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{module.shortTitle}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{getStatusLabel(module.status)}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex h-full min-w-0 flex-col overflow-hidden border-t md:border-t-0">
          <header className="shrink-0 border-b bg-card/80 backdrop-blur">
            <div className="flex items-start justify-between gap-4 px-6 py-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Propuesta Taller
                </div>
                <h1 className="text-2xl font-bold">{activeModule?.title ?? 'Visor de Rediseño Funcional'}</h1>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((current) => !current)}
                  className="relative rounded-xl border bg-background p-3 transition-colors hover:bg-muted"
                  title="Notificaciones"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-14 z-50 w-[360px] rounded-2xl border bg-card shadow-2xl">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold">Notificaciones</div>
                        <div className="text-xs text-muted-foreground">
                          Nuevos reportes de incidencias
                        </div>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            markAllWorkshopNotificationsAsRead()
                            setRefreshKey((current) => current + 1)
                          }}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Marcar todas
                        </button>
                      )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto p-3">
                      {notifications.length > 0 ? (
                        <div className="space-y-2">
                          {notifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => handleOpenNotification(notification.id, notification.href)}
                              className={`w-full rounded-xl border p-3 text-left transition-colors hover:bg-muted ${
                                notification.read ? 'bg-background' : 'bg-primary/5'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold">{notification.title}</div>
                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {notification.message}
                                  </div>
                                  <div className="mt-2 text-[11px] text-muted-foreground">
                                    {new Date(notification.createdAt).toLocaleDateString('es-ES')} ·{' '}
                                    {new Date(notification.createdAt).toLocaleTimeString('es-ES', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                </div>
                                {!notification.read && (
                                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-600" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                          Todavia no hay notificaciones.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="min-h-0 p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
