import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DocsManager({ initialDocs, isChunin }) {
  const [docs, setDocs] = useState(initialDocs || []);
  const [loading, setLoading] = useState(false);

  // ESTADOS DE INTERFAZ
  const [isFormOpen, setIsFormOpen] = useState(false); // Abrir formulario
  const [isEditMode, setIsEditMode] = useState(false); // Modo Borrar activado

  // --- AÑADIR DOC ---
  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target;
    const nombre = form.nombre.value;
    const url = form.url.value;

    const { data, error } = await supabase
      .from('documentos')
      .insert([{ nombre, url }])
      .select();

    if (!error && data) {
      setDocs([data[0], ...docs]);
      form.reset();
      setIsFormOpen(false); // Cerrar al terminar
    } else {
      alert('Error al guardar.');
    }
    setLoading(false);
  };

  // --- BORRAR DOC ---
  const handleDelete = async (id) => {
    // Doble confirmación visual
    if (!confirm('⚠️ ¿Seguro que quieres eliminar esta hoja de ruta?')) return;

    // UI Optimista: Lo quitamos ya de la lista
    setDocs(docs.filter(d => d.id !== id));
    await supabase.from('documentos').delete().eq('id', id);

    // Si nos quedamos sin docs, quitamos el modo edición
    if (docs.length <= 1) setIsEditMode(false);
  };

  return (
    <div className="pb-32 px-4 relative min-h-[50vh]">

      {/* --- BARRA DE HERRAMIENTAS (Solo Chunin) --- */}
      {isChunin && (
        <div className="flex justify-end items-center gap-2 mb-6 sticky top-0 z-20 py-2 bg-gradient-to-b from-slate-900 via-slate-900 to-transparent">

          {/* 1. BOTÓN MODO EDICIÓN (CANDADO) */}
          <button
            onClick={() => {
              setIsEditMode(!isEditMode);
              setIsFormOpen(false); // Si editas, cierra el form de añadir
            }}
            className={`
                    px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border
                    ${isEditMode
                ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }
                `}
          >
            {isEditMode ? '🔒 Terminar' : '✏️ Gestionar'}
          </button>

          {/* 2. BOTÓN NUEVA HOJA */}
          {!isEditMode && (
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg transition-transform active:scale-95 flex items-center gap-1"
            >
              {isFormOpen ? '✕ Cancelar' : '➕ Nueva'}
            </button>
          )}
        </div>
      )}

      {/* --- FORMULARIO DESPLEGABLE --- */}
      {isFormOpen && (
        <div className="bg-slate-800 p-4 rounded-xl border border-yellow-500/50 mb-6 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <h3 className="text-yellow-400 font-bold text-xs mb-3 uppercase tracking-wider">
            Subir Documento
          </h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <input
              name="nombre"
              placeholder="Título (Ej: Horarios Festi)"
              required
              autoComplete="off"
              className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-yellow-500 outline-none"
            />
            <input
              name="url"
              type="url"
              placeholder="Enlace (https://...)"
              required
              className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-blue-300 text-xs font-mono focus:border-yellow-500 outline-none"
            />
            <button disabled={loading} className="mt-1 bg-yellow-500 text-slate-900 font-bold py-3 rounded-lg shadow disabled:opacity-50">
              {loading ? 'Guardando...' : 'GUARDAR'}
            </button>
          </form>
        </div>
      )}

      {/* --- MENSAJE DE MODO EDICIÓN --- */}
      {isEditMode && (
        <div className="text-center mb-4 animate-bounce">
          <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-red-500/50">
            ⚠️ Modo Borrado Activo
          </span>
        </div>
      )}

      {/* --- LISTA DE DOCUMENTOS --- */}
      <div className="space-y-3">
        {docs.map((doc) => (
          <div key={doc.id} className="relative group animate-in fade-in duration-300">

            {/* LA TARJETA (Link) */}
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              // Si estamos editando, desactivamos el click en el enlace para no abrirlo sin querer
              onClick={(e) => isEditMode && e.preventDefault()}
              className={`
                        block p-4 rounded-xl border transition-all flex items-center shadow-lg
                        ${isEditMode
                  ? 'bg-red-900/10 border-red-500/50 cursor-default grayscale-[0.5]'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-700/80 active:scale-95'
                }
                    `}
            >
              <div className="bg-slate-900/50 p-3 rounded-lg mr-4 text-2xl">
                📄
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-md leading-tight truncate ${isEditMode ? 'text-red-200' : 'text-white'}`}>
                  {doc.nombre}
                </h4>
                {!isEditMode && (
                  <p className="text-blue-400 text-xs mt-1">Abrir enlace ↗</p>
                )}
              </div>

              {/* BOTÓN DE BORRAR (SOLO APARECE EN MODO EDICIÓN) */}
              {isEditMode && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Evita cualquier efecto burbuja
                    handleDelete(doc.id);
                  }}
                  className="ml-2 bg-red-600 text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/40 active:scale-90 transition-transform z-10"
                >
                  <span className="text-xl font-bold">✕</span>
                </button>
              )}
            </a>

          </div>
        ))}

        {docs.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <p className="text-5xl mb-4 grayscale">📭</p>
            <p>Carpeta vacía</p>
          </div>
        )}
      </div>

    </div>
  );
}