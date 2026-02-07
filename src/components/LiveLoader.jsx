import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function LiveLoader({ initialPacks }) {
  // Estado local para que sea instantáneo
  const [packs, setPacks] = useState(initialPacks || []);
  const [loadingId, setLoadingId] = useState(null); // Para mostrar spinner en el item que se mueve

  // Separamos visualmente en dos listas
  const enNave = packs.filter(p => p.estado === 'NAVE');
  const fuera = packs.filter(p => p.estado === 'FUERA');

  // LA FUNCIÓN MÁGICA: Mover de un lado a otro
  const toggleEstado = async (pack) => {
    const nuevoEstado = pack.estado === 'NAVE' ? 'FUERA' : 'NAVE';
    setLoadingId(pack.id);

    // 1. Optimistic UI (Lo cambiamos visualmente YA, sin esperar a internet)
    const packsActualizados = packs.map(p =>
      p.id === pack.id ? { ...p, estado: nuevoEstado } : p
    );
    setPacks(packsActualizados);

    // 2. Persistir en Supabase (En segundo plano)
    const { error } = await supabase
      .from('packs')
      .update({
        estado: nuevoEstado,
        ultimo_movimiento: new Date()
      })
      .eq('id', pack.id);

    // Si falla, revertimos (Rollback)
    if (error) {
      alert('Error de conexión, el cambio no se guardó');
      setPacks(packs); // Volvemos al estado original
    }

    setLoadingId(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]"> {/* Altura completa menos el menú */}

      {/* HEADER: RESUMEN RÁPIDO */}
      <div className="flex bg-slate-800 p-2 text-center text-xs font-bold uppercase tracking-widest border-b border-slate-700">
        <div className="flex-1 text-green-400 border-r border-slate-700">
          🏠 En Nave: {enNave.length}
        </div>
        <div className="flex-1 text-yellow-400">
          🚛 En Furgo: {fuera.length}
        </div>
      </div>

      {/* ZONA DE BATALLA: DOS COLUMNAS CLICKABLES */}
      <div className="flex flex-1 overflow-hidden">

        {/* COLUMNA IZQUIERDA: NAVE (Tocar para SACAR) */}
        <div className="flex-1 bg-slate-900 overflow-y-auto border-r border-slate-700 p-2">
          <h3 className="text-slate-500 text-xs mb-2 text-center sticky top-0 bg-slate-900 py-1">TOCA PARA CARGAR ➡️</h3>
          <div className="space-y-2">
            {enNave.map(pack => (
              <div
                key={pack.id}
                onClick={() => toggleEstado(pack)}
                className="bg-slate-800 border-l-4 border-green-500 p-3 rounded cursor-pointer active:scale-95 transition-transform shadow-sm hover:bg-slate-700"
              >
                <div className="font-bold text-white text-sm">{pack.nombre}</div>
                <div className="text-xs text-slate-400 mt-1 truncate">{pack.descripcion}</div>
              </div>
            ))}
            {enNave.length === 0 && <div className="text-slate-600 text-center text-xs mt-10">Nave vacía</div>}
          </div>
        </div>

        {/* COLUMNA DERECHA: FURGO (Tocar para DEVOLVER) */}
        <div className="flex-1 bg-slate-900/50 overflow-y-auto p-2">
          <h3 className="text-slate-500 text-xs mb-2 text-center sticky top-0 bg-slate-900 py-1">⬅️ TOCA PARA DESCARGAR</h3>
          <div className="space-y-2">
            {fuera.map(pack => (
              <div
                key={pack.id}
                onClick={() => toggleEstado(pack)}
                className="bg-yellow-900/20 border-r-4 border-yellow-500 p-3 rounded cursor-pointer active:scale-95 transition-transform shadow-sm"
              >
                <div className="font-bold text-yellow-100 text-sm">{pack.nombre}</div>
                <div className="text-xs text-yellow-500/50 mt-1">Fuera</div>
              </div>
            ))}
            {fuera.length === 0 && <div className="text-slate-600 text-center text-xs mt-10">Furgo vacía</div>}
          </div>
        </div>

      </div>

      {/* BOTÓN DE PÁNICO / RESET (Opcional, abajo del todo) */}
      <div className="p-2 bg-slate-800 border-t border-slate-700">
        <button
          onClick={async () => {
            if (confirm('¿Seguro que quieres marcar TODO como EN NAVE?')) {
              await supabase.from('packs').update({ estado: 'NAVE' }).neq('id', 0);
              window.location.reload();
            }
          }}
          className="w-full py-2 text-xs text-slate-400 hover:text-white border border-slate-600 rounded uppercase"
        >
          ♻️ Resetear todo a Nave
        </button>
      </div>
    </div>
  );
}