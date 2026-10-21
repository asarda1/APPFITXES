import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  ChevronRight,
  CircleHelp,
  Flame,
  Save,
  ShieldAlert,
  TriangleAlert,
  Wrench,
} from 'lucide-react'
import { createBreakdown, getActiveSites, MOCK_ASSETS } from '../../../src/data/mockDatabase'
import { createWorkshopNotification } from '../data/workshopNotifications'
import type { BreakdownSeverity, BreakdownType } from '../../../src/types/correctiveMaintenance'

type ReporterIntent = 'minor_notice' | 'review_issue' | 'critical_breakdown'
type Step = 1 | 2 | 3
type YesNo = '' | 'yes' | 'no'
type WorkStatus = '' | 'ok' | 'limited' | 'stopped'
type ProblemKey =
  | 'no_start'
  | 'stopped_working'
  | 'alarm'
  | 'leak'
  | 'strange_noise'
  | 'loss_power'
  | 'part_not_working'
  | 'damage'
  | 'other_problem'

type FormState = {
  machineId: string
  siteId: string
  problemKey: ProblemKey | ''
  workStatus: WorkStatus
  description: string
  mediaAttached: YesNo
  noStartContact: YesNo
  noStartAttempt: YesNo
  noStartWorkedToday: YesNo
  stopMode: '' | 'sudden' | 'progressive'
  stopAlarm: YesNo
  stopRestart: YesNo
  leakActive: YesNo
  leakLevel: '' | 'stain' | 'puddle'
  leakKeepsWorking: YesNo
  powerContext: '' | 'avance' | 'carga' | 'fresado' | 'extendido' | 'compactacion' | 'otro'
  powerContinuous: '' | 'continuous' | 'sporadic'
  powerWorse: YesNo
  partName: string
  partStopsWork: YesNo
  partIntermittent: YesNo
}

const initialState: FormState = {
  machineId: '',
  siteId: '',
  problemKey: '',
  workStatus: '',
  description: '',
  mediaAttached: '',
  noStartContact: '',
  noStartAttempt: '',
  noStartWorkedToday: '',
  stopMode: '',
  stopAlarm: '',
  stopRestart: '',
  leakActive: '',
  leakLevel: '',
  leakKeepsWorking: '',
  powerContext: '',
  powerContinuous: '',
  powerWorse: '',
  partName: '',
  partStopsWork: '',
  partIntermittent: '',
}

const symptomCards: Array<{
  key: ProblemKey
  label: string
  description: string
  icon: typeof Wrench
  type: BreakdownType
  title: string
}> = [
  { key: 'no_start', label: 'No arranca', description: 'No enciende o no responde', icon: Flame, type: 'electrical', title: 'La maquina no arranca' },
  { key: 'stopped_working', label: 'Se ha parado trabajando', description: 'Se ha detenido durante la tarea', icon: TriangleAlert, type: 'motor', title: 'La maquina se ha parado trabajando' },
  { key: 'alarm', label: 'Sale una alarma o aviso', description: 'Hay testigo, error o mensaje', icon: TriangleAlert, type: 'electronic', title: 'Hay alarma o aviso en maquina' },
  { key: 'leak', label: 'Pierde aceite / gasoil / hidraulico', description: 'Se ve fuga o mancha', icon: ShieldAlert, type: 'hydraulic', title: 'Perdida de liquido en maquina' },
  { key: 'strange_noise', label: 'Hace un ruido raro', description: 'Golpe, chirrido o sonido anomalo', icon: CircleHelp, type: 'other', title: 'Ruido raro en maquina' },
  { key: 'loss_power', label: 'No tiene fuerza / va lenta', description: 'Trabaja pero con menos rendimiento', icon: Wrench, type: 'motor', title: 'La maquina ha perdido fuerza' },
  { key: 'part_not_working', label: 'No funciona una parte', description: 'Brazo, tolva, regla u otra parte', icon: Wrench, type: 'other', title: 'No funciona una parte de la maquina' },
  { key: 'damage', label: 'Se ha roto o golpeado algo', description: 'Hay dano visible o golpe', icon: ShieldAlert, type: 'structure', title: 'Rotura o golpe en maquina' },
  { key: 'other_problem', label: 'Otro problema', description: 'Hay un problema que no encaja arriba', icon: CircleHelp, type: 'other', title: 'Otro problema en maquina' },
]

export function NewIncidentWorkshopPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialState)
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const sites = useMemo(() => getActiveSites(), [])
  const selectedMachine = MOCK_ASSETS.find((asset) => asset.id === form.machineId)
  const selectedSite = sites.find((site) => site.id === form.siteId)
  const selectedProblem = symptomCards.find((item) => item.key === form.problemKey)
  const triage = getTriageResult(form)
  const mediaRequired = triage.intent === 'critical_breakdown' && (form.problemKey === 'alarm' || form.problemKey === 'leak' || form.problemKey === 'damage')

  const goNext = () => {
    if (step === 1 && !form.machineId) {
      setError('Selecciona la maquina para continuar.')
      return
    }

    if (step === 2) {
      if (!form.problemKey || !form.workStatus) {
        setError('Marca el sintoma y si la maquina puede seguir trabajando.')
        return
      }

      if (!validateDynamicQuestions(form)) {
        setError('Responde las preguntas cortas antes de continuar.')
        return
      }
    }

    setError('')
    setStep((current) => (current === 3 ? current : ((current + 1) as Step)))
  }

  const handleCreateIncident = () => {
    if (!selectedMachine || !selectedProblem) {
      setError('Falta seleccionar la maquina o el sintoma.')
      return
    }

    if (mediaRequired && form.mediaAttached !== 'yes') {
      setError('En este caso hace falta adjuntar foto o video antes de enviar el aviso.')
      return
    }

    setSubmitting(true)
    setError('')

    const now = new Date()
    const sequence = String(now.getTime()).slice(-4)
    const code = `AVR-${now.getFullYear()}-${sequence}`

    const createdBreakdown = createBreakdown({
      code,
      machine_id: selectedMachine.id,
      machine_code: selectedMachine.internal_code,
      machine_name: `${selectedMachine.brand} ${selectedMachine.model}`,
      machine_type: selectedMachine.asset_type,
      site_id: selectedSite?.id,
      site_name: selectedSite?.title ?? selectedMachine.location,
      breakdown_type: selectedProblem.type,
      severity: triage.severity,
      status: 'reported',
      title: selectedProblem.title,
      description: buildDescription(form, triage.intent),
      symptoms: [],
      is_operational: form.workStatus !== 'stopped',
      safety_risk: form.leakActive === 'yes',
      requires_immediate_attention: triage.intent === 'critical_breakdown',
      current_hours: selectedMachine.current_hours,
      current_kilometers: selectedMachine.current_km,
      reported_at: now.toISOString(),
      reported_by: 'workshop-redesign-user',
      reported_by_name: 'Taller',
      reported_location: 'site',
      estimated_cost: 0,
      is_recurrent: false,
      was_successful: false,
      timeline: [
        {
          id: `timeline-${now.getTime()}`,
          event_type: 'reported',
          description: `Aviso movil clasificado como ${translateIntent(triage.intent)}.`,
          user_name: 'Taller',
          created_at: now.toISOString(),
        },
      ],
    })

    createWorkshopNotification({
      title: 'Nuevo reporte de incidencia',
      message: `${createdBreakdown.code} · ${createdBreakdown.machine_code} · ${createdBreakdown.site_name ?? 'Sin obra'}`,
      href: `/incidents/${createdBreakdown.id}`,
      sourceModule: 'incidents',
    })

    navigate('/incidents')
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[460px] rounded-[36px] border-8 border-slate-900 bg-slate-950 p-2 shadow-2xl">
        <div className="overflow-hidden rounded-[24px] bg-background">
          <div className="flex items-center justify-between bg-slate-900 px-5 py-3 text-xs font-medium text-white">
            <span>7:45</span>
            <span className="h-1.5 w-16 rounded-full bg-white/80" />
            <span>4G 96%</span>
          </div>

          <div className="h-[760px] overflow-y-auto bg-gradient-to-b from-amber-50 to-background">
            <div className="space-y-5 p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/incidents')}
                  className="mt-1 rounded-2xl border bg-white p-3 transition-colors hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Reporte movil</div>
                  <h3 className="mt-1 text-2xl font-bold leading-tight">
                    {step === 1 && 'Tengo un problema con una maquina'}
                    {step === 2 && 'Que le pasa a la maquina'}
                    {step === 3 && 'Anadir informacion y enviar'}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step === 1 && 'Selecciona la maquina para continuar'}
                    {step === 2 && 'Marca lo que ves, no hace falta saber la causa'}
                    {step === 3 && 'Revisa el aviso antes de enviarlo'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className={`rounded-2xl px-3 py-2 text-center text-xs font-semibold ${
                      step === item ? 'bg-primary text-primary-foreground' : 'bg-white text-muted-foreground'
                    }`}
                  >
                    Paso {item}
                  </div>
                ))}
              </div>

              <div className="space-y-5 rounded-[28px] border bg-card p-4 shadow-sm">
                {step === 1 && (
                  <>
                    <div className="rounded-3xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                      Prioriza la maquina que estas usando ahora o la ultima que has utilizado.
                    </div>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium">Maquina</span>
                      <select
                        value={form.machineId}
                        onChange={(event) => setForm((current) => ({ ...current, machineId: event.target.value }))}
                        className="h-12 w-full rounded-2xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Seleccionar maquina</option>
                        {MOCK_ASSETS.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.internal_code} - {asset.brand} {asset.model}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm font-medium">Obra</span>
                      <select
                        value={form.siteId}
                        onChange={(event) => setForm((current) => ({ ...current, siteId: event.target.value }))}
                        className="h-12 w-full rounded-2xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Seleccionar obra</option>
                        {sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.code} - {site.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid gap-2">
                      <button type="button" className="rounded-2xl border px-4 py-3 text-left text-sm font-medium hover:bg-muted">
                        No encuentro la maquina
                      </button>
                      <button type="button" className="rounded-2xl border px-4 py-3 text-left text-sm font-medium hover:bg-muted">
                        No se cual es
                      </button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Que esta pasando</div>
                      <div className="space-y-3">
                        {symptomCards.map((item) => {
                          const Icon = item.icon
                          const selected = form.problemKey === item.key
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setForm((current) => ({ ...current, problemKey: item.key }))}
                              className={`w-full rounded-3xl border-2 p-4 text-left transition-all ${
                                selected
                                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                  : 'bg-background hover:border-primary/40 hover:bg-primary/5'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`rounded-2xl p-3 ${selected ? 'bg-white/20 text-white' : 'bg-muted'}`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold">{item.label}</div>
                                  <div className={`mt-1 text-sm ${selected ? 'text-white/90' : 'text-muted-foreground'}`}>
                                    {item.description}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <WorkStatusSelector
                      value={form.workStatus}
                      onChange={(value) => setForm((current) => ({ ...current, workStatus: value }))}
                    />

                    {renderDynamicQuestions(form, setForm)}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div className={`rounded-3xl border p-5 ${getIntentBoxClasses(triage.intent)}`}>
                      <div className="font-semibold">{getIntentTitle(triage.intent)}</div>
                      <div className="mt-2 text-sm">{getFinalMessage(triage.intent)}</div>
                    </div>

                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-3 rounded-3xl border bg-white px-4 py-4 text-sm font-semibold hover:bg-muted"
                    >
                      <Camera className="h-5 w-5" />
                      Hacer foto
                    </button>

                    <BinaryQuestion
                      label={mediaRequired ? 'Has adjuntado foto o video' : 'Has hecho foto o video'}
                      value={form.mediaAttached}
                      onChange={(value) => setForm((current) => ({ ...current, mediaAttached: value }))}
                    />

                    <label className="block space-y-2">
                      <span className="text-sm font-medium">Comentario</span>
                      <textarea
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        className="min-h-[110px] w-full rounded-3xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Describe brevemente que ha pasado o cuando empezo"
                      />
                    </label>

                    <div className="rounded-3xl border bg-muted/30 p-4 text-sm">
                      <div className="font-semibold text-foreground">Resumen del aviso</div>
                      <div className="mt-3 space-y-2 text-muted-foreground">
                        <div>Maquina: {selectedMachine ? `${selectedMachine.internal_code} - ${selectedMachine.brand} ${selectedMachine.model}` : 'Sin indicar'}</div>
                        <div>Sintoma: {selectedProblem?.label ?? 'Sin indicar'}</div>
                        <div>Puede seguir trabajando: {translateWorkStatus(form.workStatus)}</div>
                        <div>Foto: {translateAnswer(form.mediaAttached)}</div>
                        <div>Comentario: {form.description.trim() ? 'si' : 'no'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-3 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setStep((current) => (current === 1 ? current : ((current - 1) as Step)))}
                    className="w-full rounded-2xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Volver
                  </button>

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      Continuar
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreateIncident}
                      disabled={submitting}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {submitting ? 'Enviando aviso...' : 'Enviar aviso'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkStatusSelector({
  value,
  onChange,
}: {
  value: WorkStatus
  onChange: (value: WorkStatus) => void
}) {
  const options: Array<{ key: WorkStatus; label: string }> = [
    { key: 'ok', label: 'Si, sin problema' },
    { key: 'limited', label: 'Si, pero con limitaciones' },
    { key: 'stopped', label: 'No, esta parada' },
  ]

  return (
    <div className="space-y-3 rounded-3xl border p-4">
      <div className="text-sm font-medium">La maquina puede seguir trabajando</div>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
              value === option.key ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function renderDynamicQuestions(
  form: FormState,
  setForm: React.Dispatch<React.SetStateAction<FormState>>,
) {
  if (form.problemKey === 'no_start') {
    return (
      <div className="space-y-4">
        <BinaryQuestion label="Da contacto" value={form.noStartContact} onChange={(value) => setForm((c) => ({ ...c, noStartContact: value }))} />
        <BinaryQuestion label="Hace intento de arranque" value={form.noStartAttempt} onChange={(value) => setForm((c) => ({ ...c, noStartAttempt: value }))} />
        <BinaryQuestion label="Arrancaba antes hoy" value={form.noStartWorkedToday} onChange={(value) => setForm((c) => ({ ...c, noStartWorkedToday: value }))} />
      </div>
    )
  }

  if (form.problemKey === 'stopped_working') {
    return (
      <div className="space-y-4">
        <SelectQuestion
          label="Se ha parado de golpe o progresivo"
          value={form.stopMode}
          options={[
            { key: 'sudden', label: 'De golpe' },
            { key: 'progressive', label: 'Progresivo' },
          ]}
          onChange={(value) => setForm((c) => ({ ...c, stopMode: value as FormState['stopMode'] }))}
        />
        <BinaryQuestion label="Ha salido algun aviso" value={form.stopAlarm} onChange={(value) => setForm((c) => ({ ...c, stopAlarm: value }))} />
        <BinaryQuestion label="Se puede volver a arrancar" value={form.stopRestart} onChange={(value) => setForm((c) => ({ ...c, stopRestart: value }))} />
      </div>
    )
  }

  if (form.problemKey === 'leak') {
    return (
      <div className="space-y-4">
        <BinaryQuestion label="La fuga es activa ahora" value={form.leakActive} onChange={(value) => setForm((c) => ({ ...c, leakActive: value }))} />
        <SelectQuestion
          label="Hay charco o solo manchas"
          value={form.leakLevel}
          options={[
            { key: 'stain', label: 'Solo manchas' },
            { key: 'puddle', label: 'Hay charco' },
          ]}
          onChange={(value) => setForm((c) => ({ ...c, leakLevel: value as FormState['leakLevel'] }))}
        />
        <BinaryQuestion label="La maquina sigue funcionando" value={form.leakKeepsWorking} onChange={(value) => setForm((c) => ({ ...c, leakKeepsWorking: value }))} />
      </div>
    )
  }

  if (form.problemKey === 'loss_power') {
    return (
      <div className="space-y-4">
        <SelectQuestion
          label="En que trabajo lo notas"
          value={form.powerContext}
          options={[
            { key: 'avance', label: 'Avance o desplazamiento' },
            { key: 'carga', label: 'Carga o empuje' },
            { key: 'fresado', label: 'Fresado' },
            { key: 'extendido', label: 'Extendido' },
            { key: 'compactacion', label: 'Compactacion' },
            { key: 'otro', label: 'Otro' },
          ]}
          onChange={(value) => setForm((c) => ({ ...c, powerContext: value as FormState['powerContext'] }))}
        />
        <SelectQuestion
          label="Es continuo o puntual"
          value={form.powerContinuous}
          options={[
            { key: 'continuous', label: 'Continuo' },
            { key: 'sporadic', label: 'Puntual' },
          ]}
          onChange={(value) => setForm((c) => ({ ...c, powerContinuous: value as FormState['powerContinuous'] }))}
        />
        <BinaryQuestion label="Empeora con el uso" value={form.powerWorse} onChange={(value) => setForm((c) => ({ ...c, powerWorse: value }))} />
      </div>
    )
  }

  if (form.problemKey === 'part_not_working') {
    return (
      <div className="space-y-4 rounded-3xl border p-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium">Que parte no funciona</span>
          <input
            value={form.partName}
            onChange={(event) => setForm((c) => ({ ...c, partName: event.target.value }))}
            className="h-12 w-full rounded-2xl border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Brazo, tolva, regla, cinta..."
          />
        </label>
        <BinaryQuestion label="Impide trabajar" value={form.partStopsWork} onChange={(value) => setForm((c) => ({ ...c, partStopsWork: value }))} />
        <BinaryQuestion label="Funciona a ratos" value={form.partIntermittent} onChange={(value) => setForm((c) => ({ ...c, partIntermittent: value }))} />
      </div>
    )
  }

  if (form.problemKey === 'damage') {
    return (
      <div className="space-y-4">
        <BinaryQuestion label="Hay dano visible ahora" value={form.leakActive} onChange={(value) => setForm((c) => ({ ...c, leakActive: value }))} />
        <BinaryQuestion label="Impide trabajar" value={form.partStopsWork} onChange={(value) => setForm((c) => ({ ...c, partStopsWork: value }))} />
      </div>
    )
  }

  if (form.problemKey === 'alarm') {
    return (
      <div className="space-y-4">
        <BinaryQuestion label="La alarma sigue activa" value={form.stopAlarm} onChange={(value) => setForm((c) => ({ ...c, stopAlarm: value }))} />
        <BinaryQuestion label="Se puede seguir trabajando" value={form.stopRestart} onChange={(value) => setForm((c) => ({ ...c, stopRestart: value }))} />
      </div>
    )
  }

  return null
}

function SelectQuestion({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ key: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2 rounded-3xl border p-4">
      <div className="text-sm font-medium">{label}</div>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
              value === option.key ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function BinaryQuestion({
  label,
  value,
  onChange,
}: {
  label: string
  value: YesNo
  onChange: (value: 'yes' | 'no') => void
}) {
  return (
    <div className="space-y-3 rounded-3xl border p-4">
      <div className="text-sm font-medium">{label}</div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange('yes')}
          className={`flex-1 rounded-2xl border px-4 py-4 text-sm font-semibold transition-colors ${
            value === 'yes' ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          Si
        </button>
        <button
          type="button"
          onClick={() => onChange('no')}
          className={`flex-1 rounded-2xl border px-4 py-4 text-sm font-semibold transition-colors ${
            value === 'no' ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          No
        </button>
      </div>
    </div>
  )
}

function validateDynamicQuestions(form: FormState) {
  if (form.problemKey === 'no_start') {
    return !!form.noStartContact && !!form.noStartAttempt && !!form.noStartWorkedToday
  }
  if (form.problemKey === 'stopped_working') {
    return !!form.stopMode && !!form.stopAlarm && !!form.stopRestart
  }
  if (form.problemKey === 'leak') {
    return !!form.leakActive && !!form.leakLevel && !!form.leakKeepsWorking
  }
  if (form.problemKey === 'loss_power') {
    return !!form.powerContext && !!form.powerContinuous && !!form.powerWorse
  }
  if (form.problemKey === 'part_not_working') {
    return !!form.partName.trim() && !!form.partStopsWork && !!form.partIntermittent
  }
  if (form.problemKey === 'damage') {
    return !!form.leakActive && !!form.partStopsWork
  }
  if (form.problemKey === 'alarm') {
    return !!form.stopAlarm && !!form.stopRestart
  }
  return true
}

function getTriageResult(form: FormState): { intent: ReporterIntent; severity: BreakdownSeverity } {
  if (form.workStatus === 'stopped') {
    return { intent: 'critical_breakdown', severity: 'critical' }
  }

  if (form.problemKey === 'leak' && form.leakActive === 'yes' && form.leakLevel === 'puddle') {
    return { intent: 'critical_breakdown', severity: 'critical' }
  }

  if (form.problemKey === 'damage' && form.partStopsWork === 'yes') {
    return { intent: 'critical_breakdown', severity: 'critical' }
  }

  if (
    form.workStatus === 'limited' ||
    (form.problemKey === 'alarm' && form.stopAlarm === 'yes') ||
    (form.problemKey === 'loss_power' && form.powerWorse === 'yes') ||
    (form.problemKey === 'part_not_working' && form.partStopsWork === 'yes')
  ) {
    return { intent: 'review_issue', severity: 'moderate' }
  }

  return { intent: 'minor_notice', severity: 'low' }
}

function getIntentTitle(intent: ReporterIntent) {
  if (intent === 'critical_breakdown') return 'Avería registrada como máquina parada'
  if (intent === 'review_issue') return 'Incidencia registrada'
  return 'Aviso registrado'
}

function getFinalMessage(intent: ReporterIntent) {
  if (intent === 'critical_breakdown') return 'Taller avisado con prioridad.'
  if (intent === 'review_issue') return 'Taller revisara la maquina.'
  return 'La maquina puede seguir trabajando. Taller lo revisara.'
}

function getIntentBoxClasses(intent: ReporterIntent) {
  if (intent === 'critical_breakdown') return 'border-red-200 bg-red-50 text-red-800'
  if (intent === 'review_issue') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-blue-200 bg-blue-50 text-blue-800'
}

function translateIntent(intent: ReporterIntent) {
  if (intent === 'critical_breakdown') return 'averia grave'
  if (intent === 'review_issue') return 'incidencia a revisar'
  return 'aviso menor'
}

function translateAnswer(value: YesNo) {
  if (value === 'yes') return 'si'
  if (value === 'no') return 'no'
  return 'sin indicar'
}

function translateWorkStatus(value: WorkStatus) {
  if (value === 'ok') return 'si, sin problema'
  if (value === 'limited') return 'si, pero con limitaciones'
  if (value === 'stopped') return 'no, esta parada'
  return 'sin indicar'
}

function buildDescription(form: FormState, intent: ReporterIntent) {
  const parts = [
    `Clasificacion guiada: ${translateIntent(intent)}.`,
    `Puede trabajar: ${translateWorkStatus(form.workStatus)}.`,
    `Evidencia visual: ${translateAnswer(form.mediaAttached)}.`,
  ]

  if (form.description.trim()) {
    parts.push(`Nota operador: ${form.description.trim()}.`)
  }

  return parts.join(' ')
}
