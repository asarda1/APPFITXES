import { useMemo, useState, type ReactNode } from 'react'
import { ArrowLeft, Briefcase, Building2, IdCard, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { createPersonnel } from '../../../src/data/mockDatabase'

const workerOptions = [
  {
    employeeCode: 'P1201',
    fullName: 'SERRANO GIL MARC',
    role: 'mechanic' as const,
    category: 'Mecánico',
    workshop: 'Taller Frares',
    email: 'p1201@jarpsa.local',
    phone: '+34 600 120 100',
    dni: 'P1201',
    hireDate: '2026-04-01',
  },
  {
    employeeCode: 'P1202',
    fullName: 'RUIZ CORTES ADRIA',
    role: 'mechanic' as const,
    category: 'Mecánico',
    workshop: 'Taller Frares',
    email: 'p1202@jarpsa.local',
    phone: '+34 600 120 200',
    dni: 'P1202',
    hireDate: '2026-04-01',
  },
  {
    employeeCode: 'P1203',
    fullName: 'LOPEZ MORENO IVAN',
    role: 'mechanic' as const,
    category: 'Mecánico',
    workshop: 'Taller Zaragoza',
    email: 'p1203@jarpsa.local',
    phone: '+34 600 120 300',
    dni: 'P1203',
    hireDate: '2026-04-01',
  },
]

export function NewPersonnelPage() {
  const navigate = useNavigate()
  const [workerCode, setWorkerCode] = useState(workerOptions[0].employeeCode)

  const selectedWorker = useMemo(
    () => workerOptions.find((worker) => worker.employeeCode === workerCode) ?? workerOptions[0],
    [workerCode]
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const [firstName, ...restName] = selectedWorker.fullName.split(' ')
    const lastName = restName.join(' ')

    createPersonnel({
      employee_code: selectedWorker.employeeCode,
      first_name: firstName,
      last_name: lastName,
      email: selectedWorker.email,
      phone: selectedWorker.phone,
      dni: selectedWorker.dni,
      role: selectedWorker.role,
      category: selectedWorker.category,
      workshop_location: selectedWorker.workshop,
      hire_date: selectedWorker.hireDate,
      status: 'active',
      availability_status: 'available',
      current_workload: 0,
      completed_tasks: 0,
      average_task_time: 0,
      total_worked_hours: 0,
      hourly_rate: 0,
      certifications: [],
      competencies: [],
      history: [
        {
          id: `hist-${selectedWorker.employeeCode.toLowerCase()}-1`,
          timestamp: new Date().toISOString(),
          action: 'Alta automática desde ERP',
          user_id: 'erp-sync',
          user_name: 'ERP',
          notes: 'Trabajador generado automáticamente desde el sistema maestro',
        },
      ],
    })

    navigate('/personnel')
  }

  return (
    <div className="flex min-h-0 flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          to="/personnel"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Generación automática desde ERP</h1>
          <p className="mt-1 text-muted-foreground">
            Simulación de alta automática de un nuevo trabajador con datos maestros sincronizados desde ERP.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-6">
        <section className="rounded-2xl border bg-card">
          <div className="flex items-center gap-2 rounded-t-2xl bg-primary px-5 py-4 text-primary-foreground">
            <UserPlus className="h-4 w-4" />
            <h2 className="text-base font-semibold">Datos sincronizados</h2>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2">
            <label className="space-y-2 text-sm md:col-span-2">
              <span className="font-medium text-foreground">Trabajador</span>
              <select
                value={workerCode}
                onChange={(event) => setWorkerCode(event.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
              >
                {workerOptions.map((worker) => (
                  <option key={worker.employeeCode} value={worker.employeeCode}>
                    {worker.employeeCode} - {worker.fullName}
                  </option>
                ))}
              </select>
              <div className="text-xs font-semibold text-red-600">ORIGEN: ERP</div>
            </label>

            <InfoField label="Nombre completo" value={selectedWorker.fullName} origin="ORIGEN: ERP" />
            <InfoField label="Código" value={selectedWorker.employeeCode} origin="ORIGEN: ERP" />
            <InfoField label="Puesto" value={selectedWorker.category} origin="ORIGEN: ERP" icon={<Briefcase className="h-4 w-4" />} />
            <InfoField label="Taller" value={selectedWorker.workshop} origin="ORIGEN: ERP" icon={<Building2 className="h-4 w-4" />} />
            <InfoField label="Email" value={selectedWorker.email} origin="ORIGEN: ERP" />
            <InfoField label="Teléfono" value={selectedWorker.phone} origin="ORIGEN: ERP" />
            <InfoField label="Documento" value={selectedWorker.dni} origin="ORIGEN: ERP" icon={<IdCard className="h-4 w-4" />} />
            <InfoField label="Fecha de alta" value={formatDate(selectedWorker.hireDate)} origin="ORIGEN: ERP" />
          </div>
        </section>

        <div className="sticky bottom-0 z-10 mt-auto border-t bg-background/95 px-1 py-4 backdrop-blur">
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Crear trabajador en personal
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function InfoField({
  label,
  value,
  origin,
  icon,
}: {
  label: string
  value: string
  origin: string
  icon?: ReactNode
}) {
  return (
    <label className="space-y-2 text-sm">
      <span className="flex items-center gap-2 font-medium text-foreground">
        {icon}
        {label}
      </span>
      <input
        value={value}
        readOnly
        className="w-full rounded-xl border bg-muted/40 px-3 py-3 text-sm text-foreground"
      />
      <div className="text-xs font-semibold text-red-600">{origin}</div>
    </label>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES')
}
