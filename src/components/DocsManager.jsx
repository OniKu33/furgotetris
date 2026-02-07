import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function DocsManager({ initialDocs, isChunin }) {
  const [docs, setDocs] = useState(initialDocs || []);
  const [loading, setLoading] = useState(false);

  // --- SOLO PARA CHUNIN: AÑADIR DOC ---
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!isChunin) return; // Seguridad extra

    setLoading(true);
    const form = e.target;
    const nombre = form.nombre.value;
    const url = form.url.value;

    const { data, error } = await supabase
      .from('documentos')
      .insert([{ nombre, url }])
      .select();

    if (!error && data) {
      setDocs([data[0], ...docs]); // Añadir al principio de la lista
      form.reset();
    } else {
      alert('Error al guardar el enlace');
    }
    setLoading(false);
  };

  // --- SOLO PARA CHUNIN: BORRAR DOC ---
  const handleDelete = async (id) => {
    if (!confirm('¿Borrar este documento?')) return;

    // Actualización optimista (lo borramos visualmente ya)
    setDocs(docs.filter(d => d.id !== id));

    await supabase.from('documentos').delete().eq('id', id);
  };

  return (
    <div className="pb-24 px-2">

      {/* --- FORMULARIO DE SUBIDA (Solo Chunin) --- */}
      {isChunin && (
        <div className="bg-slate-800 p-4 rounded-xl border border-yellow-500/30 mb-6 shadow-lg">
          <h3 className="text-yellow-400 font-bold text-sm mb-3 uppercase tracking-wider">
            ➕ Añadir Nueva Hoja de Ruta
          </h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <input
              name="nombre"
              placeholder="Nombre (Ej: Horarios Viña)"
              required
              className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-yellow-500 outline-none"
            />
            <input
              name="url"
              type="url"
              placeholder="Pega aquí el enlace de Google Drive..."
              required
              className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-300 text-sm focus:border-yellow-500 outline-none font-mono"
            />
            <button disabled={loading} className="bg-yellow-500 text-slate-900 font-bold py-3 rounded-lg shadow hover:bg-yellow-400 disabled:opacity-50">
              {loading ? 'Guardando...' : 'GUARDAR ENLACE'}
            </button>
          </form>
        </div>
      )}

      {/* --- LISTA DE DOCUMENTOS (Para todos) --- */}
      <div className="space-y-3">
        <h3 className="text-slate-500 text-xs font-bold uppercase ml-1">Documentos Disponibles</h3>

        {docs.map((doc) => (
          <div key={doc.id} className="relative group">
            {/* LA TARJETA ENLACE */}
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center shadow-md"
            >
              <div className="bg-blue-900/30 p-3 rounded-lg mr-4 text-2xl">
                📄
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-lg leading-tight">{doc.nombre}</h4>
                <p className="text-blue-400 text-xs mt-1">Toca para abrir en Drive ↗</p>
              </div>
            </a>

            {/* BOTÓN BORRAR (Flotante, solo Chunin) */}
            {isChunin && (
              <button
                onClick={() => handleDelete(doc.id)}
                className="absolute top-2 right-2 bg-slate-900/80 text-red-500 p-2 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-900 hover:text-white transition-colors z-10"
                title="Borrar documento"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {docs.length === 0 && (
          <div className="text-center py-10 opacity-50">
            <p className="text-4xl mb-2">📭</p>
            <p>No hay hojas de ruta activas.</p>
          </div>
        )}
      </div>

    </div>
  );
}