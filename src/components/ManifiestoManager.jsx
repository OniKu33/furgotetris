import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ManifiestoManager({ initialManifiestos, allPacks }) {
  // Vistas: 'list' (ver listas) | 'edit' (meter cajas en una lista)
  const [view, setView] = useState('list');

  const [manifiestos, setManifiestos] = useState(initialManifiestos || []);
  const [activeManifiestoId, setActiveManifiestoId] = useState(initialManifiestos.find(m => m.activo)?.id);

  // Estado para Edición
  const [editingManifiesto, setEditingManifiesto] = useState(null);
  const [selectedPackIds, setSelectedPackIds] = useState([]); // IDs de los packs en la lista actual

  // --- LOGICA DE LISTAS (CRUD) ---

  const createManifiesto = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nombre = formData.get('nombre');
    if (!nombre) return;

    const { data, error } = await supabase.from('manifiestos').insert([{ nombre }]).select();
    if (!error) {
      setManifiestos([data[0], ...manifiestos]);
      e.target.reset();
    }
  };

  const deleteManifiesto = async (id) => {
    if (!confirm('¿Borrar esta lista?')) return;
    await supabase.from('manifiestos').delete().eq('id', id);
    setManifiestos(manifiestos.filter(m => m.id !== id));
    if (activeManifiestoId === id) setActiveManifiestoId(null);
  };

  // --- LOGICA DE ACTIVAR (EL CEREBRO) ---
  const activateManifiesto = async (id) => {
    // 1. UI Optimista
    setActiveManifiestoId(id);
    const updated = manifiestos.map(m => ({ ...m, activo: m.id === id }));
    setManifiestos(updated);

    // 2. BD: Desactivar todos primero (hack rápido) y activar el elegido
    // Lo ideal sería una función RPC, pero esto funciona para MVP
    await supabase.from('manifiestos').update({ activo: false }).neq('id', id);
    await supabase.from('manifiestos').update({ activo: true }).eq('id', id);
  };

  // --- LOGICA DE CONTENIDO (EDITAR PACKS) ---

  const openEditor = async (manifiesto) => {
    setEditingManifiesto(manifiesto);
    setView('edit');

    // Cargar qué packs tiene esta lista
    const { data } = await supabase
      .from('manifiesto_packs')
      .select('pack_id')
      .eq('manifiesto_id', manifiesto.id);

    if (data) {
      setSelectedPackIds(data.map(row => row.pack_id));
    } else {
      setSelectedPackIds([]);
    }
  };

  const togglePack = async (packId) => {
    const isSelected = selectedPackIds.includes(packId);

    if (isSelected) {
      // QUITAR
      setSelectedPackIds(selectedPackIds.filter(id => id !== packId));
      await supabase.from('manifiesto_packs').delete().match({ manifiesto_id: editingManifiesto.id, pack_id: packId });
    } else {
      // AÑADIR
      setSelectedPackIds([...selectedPackIds, packId]);
      await supabase.from('manifiesto_packs').insert([{ manifiesto_id: editingManifiesto.id, pack_id: packId }]);
    }
  };


  // --- RENDERIZADO ---

  // VISTA 1: EDITOR DE CONTENIDO (Izquierda/Derecha)
  if (view === 'edit' && editingManifiesto) {
    // Separamos visualmente
    const library = allPacks.filter(p => !selectedPackIds.includes(p.id));
    const selection = allPacks.filter(p => selectedPackIds.includes(p.id));

    return (
      <div className="flex flex-col h-[calc(100vh-100px)]">
        <div className="flex justify-between items-center mb-4 bg-slate-800 p-3 rounded-xl border border-slate-700">
          <button onClick={() => setView('list')} className="text-yellow-400 font-bold px-2">← Volver</button>
          <div className="text-center">
            <h2 className="text-white font-bold">{editingManifiesto.nombre}</h2>
            <p className="text-xs text-slate-400">Editando contenido</p>
          </div>
          <div className="w-16"></div> {/* Espaciador para centrar título */}
        </div>

        <div className="flex flex-1 gap-2 overflow-hidden pb-4">

          {/* IZQUIERDA: ALMACÉN (DISPONIBLE) */}
          <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-700 flex flex-col">
            <div className="bg-slate-800 p-2 text-center text-xs font-bold text-slate-400 rounded-t-xl">
              NO INCLUIDO ({library.length})
            </div>
            <div className="overflow-y-auto p-2 space-y-2 flex-1">
              {library.map(pack => (
                <div key={pack.id} onClick={() => togglePack(pack.id)}
                  className="p-3 bg-slate-800 rounded-lg text-slate-400 text-sm border border-transparent hover:border-slate-500 cursor-pointer active:scale-95 transition-transform">
                  {pack.nombre}
                </div>
              ))}
            </div>
          </div>

          {/* DERECHA: SELECCIONADO (VERDE) */}
          <div className="flex-1 bg-green-900/10 rounded-xl border border-green-500/30 flex flex-col">
            <div className="bg-green-900/40 p-2 text-center text-xs font-bold text-green-400 rounded-t-xl border-b border-green-900/50">
              SE VIENE ({selection.length})
            </div>
            <div className="overflow-y-auto p-2 space-y-2 flex-1">
              {selection.map(pack => (
                <div key={pack.id} onClick={() => togglePack(pack.id)}
                  className="p-3 bg-green-600 text-white font-bold rounded-lg text-sm shadow-lg cursor-pointer active:scale-95 transition-transform flex justify-between items-center">
                  <span>{pack.nombre}</span>
                  <span className="text-[10px] bg-green-800 px-1 rounded ml-1">OK</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: LISTA DE MANIFIESTOS (DASHBOARD)
  return (
    <div className="pb-24 px-2">
      {/* Crear Nuevo */}
      <form onSubmit={createManifiesto} className="flex gap-2 mb-6">
        <input name="nombre" placeholder="Nombre nueva lista (Ej: Boda Juan)" className="flex-1 bg-slate-800 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-yellow-500" required />
        <button className="bg-yellow-500 text-slate-900 px-4 rounded-xl font-bold shadow-lg hover:bg-yellow-400">+</button>
      </form>

      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 ml-1">Mis Listas Guardadas</h3>

      <div className="space-y-3">
        {manifiestos.map(m => {
          const isActive = activeManifiestoId === m.id;
          return (
            <div key={m.id} className={`p-4 rounded-xl border transition-all ${isActive
              ? 'bg-slate-800 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
              : 'bg-slate-800 border-slate-700 opacity-90'
              }`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={`font-bold text-lg ${isActive ? 'text-green-400' : 'text-white'}`}>
                  {m.nombre}
                </h3>

                {/* Interruptor ACTIVO */}
                <button
                  onClick={() => activateManifiesto(m.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${isActive
                    ? 'bg-green-500 text-slate-900 border-green-400 cursor-default'
                    : 'bg-transparent text-slate-500 border-slate-600 hover:border-slate-400'
                    }`}
                >
                  {isActive ? '● ACTIVO' : '○ Activar'}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openEditor(m)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-bold border border-slate-600"
                >
                  📝 Editar Contenido
                </button>
                <button
                  onClick={() => deleteManifiesto(m.id)}
                  className="px-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-lg text-sm border border-red-900/50"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}

        {manifiestos.length === 0 && (
          <div className="text-center py-10 opacity-50">
            <p>No tienes listas creadas.</p>
            <p className="text-sm">Crea una arriba para empezar.</p>
          </div>
        )}
      </div>
    </div>
  );
}