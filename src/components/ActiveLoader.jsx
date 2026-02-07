import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ActiveLoader({ activePacks, manifestName }) {
  // Estado local de los bultos
  const [packs, setPacks] = useState(activePacks || []);

  // Estado de conexión (para saber si el realtime funciona)
  const [isConnected, setIsConnected] = useState(false);

  // --- EFECTO: CONEXIÓN REALTIME ---
  useEffect(() => {
    const channel = supabase
      .channel('sala-de-carga')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'packs' },
        (payload) => {
          const packActualizado = payload.new;
          setPacks((currentPacks) =>
            currentPacks.map(p =>
              p.id === packActualizado.id
                ? { ...p, estado_carga: packActualizado.estado_carga }
                : p
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsConnected(true);
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setIsConnected(false);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  // --- LÓGICA DE CARGA ---
  const toggleLoad = async (pack) => {
    const nuevoEstado = pack.estado_carga === 'CAMION' ? 'NAVE' : 'CAMION';
    setPacks(packs.map(p => p.id === pack.id ? { ...p, estado_carga: nuevoEstado } : p));
    await supabase.from('packs').update({ estado_carga: nuevoEstado }).eq('id', pack.id);
  };


  // --- FILTROS Y PROGRESO ---
  const enSuelo = packs.filter(p => p.estado_carga !== 'CAMION');
  const enCamion = packs.filter(p => p.estado_carga === 'CAMION');
  const total = packs.length;
  const progreso = total > 0 ? Math.round((enCamion.length / total) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden">

      {/* --- CABECERA --- */}
      <div className="flex justify-between items-center p-3 bg-slate-800 border-b border-slate-700 shadow-md z-10 shrink-0">

        {/* IZQUIERDA: Título y Estado */}
        <div>
          <h1 className="text-lg font-bold text-white leading-none">
            {manifestName || "Carga Libre"}
          </h1>
          <div className="flex items-center gap-1 mt-1">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <p className="text-[10px] text-slate-400 font-mono uppercase">
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </p>
          </div>
        </div>

        {/* DERECHA: Progreso y SALIR */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-yellow-500">{progreso}%</span>

          {/* BOTÓN SALIR RECUPERADO */}
          <a href="/" className="bg-slate-700 hover:bg-red-900 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-xs font-bold border border-slate-600 transition-colors uppercase tracking-wider">
            Salir ✕
          </a>
        </div>
      </div>

      {/* BARRA DE PROGRESO */}
      <div className="h-2 w-full bg-slate-800 shrink-0">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-green-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,197,94,0.5)]"
          style={{ width: `${progreso}%` }}
        />
      </div>

      {/* --- ZONA DE JUEGO (COLUMNAS) --- */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* COLUMNA 1: SUELO */}
        <div className="flex-1 bg-slate-900/50 border-r border-slate-700 flex flex-col min-h-0">
          <div className="bg-slate-900/90 backdrop-blur p-2 border-b border-red-500/20 text-center sticky top-0 z-10 shrink-0">
            <span className="text-red-400 font-bold text-xs uppercase tracking-wider block">⬇️ Suelo ({enSuelo.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-24">
            {enSuelo.map(pack => (
              <div key={pack.id} onClick={() => toggleLoad(pack)}
                className="bg-slate-800 border-l-4 border-red-500 p-3 rounded-r-lg shadow-sm cursor-pointer active:scale-95 transition-all group hover:bg-slate-700">
                <h4 className="font-bold text-white text-md leading-tight group-hover:text-yellow-200">{pack.nombre}</h4>
                {pack.descripcion && <p className="text-[10px] text-slate-500 mt-1">{pack.descripcion}</p>}
              </div>
            ))}

            {enSuelo.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50">
                <span className="text-4xl mb-2">✨</span>
                <p className="text-xs">Todo cargado</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 2: CAMIÓN */}
        <div className="flex-1 bg-green-900/5 flex flex-col min-h-0">
          <div className="bg-slate-900/90 backdrop-blur p-2 border-b border-green-500/20 text-center sticky top-0 z-10 shrink-0">
            <span className="text-green-400 font-bold text-xs uppercase tracking-wider block">🚛 Camión ({enCamion.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-24">
            {enCamion.map(pack => (
              <div key={pack.id} onClick={() => toggleLoad(pack)}
                className="bg-green-900/20 border border-green-900/50 p-3 rounded-lg shadow-sm cursor-pointer active:scale-95 transition-all opacity-60 hover:opacity-100 flex justify-between items-center">
                <h4 className="font-bold text-green-100 text-sm">{pack.nombre}</h4>
                <span className="text-green-500 text-xs font-bold">OK</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}