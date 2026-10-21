import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CalendarDays, ClipboardCheck, Wrench } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { MaintenanceStatus, MaintenanceType } from '../../src/types/preventiveMaintenance'
import { createWorkshopMaintenance } from '../data/workshopMaintenances'
import { createWorkshopNotification } from '../data/workshopNotifications'

const machineOptions = [
  { code: '20051', name: 'MERCEDES ACTROS4225NFR', type: 'Tractora', site: 'Taller Frares', currentHours: 0, nextIntervalHours: 250 },
  { code: '21027', name: 'VOLVO A30G', type: 'Camión articulado', site: 'Taller Frares', currentHours: 0, nextIntervalHours: 500 },
  { code: '52015', name: 'CASE SR 210B', type: 'Minicargadora', site: 'Taller Frares', currentHours: 0, nextIntervalHours: 250 },
  { code: '54014', name: 'BOMAG BW120', type: 'Rodillo tándem asfalto', site: 'Taller Frares', currentHours: 0, nextIntervalHours: 250 },
  { code: '55006', name: 'HAMM HP280i', type: 'Compactador neumático', site: 'Taller Frares', currentHours: 0, nextIntervalHours: 250 },
  { code: '56011', name: 'VOGELE 1900-5i X', type: 'Extendedora', site: 'Taller Frares', currentHours: 0, nextIntervalHours: 250 },
  { code: '57010', name: 'WIRTGEN W210FI', type: 'Fresadora', site: 'Taller Frares', currentHours: 0, nextIntervalHours: 250 },
]

const SELECTED_MACHINE_STORAGE_KEY = 'workshop.preventive.newMaintenance.selectedMachineCode'

export function NewMaintenancePage() {
  const navigate = useNavigate()
  const [machineCode, setMachineCode] = useState(() => {
    try {
      const stored = window.localStorage.getItem(SELECTED_MACHINE_STORAGE_KEY)
      return machineOptions.some((machine) => machine.code === stored) ? (stored as string) : machineOptions[0].code
    } catch {
      return machineOptions[0].code
    }
  })
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')
  const hasAutoCreatedRef = useRef(false)

  const selectedMachine = machineOptions.find((machine) => machine.code === machineCode) ?? machineOptions[0]
  const automaticData = useMemo(() => getAutomaticMaintenanceData(selectedMachine.currentHours, selectedMachine.nextIntervalHours), [selectedMachine])

  const createMaintenanceAndNavigate = () => {
    const createdMaintenance = createWorkshopMaintenance({
      machineCode: selectedMachine.code,
      machineName: selectedMachine.name,
      machineType: selectedMachine.type,
      siteName: selectedMachine.site,
      maintenanceType: automaticData.maintenanceType,
      status: automaticData.status,
      scheduledDate: automaticData.scheduledDate,
      estimatedDurationHours: automaticData.estimatedDurationHours,
      currentHours: selectedMachine.currentHours,
      intervalHours: selectedMachine.nextIntervalHours,
      assignedToNames: assignedTo.trim() ? [assignedTo.trim()] : undefined,
      notes: notes.trim() || undefined,
    })

    createWorkshopNotification({
      title: 'Nuevo mantenimiento generado',
      message: `${createdMaintenance.code} · ${createdMaintenance.machine_code} · ${createdMaintenance.site_name ?? 'Sin obra'}`,
      href: `/maintenance/preventive/workshop/${createdMaintenance.id}`,
      sourceModule: 'maintenance',
    })

    navigate('/maintenance/preventive/calendar')
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(SELECTED_MACHINE_STORAGE_KEY, machineCode)
    } catch {
      // ignore storage errors (private mode / blocked storage)
    }
  }, [machineCode])

  useEffect(() => {
    if (hasAutoCreatedRef.current) return
    hasAutoCreatedRef.current = true
    createMaintenanceAndNavigate()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only auto-create once when opening this screen
  }, [])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    createMaintenanceAndNavigate()
  }

  return (
    <div className="flex min-h-0 flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to="/maintenance/preventive/calendar"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Generacion automatica desde VEOSAT</h1>
          <p className="mt-1 text-muted-foreground">
            Simulacion de alta automatica con obra, horas y tipo rellenados desde gestor de flotas.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-6">
        <div className="space-y-6">
        <section className="rounded-2xl border bg-card">
          <div className="flex items-center gap-2 rounded-t-2xl bg-primary px-5 py-4 text-primary-foreground">
            <Wrench className="h-4 w-4" />
            <h2 className="text-base font-semibold">Datos sincronizados</h2>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Maquina</span>
              <select
                value={machineCode}
                onChange={(event) => setMachineCode(event.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
              >
                {machineOptions.map((machine) => (
                  <option key={machine.code} value={machine.code}>
                    {machine.code} - {machine.name}
                  </option>
                ))}
              </select>
              <div className="text-xs font-semibold text-red-600">ORIGEN: VEOSAT</div>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Obra</span>
              <input
                value={selectedMachine.site}
                readOnly
                className="w-full rounded-xl border bg-muted/40 px-3 py-3 text-sm text-foreground"
              />
              <div className="text-xs font-semibold text-red-600">ORIGEN: VEOSAT</div>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Horas acumuladas</span>
              <input
                value={`${selectedMachine.currentHours} h`}
                readOnly
                className="w-full rounded-xl border bg-muted/40 px-3 py-3 text-sm text-foreground"
              />
              <div className="text-xs font-semibold text-red-600">DATO SINCRONIZADO DESDE VEOSAT</div>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Proximo umbral</span>
              <input
                value={`${selectedMachine.nextIntervalHours} h`}
                readOnly
                className="w-full rounded-xl border bg-muted/40 px-3 py-3 text-sm text-foreground"
              />
              <div className="text-xs font-semibold text-red-600">CALCULADO DESDE HORAS DE VEOSAT</div>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border bg-card">
          <div className="flex items-center gap-2 rounded-t-2xl bg-primary px-5 py-4 text-primary-foreground">
            <CalendarDays className="h-4 w-4" />
            <h2 className="text-base font-semibold">Campos generados automaticamente</h2>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Tipo de mantenimiento</span>
              <input
                value={`${selectedMachine.nextIntervalHours} h`}
                readOnly
                className="w-full rounded-xl border bg-muted/40 px-3 py-3 text-sm text-foreground"
              />
              <div className="text-xs font-semibold text-red-600">TIPO DE MANTENIMIENTO DEFINIDO POR INTERVALO HORARIO</div>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Estado inicial</span>
              <input
                value={getStatusLabel(automaticData.status)}
                readOnly
                className="w-full rounded-xl border bg-muted/40 px-3 py-3 text-sm text-foreground"
              />
              <div className="text-xs font-semibold text-red-600">CALCULADO AUTOMATICAMENTE SEGUN VENCIMIENTO</div>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Fecha programada</span>
              <input
                value={formatDate(automaticData.scheduledDate)}
                readOnly
                className="w-full rounded-xl border bg-muted/40 px-3 py-3 text-sm text-foreground"
              />
              <div className="text-xs font-semibold text-red-600">GENERADA DESDE REGLA DE MANTENIMIENTO</div>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Duracion estimada (h)</span>
              <input
                value={`${automaticData.estimatedDurationHours} h`}
                readOnly
                className="w-full rounded-xl border bg-muted/40 px-3 py-3 text-sm text-foreground"
              />
              <div className="text-xs font-semibold text-red-600">ORIGEN: REGLA PREVENTIVA</div>
            </label>

            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-foreground">Asignado a</span>
              <input
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
                placeholder="Asignacion por jefe de taller"
                className="w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
              />
              <div className="text-xs font-semibold text-red-600">ORIGEN: ASIGNACION MANUAL DEL JEFE DE TALLER</div>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border bg-card">
          <div className="flex items-center gap-2 rounded-t-2xl bg-primary px-5 py-4 text-primary-foreground">
            <ClipboardCheck className="h-4 w-4" />
            <h2 className="text-base font-semibold">Nota de planificacion</h2>
          </div>

          <div className="p-5">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Anota alcance, observaciones o material previsto."
              className="w-full rounded-2xl border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
        </section>
        </div>

        <div className="sticky bottom-0 z-10 mt-auto border-t bg-background/95 px-1 py-4 backdrop-blur">
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Crear mantenimiento en calendario
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function getAutomaticMaintenanceData(currentHours: number, nextIntervalHours: number) {
  const maintenanceType: MaintenanceType = 'custom'

  // VEOSAT auto-generation generates it to the present day as an "aviso"
  const status: MaintenanceStatus = 'due'
  const scheduledDate = new Date().toISOString().slice(0, 10)

  return {
    maintenanceType,
    status,
    scheduledDate,
    estimatedDurationHours:
      nextIntervalHours >= 3000 ? 10 :
      nextIntervalHours >= 2000 ? 9 :
      nextIntervalHours >= 1000 ? 6 :
      nextIntervalHours >= 500 ? 5 : 4,
  }
}

function getStatusLabel(status: MaintenanceStatus) {
  if (status === 'upcoming') return 'Proximo'
  if (status === 'due') return 'A realizar'
  if (status === 'overdue') return 'Atrasado'
  if (status === 'in_progress') return 'En curso'
  return 'Programado'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES')
}
