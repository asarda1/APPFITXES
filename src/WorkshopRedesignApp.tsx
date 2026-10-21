import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { WorkshopShell } from './components/WorkshopShell'
import { ModulePage } from './pages/ModulePage'
import { MachineryModulePage } from './pages/MachineryModulePage'
import { MachineryDetailPage } from './pages/MachineryDetailPage'
import { MachinerySecondaryPage } from './pages/MachinerySecondaryPage'
import { IncidentsShellPage } from './pages/IncidentsShellPage'
import { IncidentsModulePage } from './pages/IncidentsModulePage'
import { NewIncidentWorkshopPage } from './pages/NewIncidentWorkshopPage'
import { IncidentDetailWorkshopPage } from './pages/IncidentDetailWorkshopPage'
import { modules } from './modules'
import { PreventiveDashboard } from '../../src/pages/maintenance/PreventiveDashboard'
import { PreventiveList } from '../../src/pages/maintenance/PreventiveList'
import { PreventiveDetail } from '../../src/pages/maintenance/PreventiveDetail'
import { MaintenanceCalendarPage } from './pages/MaintenanceCalendarPage'
import { NewMaintenancePage } from './pages/NewMaintenancePage'
import { MaintenanceDetailPage } from './pages/MaintenanceDetailPage'
import { MaintenanceListPage } from './pages/MaintenanceListPage'
import { MaintenanceHistoryPage } from './pages/MaintenanceHistoryPage'
import { MaintenanceSheetBuilderPage } from './pages/MaintenanceSheetBuilderPage'
import { MachineryTechnicalSheetBuilderPage } from './pages/MachineryTechnicalSheetBuilderPage'
import { IncidentsDashboard } from '../../src/pages/incidents/IncidentsDashboard'
import { IncidentsKanban } from '../../src/pages/incidents/IncidentsKanban'
import { WorkOrdersList } from '../../src/pages/workOrders/WorkOrdersList'
import { WorkOrdersDashboard } from '../../src/pages/workOrders/WorkOrdersDashboard'
import { NewWorkOrder } from '../../src/pages/workOrders/NewWorkOrder'
import { WorkOrdersKanban } from '../../src/pages/workOrders/WorkOrdersKanban'
import { WorkOrderDetail } from '../../src/pages/workOrders/WorkOrderDetail'
import { WorkOrdersWorkshopPage } from './pages/WorkOrdersWorkshopPage'
import { WorkOrderTimerPage } from './pages/WorkOrderTimerPage'
import PersonnelPage from '../../src/pages/Personnel'
import PersonnelDetail from '../../src/pages/personnel/PersonnelDetail'
import PersonnelAvailabilityCalendar from '../../src/pages/personnel/PersonnelAvailabilityCalendar'
import { NewPersonnelPage } from './pages/NewPersonnelPage'
import InventoryPage from '../../src/pages/Inventory'
import SuppliersPage from '../../src/pages/Suppliers'

export function WorkshopRedesignApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<WorkshopShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/assets/:assetId" element={<AssetsAliasRedirect />} />
          <Route
            path="/assets-and-machinery/technical-sheet-builder"
            element={<MachineryTechnicalSheetBuilderPage />}
          />
          <Route
            path="/assets-and-machinery/:assetId/:section"
            element={<MachinerySecondaryPage />}
          />
          <Route path="/assets-and-machinery/:assetId" element={<MachineryDetailPage />} />
          <Route path="/personnel" element={<PersonnelPage />} />
          <Route path="/personnel/new" element={<NewPersonnelPage />} />
          <Route path="/personnel/availability" element={<PersonnelAvailabilityCalendar />} />
          <Route path="/personnel/:id" element={<PersonnelDetail />} />
          <Route path="/work-orders" element={<WorkOrdersWorkshopPage mode="open" />} />
          <Route path="/work-orders/history" element={<WorkOrdersWorkshopPage mode="history" />} />
          <Route path="/inventory-and-spare-parts" element={<InventoryPage />} />
          <Route path="/inventory-and-spare-parts/proveedores" element={<SuppliersPage />} />
          <Route path="/work-orders/list-original" element={<WorkOrdersList />} />
          <Route path="/work-orders/dashboard" element={<WorkOrdersDashboard />} />
          <Route path="/work-orders/new" element={<NewWorkOrder />} />
          <Route path="/work-orders/kanban" element={<WorkOrdersKanban />} />
          <Route path="/work-orders/:id/timer" element={<WorkOrderTimerPage />} />
          <Route path="/work-orders/:id" element={<WorkOrderDetail />} />
          <Route path="/maintenance" element={<Navigate to="/maintenance/preventive" replace />} />
          <Route path="/maintenance/dashboard" element={<Navigate to="/maintenance/preventive" replace />} />
          <Route path="/maintenance/preventive" element={<PreventiveDashboard />} />
          <Route path="/maintenance/preventive/list" element={<MaintenanceListPage />} />
          <Route path="/maintenance/preventive/calendar" element={<MaintenanceCalendarPage />} />
          <Route path="/maintenance/preventive/history" element={<MaintenanceHistoryPage />} />
          <Route path="/maintenance/preventive/sheet-builder" element={<MaintenanceSheetBuilderPage />} />
          <Route path="/maintenance/preventive/new" element={<NewMaintenancePage />} />
          <Route path="/maintenance/preventive/workshop/:id" element={<MaintenanceDetailPage />} />
          <Route path="/maintenance/preventive/:id" element={<PreventiveDetail />} />
          <Route path="/maintenance/corrective" element={<Navigate to="/incidents" replace />} />
          <Route path="/maintenance/corrective/new" element={<Navigate to="/incidents/new" replace />} />
          <Route path="/maintenance/corrective/:id" element={<Navigate to="/incidents" replace />} />
          <Route path="/incidents" element={<IncidentsShellPage />}>
            <Route index element={<IncidentsModulePage viewMode="calendar" />} />
            <Route path="list" element={<IncidentsModulePage viewMode="list" />} />
            <Route path="history" element={<IncidentsModulePage viewMode="history" />} />
            <Route path="dashboard" element={<IncidentsDashboard />} />
            <Route path="kanban" element={<IncidentsKanban />} />
            <Route path="new" element={<NewIncidentWorkshopPage />} />
            <Route path=":id" element={<IncidentDetailWorkshopPage />} />
          </Route>
          {modules.map((module) => (
            <Route
              key={module.slug}
              path={`/${module.slug}`}
              element={
                module.slug === 'assets-and-machinery' ? (
                  <MachineryModulePage />
                ) : module.slug === 'maintenance' ? (
                  <Navigate to="/maintenance/preventive" replace />
                ) : module.slug === 'incidents' ? (
                  <Navigate to="/incidents" replace />
                ) : module.slug === 'work-orders' ? (
                  <Navigate to="/work-orders" replace />
                ) : module.slug === 'staff' ? (
                  <Navigate to="/personnel" replace />
                ) : (
                  <ModulePage module={module} />
                )
              }
            />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function AssetsAliasRedirect() {
  const { assetId } = useParams()

  if (!assetId) {
    return <Navigate to="/assets-and-machinery" replace />
  }

  return <Navigate to={`/assets-and-machinery/${assetId}`} replace />
}
