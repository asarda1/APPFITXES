export function MachineryTechnicalSheetBuilderPage() {
  return (
    <div className="flex min-h-[70vh] flex-col bg-gradient-to-b from-[#f3f4f6] via-[#f8fafc] to-white p-4">
      <div className="h-[calc(100vh-80px)] min-h-[820px] overflow-hidden rounded-2xl border border-[#f2a900]/25 bg-white shadow-sm">
        <iframe
          title="CreaciÃ³n de fichas tÃ©cnicas"
          src="/machinery-spec-sheet-builder/ficha-tecnica.html"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  )
}


