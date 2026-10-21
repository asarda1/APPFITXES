import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, QrCode as QrCodeIcon, Play, Pause, StopCircle } from 'lucide-react';
import QRCode from 'qrcode.react'; // Necesitarás instalar esta librería: npm install qrcode.react

// Mock de datos de una Orden de Trabajo
const mockWorkOrders = [
  {
    id: 'OT-123',
    code: 'OT-123',
    type: 'Orden de mantenimiento',
    machine: 'Excavadora CAT-320',
    description: 'Revisión de 250 horas y cambio de filtros.',
    status: 'en curso',
    temporalControlId: 'tc-001', // ID del control temporal asociado
    assignedMechanics: ['Juan Pérez', 'María García'],
    startDate: '2024-03-10',
    estimatedCost: '1500 €',
    actualCost: '1200 €',
  },
  {
    id: 'OT-456',
    code: 'OT-456',
    type: 'Orden de reparación',
    machine: 'Camión Volvo FH',
    description: 'Reparación de sistema de frenos.',
    status: 'pendiente de material',
    temporalControlId: 'tc-002', // Otro ID de control temporal
    assignedMechanics: ['Pedro López'],
    startDate: '2024-03-12',
    estimatedCost: '800 €',
    actualCost: null,
  },
  {
    id: 'OT-789',
    code: 'OT-789',
    type: 'Orden de mantenimiento',
    machine: 'Generador Cummins',
    description: 'Mantenimiento preventivo anual.',
    status: 'abierta',
    temporalControlId: undefined, // Sin control temporal aún
    assignedMechanics: ['Ana Ruiz'],
    startDate: '2024-03-15',
    estimatedCost: '500 €',
    actualCost: null,
  },
];

export function WorkOrderDetailPage() {
  const { workOrderId } = useParams<{ workOrderId: string }>();
  const workOrder = mockWorkOrders.find((wo) => wo.id === workOrderId);

  if (!workOrder) {
    return <Navigate to="/work-orders" replace />;
  }

  // URL que el QR codificará para el control temporal
  const temporalControlUrl = workOrder.temporalControlId
    ? `/work-orders/time-control/${workOrder.temporalControlId}`
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/work-orders"
          className="rounded-lg border p-2 transition-colors hover:bg-gray-200"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Detalle de Orden de Trabajo</h1>
        <div className="w-10"></div> {/* Espaciador para centrar el título */}
      </div>

      <section className="bg-white rounded-xl shadow-md p-6 mb-6">
        <p className="text-sm text-gray-500 uppercase tracking-wide">OT: {workOrder.code}</p>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{workOrder.description}</h2>
        <p className="text-lg text-gray-700 mb-4">Máquina: {workOrder.machine}</p>
        <p className="text-md text-gray-600 mb-2">Tipo: {workOrder.type}</p>
        <p className="text-md text-gray-600 mb-2">Estado: {workOrder.status}</p>
        <p className="text-md text-gray-600 mb-2">Mecánicos asignados: {workOrder.assignedMechanics.join(', ')}</p>
        <p className="text-md text-gray-600 mb-4">Fecha de inicio: {workOrder.startDate}</p>

        {/* Sección del QR para Control Temporal */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <QrCodeIcon className="h-6 w-6 text-indigo-600" />
            Control Temporal (Móvil)
          </h3>
          {temporalControlUrl ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-700 text-center">
                Escanea este código QR con un dispositivo móvil para iniciar, pausar o detener el control de tiempo de esta tarea.
              </p>
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                {/*
                  IMPORTANTE: Para pruebas en desarrollo con un móvil, DEBES reemplazar 'TU_IP_LOCAL'
                  con la dirección IP de tu máquina de desarrollo (ej. 192.168.1.100).
                  Asegúrate de que tu móvil esté en la misma red Wi-Fi.
                  En un entorno de producción, `window.location.origin` funcionaría correctamente.
                  Si tu servidor de desarrollo usa un puerto diferente a 3000, ajústalo también.
                */}
                <QRCode value={`http://TU_IP_LOCAL:3000${temporalControlUrl}`} size={200} level="H" />
              </div>
              <Link
                to={temporalControlUrl}
                className="text-indigo-600 hover:underline text-sm mt-2"
              >
                Abrir control temporal (solo para pruebas en escritorio)
              </Link>
            </div>
          ) : (
            <p className="text-gray-600 italic">
              No hay un control temporal asociado a esta Orden de Trabajo.
              Se podría añadir un botón aquí para crear uno.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}