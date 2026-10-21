import { useState } from 'react';
import { PlusCircle, Save, XCircle } from 'lucide-react';

// Definición de un campo de maquinaria
interface MachineryField {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'date' | 'number';
  isCustom?: boolean; // Para identificar campos añadidos dinámicamente
}

export function MachineryCreationForm() {
  const [fields, setFields] = useState<MachineryField[]>([
    { id: 'marca', label: 'MARCA', value: '', type: 'text' },
    { id: 'modelo', label: 'MODELO', value: '', type: 'text' },
    { id: 'fechaCompra', label: 'FECHA DE COMPRA', value: '', type: 'date' },
    // ... otros campos predefinidos
  ]);

  const handleFieldChange = (id: string, newValue: string) => {
    setFields((prevFields) =>
      prevFields.map((field) =>
        field.id === id ? { ...field, value: newValue } : field
      )
    );
  };

  const addCustomField = () => {
    const newId = `custom-${Date.now()}`;
    setFields((prevFields) => [
      ...prevFields,
      {
        id: newId,
        label: 'NUEVO CAMPO', // Etiqueta inicial para el campo personalizado
        value: '',
        type: 'text',
        isCustom: true,
      },
    ]);
  };

  const removeCustomField = (id: string) => {
    setFields((prevFields) => prevFields.filter((field) => field.id !== id));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Datos de la maquinaria a guardar:', fields);
    // Aquí iría la lógica para enviar los datos al backend
    alert('Formulario enviado (ver consola para los datos)');
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Crear Ficha de Maquinaria</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {fields.map((field) => (
            <div key={field.id} className="relative">
              <label
                htmlFor={field.id}
                className="block text-sm font-bold uppercase text-gray-700 mb-1" // Estilo solicitado: negrita, mayúsculas
              >
                {field.label}
              </label>
              <input
                type={field.type}
                id={field.id}
                value={field.value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={`Introduce ${field.label.toLowerCase()}`}
              />
              {field.isCustom && (
                <button
                  type="button"
                  onClick={() => removeCustomField(field.id)}
                  className="absolute right-2 top-0 mt-8 text-red-500 hover:text-red-700"
                  title="Eliminar campo"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center border-t pt-6 mt-6">
          <button
            type="button"
            onClick={addCustomField}
            className="inline-flex items-center gap-2 rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Añadir Campo Personalizado
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-md hover:bg-indigo-700 transition-colors"
          >
            <Save className="h-5 w-5" />
            Guardar Maquinaria
          </button>
        </div>
      </form>
    </div>
  );
}