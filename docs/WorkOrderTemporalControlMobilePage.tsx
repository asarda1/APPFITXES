import { useState, useEffect, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Play, Pause, StopCircle, QrCode, ArrowLeft } from 'lucide-react';

// Mock API calls - En un entorno real, esto sería una llamada a tu backend
const mockApi = {
  getTemporalControl: (id: string) => {
    // Simula la obtención de detalles del control temporal desde el backend
    // En un entorno real, aquí harías una llamada a tu API de backend para obtener el control temporal por su ID.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id,
          workOrderId: 'OT-123', // Usamos un ID de OT de ejemplo. En real, se obtendría del backend.
          description: `Control temporal para tarea ${id}`,
          status: 'idle', // Estado inicial simulado
          startTime: null,
          pauseTime: null,
          totalDuration: 0, // Duración inicial simulada
        });
      }, 500);
    });
  },
  updateTemporalControl: (id: string, updates: Partial<TemporalControl>) => {
    // Simula la actualización del estado y los tiempos del control en el backend
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Actualizando control temporal ${id} con:`, updates);
        resolve({ success: true });
      }, 300);
    });
  },
};

interface TemporalControl {
  id: string;
  workOrderId: string;
  description: string;
  status: 'idle' | 'running' | 'paused' | 'stopped';
  startTime: number | null;
  pauseTime: number | null;
  totalDuration: number; // en milisegundos
}

export function WorkOrderTemporalControlMobilePage() {
  const { temporalControlId } = useParams<{ temporalControlId: string }>();
  const [control, setControl] = useState<TemporalControl | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!temporalControlId) {
      setError('No se ha proporcionado un ID de control temporal.');
      setLoading(false);
      return;
    }

    const fetchControl = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await mockApi.getTemporalControl(temporalControlId);
        if (data) {
          setControl(data as TemporalControl);
          setElapsedTime(data.totalDuration);
          if (data.status === 'running' && data.startTime) {
            startTimer(data.startTime, data.totalDuration);
          }
        } else {
          setError('Control temporal no encontrado.');
        }
      } catch (err) {
        setError('Error al cargar el control temporal.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchControl();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [temporalControlId]);

  const startTimer = (initialStartTime: number, initialDuration: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setElapsedTime(initialDuration + (Date.now() - initialStartTime));
    }, 1000);
  };

  const handleAction = async (action: 'start' | 'pause' | 'stop') => {
    if (!control) return;

    let newStatus: TemporalControl['status'] = control.status;
    let newStartTime = control.startTime;
    let newPauseTime = control.pauseTime;
    let newTotalDuration = control.totalDuration;

    if (action === 'start') {
      if (control.status === 'idle' || control.status === 'stopped') {
        newStartTime = Date.now();
        newTotalDuration = 0; // Reiniciar duración si estaba inactivo o detenido
      } else if (control.status === 'paused') {
        // Reanudar desde pausa
        newStartTime = Date.now(); // Nueva hora de inicio para el segmento actual
        // totalDuration ya contiene el tiempo acumulado antes de la pausa
      }
      newStatus = 'running';
      startTimer(newStartTime!, newTotalDuration);
    } else if (action === 'pause') {
      if (control.status === 'running') {
        newPauseTime = Date.now();
        newTotalDuration = elapsedTime; // Capturar el tiempo transcurrido actual
        newStatus = 'paused';
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    } else if (action === 'stop') {
      if (control.status === 'running') {
        newTotalDuration = elapsedTime; // Capturar el tiempo transcurrido final
      } else if (control.status === 'paused') {
        // Si se detiene desde pausado, totalDuration ya es correcta
      }
      newStatus = 'stopped';
      newStartTime = null;
      newPauseTime = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setElapsedTime(newTotalDuration); // Asegurar que la visualización sea la final
    }

    const updatedControl = {
      ...control,
      status: newStatus,
      startTime: newStartTime,
      pauseTime: newPauseTime,
      totalDuration: newTotalDuration,
    };
    setControl(updatedControl);
    await mockApi.updateTemporalControl(control.id, {
      status: newStatus,
      startTime: newStartTime,
      pauseTime: newPauseTime,
      totalDuration: newTotalDuration,
    });
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    return [hours, minutes, seconds]
      .map((unit) => String(unit).padStart(2, '0'))
      .join(':');
  };

  if (loading) {
    return <div className="p-6 text-center">Cargando control temporal...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  if (!control) {
    return <Navigate to="/work-orders" replace />; // Esto no debería ocurrir si el error se maneja correctamente
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/work-orders/${control.workOrderId}`}
          className="rounded-lg border p-2 transition-colors hover:bg-gray-200"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Control Temporal</h1>
        <div className="w-10"></div> {/* Espaciador para centrar el título */}
      </div>

      <section className="bg-white rounded-xl shadow-md p-6 mb-6 flex-grow flex flex-col justify-center items-center">
        <QrCode className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-sm text-gray-500 uppercase tracking-wide">OT: {control.workOrderId}</p>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{control.description}</h2>
        <p className={`text-xl font-semibold mb-6 ${
          control.status === 'running' ? 'text-green-600' :
          control.status === 'paused' ? 'text-yellow-600' :
          control.status === 'stopped' ? 'text-red-600' : 'text-gray-600'
        }`}>
          Estado: {control.status === 'idle' ? 'Inactivo' :
                   control.status === 'running' ? 'En curso' :
                   control.status === 'paused' ? 'Pausado' : 'Detenido'}
        </p>

        <div className="text-6xl font-mono font-bold text-gray-900 mb-8">
          {formatTime(elapsedTime)}
        </div>

        <div className="flex gap-4 w-full justify-center">
          <button
            onClick={() => handleAction('start')}
            disabled={control.status === 'running'}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-colors ${
              control.status === 'running' ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            <Play className="h-5 w-5" />
            Iniciar
          </button>
          <button
            onClick={() => handleAction('pause')}
            disabled={control.status !== 'running'}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-colors ${
              control.status !== 'running' ? 'bg-yellow-300 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            <Pause className="h-5 w-5" />
            Pausar
          </button>
          <button
            onClick={() => handleAction('stop')}
            disabled={control.status === 'idle' || control.status === 'stopped'}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-colors ${
              control.status === 'idle' || control.status === 'stopped' ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            <StopCircle className="h-5 w-5" />
            Detener
          </button>
        </div>
      </section>

      <footer className="text-center text-gray-500 text-sm mt-6">
        Escanea el QR para controlar el tiempo de la tarea.
      </footer>
    </div>
  );
}