import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  FileText,
  Search,
  Settings,
  TriangleAlert,
  Truck,
  XCircle,
} from 'lucide-react'

export type ViewMode = 'grid' | 'list'

export type WorkshopAsset = {
  id: string
  internalCode: string
  family: string
  brand: string
  model: string
  registration: string
  acquisitionDate: string
  location: string
  serialNumber: string
  acquisitionCost: string
  salePrice: string
  currentHours: string
  fuelType: string
  accumulatedExpenses: string
  status: string
  photo: string
  documentationStatus: 'Al día' | 'Actualizar' | 'Pendiente'
  documents: Array<{
    name: string
    href: string
    linked: boolean
  }>
}

const defaultAssetDocuments: WorkshopAsset['documents'] = [
  { name: 'CE', href: '#', linked: false },
  { name: 'Ficha técnica', href: '#', linked: false },
  { name: 'ITV', href: '#', linked: false },
  { name: 'Permiso de circulación', href: '#', linked: false },
  { name: 'Seguro', href: '#', linked: false },
  { name: 'Impuesto de circulación', href: '#', linked: false },
  { name: 'Manual de usuario', href: '#', linked: false },
  { name: 'Declaración de conformidad', href: '#', linked: false },
]

export const workshopAssets: WorkshopAsset[] = [
  {
    id: 'asset-20051',
    internalCode: '20051',
    family: 'Tractora',
    brand: 'Mercedes',
    model: 'Actros 4225 NFR',
    registration: '20051',
    acquisitionDate: '2021-01-10',
    location: 'Taller Frares',
    serialNumber: 'MB-20051',
    acquisitionCost: '0,00 €',
    salePrice: '0,00 €',
    currentHours: '0 h',
    fuelType: 'Diesel',
    accumulatedExpenses: '0,00 €',
    status: 'Operativa',
    photo: 'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=900&q=80',
    documentationStatus: 'Al día',
    documents: defaultAssetDocuments,
  },
  {
    id: 'asset-21027',
    internalCode: '21027',
    family: 'Camión articulado',
    brand: 'Volvo',
    model: 'A30G',
    registration: '21027',
    acquisitionDate: '2020-06-15',
    location: 'Taller Frares',
    serialNumber: 'VOL-21027',
    acquisitionCost: '0,00 €',
    salePrice: '0,00 €',
    currentHours: '0 h',
    fuelType: 'Diesel',
    accumulatedExpenses: '0,00 €',
    status: 'Operativa',
    photo: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=80',
    documentationStatus: 'Al día',
    documents: defaultAssetDocuments,
  },
  {
    id: 'asset-52015',
    internalCode: '52015',
    family: 'Minicargadora',
    brand: 'Case',
    model: 'SR 210B',
    registration: '52015',
    acquisitionDate: '2019-03-01',
    location: 'Taller Frares',
    serialNumber: 'CAS-52015',
    acquisitionCost: '0,00 €',
    salePrice: '0,00 €',
    currentHours: '0 h',
    fuelType: 'Diesel',
    accumulatedExpenses: '0,00 €',
    status: 'Operativa',
    photo: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=80',
    documentationStatus: 'Al día',
    documents: defaultAssetDocuments,
  },
  {
    id: 'asset-54014',
    internalCode: '54014',
    family: 'Rodillo tándem asfalto',
    brand: 'Bomag',
    model: 'BW120',
    registration: '54014',
    acquisitionDate: '2018-09-20',
    location: 'Taller Frares',
    serialNumber: 'BOM-54014',
    acquisitionCost: '0,00 €',
    salePrice: '0,00 €',
    currentHours: '0 h',
    fuelType: 'Diesel',
    accumulatedExpenses: '0,00 €',
    status: 'Operativa',
    photo: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=80',
    documentationStatus: 'Al día',
    documents: defaultAssetDocuments,
  },
  {
    id: 'asset-55006',
    internalCode: '55006',
    family: 'Compactador neumático',
    brand: 'Hamm',
    model: 'HP280i',
    registration: '55006',
    acquisitionDate: '2019-11-05',
    location: 'Taller Frares',
    serialNumber: 'HAM-55006',
    acquisitionCost: '0,00 €',
    salePrice: '0,00 €',
    currentHours: '0 h',
    fuelType: 'Diesel',
    accumulatedExpenses: '0,00 €',
    status: 'Operativa',
    photo: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=80',
    documentationStatus: 'Al día',
    documents: defaultAssetDocuments,
  },
  {
    id: 'asset-56011',
    internalCode: '56011',
    family: 'Extendedora',
    brand: 'Vögele',
    model: '1900-5i X',
    registration: '56011',
    acquisitionDate: '2022-04-12',
    location: 'Taller Frares',
    serialNumber: 'VOG-56011',
    acquisitionCost: '0,00 €',
    salePrice: '0,00 €',
    currentHours: '0 h',
    fuelType: 'Diesel',
    accumulatedExpenses: '0,00 €',
    status: 'Operativa',
    photo: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=80',
    documentationStatus: 'Al día',
    documents: defaultAssetDocuments,
  },
  {
    id: 'asset-57010',
    internalCode: '57010',
    family: 'Fresadora',
    brand: 'Wirtgen',
    model: 'W210Fi',
    registration: '57010',
    acquisitionDate: '2021-07-30',
    location: 'Taller Frares',
    serialNumber: 'WIR-57010',
    acquisitionCost: '0,00 €',
    salePrice: '0,00 €',
    currentHours: '0 h',
    fuelType: 'Diesel',
    accumulatedExpenses: '0,00 €',
    status: 'Operativa',
    photo: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=900&q=80',
    documentationStatus: 'Al día',
    documents: defaultAssetDocuments,
  },
]

const basicFieldFilters = [
  { key: 'all', label: 'Todos los campos básicos' },
  { key: 'family', label: 'Familia' },
  { key: 'registration', label: 'Matrícula' },
  { key: 'acquisitionDate', label: 'Fecha de adquisición' },
  { key: 'location', label: 'Ubicación' },
  { key: 'brand', label: 'Marca' },
  { key: 'serialNumber', label: 'Número de serie' },
  { key: 'acquisitionCost', label: 'Coste de adquisición' },
  { key: 'currentHours', label: 'Horas acumuladas' },
  { key: 'model', label: 'Modelo' },
  { key: 'fuelType', label: 'Combustible' },
  { key: 'accumulatedExpenses', label: 'Gastos acumulados' },
  { key: 'status', label: 'Estado' },
] as const

export function MachineryModulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [selectedFieldFilters, setSelectedFieldFilters] = useState<
    Array<Exclude<(typeof basicFieldFilters)[number]['key'], 'all'>>
  >([])
  const [showFieldDropdown, setShowFieldDropdown] = useState(false)

  const acquisitionYears = useMemo(
    () => Array.from(new Set(workshopAssets.map((asset) => asset.acquisitionDate.slice(0, 4)))).sort(),
    [],
  )
  const selectedField = useMemo(
    () =>
      selectedFieldFilters.length === 1
        ? basicFieldFilters.find((field) => field.key === selectedFieldFilters[0]) ?? basicFieldFilters[0]
        : basicFieldFilters[0],
    [selectedFieldFilters],
  )
  const activeFieldOptions = useMemo(
    () => basicFieldFilters.filter((field) => field.key !== 'all' && selectedFieldFilters.includes(field.key)),
    [selectedFieldFilters],
  )

  const filteredAssets = useMemo(() => {
    return workshopAssets.filter((asset) => {
      const matchesYear = yearFilter === 'all' || asset.acquisitionDate.startsWith(yearFilter)

      const searchableText =
        selectedFieldFilters.length === 0
          ? [
              asset.internalCode,
              asset.family,
              asset.registration,
              asset.acquisitionDate,
              asset.location,
              asset.brand,
              asset.serialNumber,
              asset.acquisitionCost,
              asset.currentHours,
              asset.model,
              asset.fuelType,
              asset.accumulatedExpenses,
              asset.status,
            ]
              .join(' ')
              .toLowerCase()
          : selectedFieldFilters
              .map((fieldKey) => String(asset[fieldKey]).toLowerCase())
              .join(' ')

      const matchesSearch =
        searchTerm.trim() === '' || searchableText.includes(searchTerm.trim().toLowerCase())

      return matchesYear && matchesSearch
    })
  }, [searchTerm, selectedFieldFilters, yearFilter])

  const statusCards = useMemo(() => {
    const counts = {
      total: filteredAssets.length,
      operational: filteredAssets.filter((asset) => asset.status === 'Operativa').length,
      scheduledReview: filteredAssets.filter(
        (asset) => asset.status === 'Operativa - revisión programada',
      ).length,
      workshopWarning: filteredAssets.filter(
        (asset) => asset.status === 'Problema detectado - Acudir al taller',
      ).length,
      broken: filteredAssets.filter((asset) => asset.status === 'Averiada').length,
      maintenance: filteredAssets.filter((asset) => asset.status === 'En mantenimiento').length,
    }

    return [
      {
        label: 'Total',
        value: counts.total,
        icon: Truck,
        border: 'border-slate-400',
        text: 'text-slate-700',
        soft: 'bg-slate-50',
      },
      {
        label: 'Operativa',
        value: counts.operational,
        icon: CheckCircle2,
        border: 'border-emerald-300',
        text: 'text-emerald-700',
        soft: 'bg-emerald-50',
      },
      {
        label: 'Operativa - Revisión programada',
        value: counts.scheduledReview,
        icon: Calendar,
        border: 'border-blue-300',
        text: 'text-blue-700',
        soft: 'bg-blue-50',
      },
      {
        label: 'Problema detectado - Acudir al taller',
        value: counts.workshopWarning,
        icon: TriangleAlert,
        border: 'border-amber-300',
        text: 'text-amber-700',
        soft: 'bg-amber-50',
      },
      {
        label: 'Averiada',
        value: counts.broken,
        icon: XCircle,
        border: 'border-red-300',
        text: 'text-red-700',
        soft: 'bg-red-50',
      },
      {
        label: 'En mantenimiento',
        value: counts.maintenance,
        icon: Settings,
        border: 'border-violet-300',
        text: 'text-violet-700',
        soft: 'bg-violet-50',
      },
    ]
  }, [filteredAssets])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded p-2 transition-colors ${
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              title="Vista cuadrícula"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-2 transition-colors ${
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              title="Vista lista"
            >
              <List className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <Link
              to="/assets-and-machinery/technical-sheet-builder"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              title="Crear ficha técnica / especificaciones"
            >
              <FileText className="h-4 w-4" />
              Crear ficha técnica
            </Link>
            <div className="relative min-w-[260px] max-w-[420px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={
                  selectedFieldFilters.length === 0
                    ? 'Buscar en todos los campos básicos...'
                    : selectedFieldFilters.length === 1
                      ? `Buscar en ${selectedField.label.toLowerCase()}...`
                      : 'Buscar en los campos seleccionados...'
                }
                className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="bg-transparent focus:outline-none"
              >
                <option value="all">Año de adquisición</option>
                {acquisitionYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFieldDropdown((current) => !current)}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span>
                  {selectedFieldFilters.length === 0
                    ? 'Todos los campos básicos'
                    : `${selectedFieldFilters.length} campo${selectedFieldFilters.length !== 1 ? 's' : ''}`}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {showFieldDropdown && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border bg-card shadow-lg">
                  <div className="max-h-80 overflow-y-auto p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFieldFilters([])
                        setShowFieldDropdown(false)
                      }}
                      className={`mb-1 flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                        selectedFieldFilters.length === 0 ? 'bg-muted font-medium' : ''
                      }`}
                    >
                      <span>Todos los campos básicos</span>
                      {selectedFieldFilters.length === 0 ? <span>✓</span> : null}
                    </button>
                    {basicFieldFilters
                      .filter((field) => field.key !== 'all')
                      .map((field) => {
                        const isSelected = selectedFieldFilters.includes(field.key)
                        return (
                          <button
                            key={field.key}
                            type="button"
                            onClick={() => {
                              setSelectedFieldFilters((current) =>
                                current.includes(field.key)
                                  ? current.filter((item) => item !== field.key)
                                  : [...current, field.key],
                              )
                            }}
                            className={`mb-1 flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                              isSelected ? 'bg-muted font-medium' : ''
                            }`}
                          >
                            <span>{field.label}</span>
                            {isSelected ? <span>✓</span> : null}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {selectedFieldFilters.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFieldOptions.map((field) => (
              <button
                key={field.key}
                type="button"
                onClick={() =>
                  setSelectedFieldFilters((current) => current.filter((item) => item !== field.key))
                }
                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                {field.label} ×
              </button>
            ))}
          </div>
        ) : null}

        {selectedFieldFilters.length > 0 ? (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Búsqueda por campo
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={
                  selectedFieldFilters.length === 1
                    ? `Buscar contenido en ${selectedField.label.toLowerCase()}...`
                    : 'Buscar contenido en los campos seleccionados...'
                }
                className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {statusCards.map((card) => {
          const Icon = card.icon
          return (
            <article
              key={card.label}
              className={`rounded-2xl border-2 bg-card p-5 ${card.border} ${card.soft}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={`text-4xl font-bold ${card.text}`}>{card.value}</div>
                  <div className={`mt-2 text-sm font-semibold ${card.text}`}>{card.label}</div>
                </div>
                <div className={`rounded-xl p-3 ${card.soft}`}>
                  <Icon className={`h-5 w-5 ${card.text}`} />
                </div>
              </div>
            </article>
          )
        })}
      </section>

      {viewMode === 'grid' ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssets.map((asset) => (
            <Link
              key={asset.id}
              to={`/assets-and-machinery/${asset.id}`}
              className="rounded-xl border bg-card p-4 transition-colors hover:border-primary hover:bg-primary/5"
            >
              <div className="font-semibold">{asset.internalCode}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {asset.family} Â· {asset.brand} {asset.model}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatSpanishDate(asset.acquisitionDate)} Â· {asset.location}
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Familia</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3">Matrícula</th>
                <th className="px-4 py-3">Adquisición</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="border-t transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/assets-and-machinery/${asset.id}`} className="hover:text-primary">
                      {asset.internalCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{asset.family}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {asset.brand} {asset.model}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{asset.registration}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatSpanishDate(asset.acquisitionDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{asset.location}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{asset.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

function formatSpanishDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('es-ES')
}
