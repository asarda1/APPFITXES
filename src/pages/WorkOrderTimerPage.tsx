import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pause, Play, SquareCheck, RotateCcw, ArrowLeft, QrCode } from 'lucide-react'
import {
  finishWorkOrderTimer,
  formatDuration,
  getWorkOrderElapsedMs,
  getWorkOrderTimerState,
  pauseWorkOrderTimer,
  resetWorkOrderTimer,
  syncWorkOrderTimerFromCloud,
  startWorkOrderTimer,
} from '../../../src/utils/workOrderTimer'

export function WorkOrderTimerPage() {
  const { id } = useParams()
  const workOrderId = id ?? ''

  const [tick, setTick] = useState(0)
  const [localIp, setLocalIp] = useState('')
  const [showQr, setShowQr] = useState(false)

  const state = useMemo(() => (workOrderId ? getWorkOrderTimerState(workOrderId) : null), [workOrderId, tick])
  const elapsed = useMemo(() => (workOrderId ? getWorkOrderElapsedMs(workOrderId) : 0), [workOrderId, tick])

  useEffect(() => {
    const interval = window.setInterval(() => setTick((current) => current + 1), 500)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!workOrderId) return
    let cancelled = false
    const interval = window.setInterval(() => {
      void syncWorkOrderTimerFromCloud(workOrderId).then(() => {
        if (!cancelled) setTick((current) => current + 1)
      })
    }, 1500)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [workOrderId])

  if (!workOrderId) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6">
        <div className="rounded-2xl border bg-card p-5">
          <div className="text-sm font-semibold text-foreground">Temporizador</div>
          <div className="mt-1 text-sm text-muted-foreground">Falta el identificador de la OT.</div>
        </div>
      </div>
    )
  }

  const status = state?.status ?? 'idle'

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
  const isLocalhost = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')
  const qrUrl = localIp ? currentUrl.replace(/localhost|127\.0\.0\.1/, localIp) : currentUrl

  useEffect(() => {
    if (localIp) localStorage.setItem('workshop_local_ip', localIp)
  }, [localIp])

  return (
    <div className="mx-auto max-w-md space-y-4 p-6 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/work-orders/${workOrderId}`}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la OT
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-muted"
            title="Mostrar/Ocultar QR para móvil"
          >
            <QrCode className="h-4 w-4" />
            Móvil
          </button>
          <div className="text-xs font-semibold text-muted-foreground">OT: {workOrderId}</div>
        </div>
      </div>

      {showQr && (
        <div className="rounded-2xl border bg-card p-6 text-center animate-in fade-in slide-in-from-top-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            Escanear para continuar en móvil
          </div>
          
          <div className="flex justify-center mb-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
              alt="QR Code de la OT"
              className="rounded-xl border shadow-sm"
              width={200}
              height={200}
            />
          </div>

          {isLocalhost && !localIp && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 text-left mb-4">
              <p className="font-semibold mb-1">⚠️ Estás en modo local</p>
              <p className="mb-3">El QR no funcionará desde tu móvil si usas <code>localhost</code>. Ingresa la IP de este PC en tu red WiFi:</p>
              <input
                type="text"
                placeholder="Ej: 192.168.1.50"
                className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                onBlur={(e) => setLocalIp(e.target.value.trim())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setLocalIp(e.currentTarget.value.trim())
                }}
              />
            </div>
          )}

          {localIp && (
            <div className="text-xs text-muted-foreground mb-4 break-all bg-muted p-2 rounded-lg">
              URL: {qrUrl}
              <button 
                className="ml-2 text-primary underline"
                onClick={() => setLocalIp('')}
              >
                Cambiar IP
              </button>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            Escanea este código con tu teléfono para llevarte el control horario contigo mientras trabajas en la máquina.
          </p>
        </div>
      )}

      <div className="rounded-2xl border bg-card p-6 text-center">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Control horario</div>
        <div className="mt-2 text-5xl font-bold tabular-nums text-foreground">{formatDuration(elapsed)}</div>
        <div className="mt-2 text-sm font-semibold text-muted-foreground">
          Estado: {status === 'idle' ? 'Sin iniciar' : status === 'running' ? 'En marcha' : status === 'paused' ? 'Pausado' : 'Finalizado'}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => startWorkOrderTimer(workOrderId)}
            disabled={status === 'finished'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Play
          </button>
          <button
            type="button"
            onClick={() => pauseWorkOrderTimer(workOrderId)}
            disabled={status !== 'running'}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold disabled:opacity-50"
          >
            <Pause className="h-4 w-4" />
            Pausa
          </button>
          <button
            type="button"
            onClick={() => finishWorkOrderTimer(workOrderId)}
            disabled={status === 'finished'}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800 disabled:opacity-50"
          >
            <SquareCheck className="h-4 w-4" />
            Finalizar
          </button>
        </div>

        <button
          type="button"
          onClick={() => resetWorkOrderTimer(workOrderId)}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-muted"
        >
          <RotateCcw className="h-4 w-4" />
          Reiniciar contador
        </button>
      </div>
    </div>
  )
}
