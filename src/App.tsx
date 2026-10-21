import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { MachineryTechnicalSheetBuilderPage } from './pages/MachineryTechnicalSheetBuilderPage'
import { MaintenanceSheetBuilderPage } from './pages/MaintenanceSheetBuilderPage'

function Home() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] p-6 md:p-10">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[#f2a900]/25 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-[#fff8e8] to-white px-6 py-8 md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Accesos directos</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-700">Propuesta taller: Fichas</h1>
          <p className="mt-2 text-sm text-slate-500">Selecciona el tipo de ficha que quieres crear.</p>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 md:p-10">
          <Link
            className="group rounded-2xl border border-[#f2a900]/35 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(242,169,0,0.20)]"
            to="/ficha-tecnica"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2a900]/15 text-[#b27b00]">
              FT
            </div>
            <h2 className="text-lg font-bold text-slate-800">Crear ficha técnica</h2>
            <p className="mt-1 text-sm text-slate-500">Especificaciones y datos técnicos de maquinaria.</p>
            <span className="mt-4 inline-flex rounded-lg bg-[#f2a900] px-3 py-1.5 text-sm font-semibold text-black transition group-hover:bg-[#e4a000]">
              Abrir
            </span>
          </Link>

          <Link
            className="group rounded-2xl border border-[#f2a900]/35 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(242,169,0,0.20)]"
            to="/ficha-mantenimiento"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2a900]/15 text-[#b27b00]">
              FM
            </div>
            <h2 className="text-lg font-bold text-slate-800">Crear ficha de mantenimiento</h2>
            <p className="mt-1 text-sm text-slate-500">Registro de operaciones y revisiones periódicas.</p>
            <span className="mt-4 inline-flex rounded-lg bg-[#f2a900] px-3 py-1.5 text-sm font-semibold text-black transition group-hover:bg-[#e4a000]">
              Abrir
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return <BrowserRouter><Routes><Route path="/" element={<Home />} /><Route path="/ficha-tecnica" element={<MachineryTechnicalSheetBuilderPage />} /><Route path="/ficha-mantenimiento" element={<MaintenanceSheetBuilderPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>
}
