import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ManifestBuilder({ initialPacks }) {
  const [packs, setPacks] = useState(initialPacks);

  // Filtramos localmente
  const library = packs.filter(p => !p.en_manifiesto); // Se quedan en casa
  const manifest = packs.filter(p => p.en_manifiesto); // Se vienen

  const toggleManifest = async (pack) => {
    const newValue = !pack.en_manifiesto;

    // 1. UI Optimista (Cambio visual instantáneo)
    const updatedPacks = packs.map(p =>
      p.id === pack.id ? { ...p, en_manifiesto: newValue } : p
    );
    setPacks(updatedPacks);

    // 2. Guardar en BD
    await supabase.from('packs').update({ en_manifiesto: newValue }).eq('id', pack.id);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="bg-slate-800 p-3 mb-2 rounded-lg text-center">
        <h2 className="text-white font-bold">🛠️ PREPARAR BOLO</h2>
        <p className="text-xs text-slate-400">Toca para añadir o quitar del viaje</p>
      </div>

      <div className="flex flex-1 gap-2 overflow-hidden">

        {/* IZQUIERDA: ALMACÉN (NO VA) */}
        <div className="flex-1 bg-slate-900/50 rounded border border-slate-700 flex flex-col">
          <h3 className="text-slate-500 text-xs text-center p-2 bg-slate-800 font-bold">🏠 SE QUEDA ({library.length})</h3>
          <div className="overflow-y-auto p-2 space-y-2 flex-1">
            {library.map(pack => (
              <div key={pack.id} onClick={() => toggleManifest(pack)}
                className="p-3 bg-slate-800 rounded text-slate-400 text-sm border border-transparent hover:border-slate-500 cursor-pointer">
                {pack.nombre}
              </div>
            ))}
          </div>
        </div>

        {/* DERECHA: MANIFIESTO (SÍ VA) */}
        <div className="flex-1 bg-indigo-900/20 rounded border border-indigo-500/50 flex flex-col">
          <h3 className="text-indigo-400 text-xs text-center p-2 bg-indigo-900/40 font-bold">🎒 SE VIENE ({manifest.length})</h3>
          <div className="overflow-y-auto p-2 space-y-2 flex-1">
            {manifest.map(pack => (
              <div key={pack.id} onClick={() => toggleManifest(pack)}
                className="p-3 bg-indigo-600 text-white font-bold rounded text-sm shadow-lg cursor-pointer transform active:scale-95 transition-all">
                {pack.nombre}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Botón rápido para ir a cargar */}
      <a href="/carga" className="mt-4 bg-green-600 text-white text-center py-3 rounded-lg font-bold shadow-lg">
        ✅ Todo listo: IR A CARGAR
      </a>
    </div>
  );
}