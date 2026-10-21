export type WorkshopNotification = {
  id: string
  title: string
  message: string
  createdAt: string
  read: boolean
  href?: string
  sourceModule: 'incidents' | 'maintenance'
}

const STORAGE_KEY = 'frontend_redesign_workshop_notifications'
const EVENT_NAME = 'frontend-redesign-workshop-notifications-updated'

function loadNotifications(): WorkshopNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as WorkshopNotification[]
  } catch {
    return []
  }
}

function saveNotifications(notifications: WorkshopNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function getWorkshopNotifications() {
  return loadNotifications().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function createWorkshopNotification(
  notification: Omit<WorkshopNotification, 'id' | 'createdAt' | 'read'>,
) {
  const current = loadNotifications()
  const newNotification: WorkshopNotification = {
    ...notification,
    id: `notification-${Date.now()}`,
    createdAt: new Date().toISOString(),
    read: false,
  }

  saveNotifications([newNotification, ...current])
  return newNotification
}

export function markWorkshopNotificationAsRead(id: string) {
  const current = loadNotifications()
  saveNotifications(
    current.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    ),
  )
}

export function markAllWorkshopNotificationsAsRead() {
  const current = loadNotifications()
  saveNotifications(current.map((notification) => ({ ...notification, read: true })))
}

export function subscribeWorkshopNotifications(listener: () => void) {
  window.addEventListener(EVENT_NAME, listener)
  return () => window.removeEventListener(EVENT_NAME, listener)
}
