import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ActiveLoader({ activePacks }) {
  const [packs, setPacks] = useState(activePacks);
  const [loading, setLoading] = useState(false);

  // Filtros
  const enSuelo = packs.filter(p => p.estado_carga !== 'CAMION');
  const enCamion = packs.filter(p => p.estado_carga === 'CAMION');
  const progreso = Math.round((enCamion.length / packs.length) * 100) || 0;

  const toggleLoad = async (pack) => {
    const newStatus = pack.estado_carga === 'CAMION' ? 'NAVE' : 'CAMION';
    // Optimistic UI
    setPacks(packs.map(p => p.id === pack.id ? { ...p, estado_carga: newStatus } : p));
    // DB
    await supabase.from('packs').update({ estado_carga: newStatus }).eq('id', pack.id);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">

      {/* --- CABECERA SUPERIOR (SOLO TETRIS) --- */}
      <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-widest">FURGO<span className="text-yellow-500">TETRIS</span></h1>
          <p className="text-xs text-slate-400 font-mono">Modo Carga Activo</p>
        </div>

        {/* BOTÓN SALIR: Te devuelve al Plan */}
        <a href="/manifiesto" className="bg-red-900/50 text-red-400 px-4 py-2 rounded-lg text-xs font-bold border border-red-900 hover:bg-red-900 hover:text-white transition-colors">
          SALIR ✕
        </a>
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="h-2 w-full bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-green-500 transition-all duration-500"
          style={{ width: `${progreso}%` }}
        />
      </div>

      {/* ZONA DE CARGA (Máximo espacio vertical) */}
      <div className="flex flex-1 overflow-hidden">

        {/* COLUMNA SUELO */}
        <div className="flex-1 bg-slate-900 border-r border-slate-700 flex flex-col relative">
          <div className="absolute top-0 w-full bg-slate-900/90 backdrop-blur p-2 border-b border-red-900/30 z-10 text-center">
            <span className="text-red-400 font-bold text-xs uppercase tracking-wider">⬇️ Suelo ({enSuelo.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto pt-10 pb-4 px-2 space-y-2">
            {enSuelo.map(pack => (
              <div key={pack.id} onClick={() => toggleLoad(pack)}
                className="bg-slate-800 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm cursor-pointer active:scale-95 transition-all">
                <h4 className="font-bold text-white text-lg">{pack.nombre}</h4>
                <p className="text-xs text-slate-500">{pack.descripcion}</p>
              </div>
            ))}
            {enSuelo.length === 0 && <div className="mt-20 text-center text-slate-600 italic">Suelo limpio ✨</div>}
          </div>
        </div>

        {/* COLUMNA CAMIÓN */}
        <div className="flex-1 bg-slate-900/50 flex flex-col relative">
          <div className="absolute top-0 w-full bg-slate-900/90 backdrop-blur p-2 border-b border-green-900/30 z-10 text-center">
            <span className="text-green-400 font-bold text-xs uppercase tracking-wider">🚛 Camión ({enCamion.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto pt-10 pb-4 px-2 space-y-2">
            {enCamion.map(pack => (
              <div key={pack.id} onClick={() => toggleLoad(pack)}
                className="bg-green-900/20 border border-green-900/50 p-3 rounded-lg shadow-sm cursor-pointer active:scale-95 transition-all opacity-75 hover:opacity-100">
                <h4 className="font-bold text-green-100">{pack.nombre}</h4>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}