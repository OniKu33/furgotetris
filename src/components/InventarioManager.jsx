import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function InventarioManager({ initialPacks, initialItems }) {
  // Pestaña activa: 'packs' o 'items'
  const [activeTab, setActiveTab] = useState('items');

  // Datos
  const [items, setItems] = useState(initialItems || []);
  const [packs, setPacks] = useState(initialPacks || []);

  // --- ESTADOS PARA EDICIÓN ---
  const [editingItem, setEditingItem] = useState(null);
  const [editingPack, setEditingPack] = useState(null);

  // Control de interfaz
  const [showItemForm, setShowItemForm] = useState(false);
  const [showPackDetail, setShowPackDetail] = useState(false); // Para entrar en un bulto

  // --- LOGICA DE ITEMS ---
  const handleSaveItem = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const itemData = {
      nombre: formData.get('nombre'),
      descripcion: formData.get('descripcion'),
      propietario: formData.get('propietario'),
      cantidad_total: formData.get('cantidad_total')
    };

    if (editingItem) {
      // EDITAR
      const { data, error } = await supabase.from('items').update(itemData).eq('id', editingItem.id).select();
      if (!error) {
        setItems(items.map(i => i.id === editingItem.id ? data[0] : i));
        closeItemForm();
      }
    } else {
      // CREAR
      const { data, error } = await supabase.from('items').insert([itemData]).select();
      if (!error) {
        setItems([data[0], ...items]);
        closeItemForm();
      }
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('¿Borrar item?')) return;
    await supabase.from('items').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const closeItemForm = () => {
    setEditingItem(null);
    setShowItemForm(false);
  };

  // --- LOGICA DE PACKS ---
  const handleSavePack = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const packData = {
      nombre: formData.get('nombre'),
      descripcion: formData.get('descripcion')
    };

    if (editingPack && editingPack.id) {
      // EDITAR NOMBRE PACK
      const { data, error } = await supabase.from('packs').update(packData).eq('id', editingPack.id).select();
      if (!error) {
        setPacks(packs.map(p => p.id === editingPack.id ? data[0] : p));
        setEditingPack({ ...editingPack, ...data[0] });
        alert('Bulto actualizado');
      }
    } else {
      // CREAR PACK
      const { data, error } = await supabase.from('packs').insert([packData]).select();
      if (!error) {
        setPacks([data[0], ...packs]);
        setEditingPack(data[0]);
        setShowPackDetail(true);
      }
    }
  };

  const openPackDetail = (pack) => {
    setEditingPack(pack);
    setShowPackDetail(true);
  };

  // --- LOGICA MOVER CONTENIDO ---
  const moveItemToPack = async (itemId) => {
    // UI Optimista
    const updatedItems = items.map(i => i.id === itemId ? { ...i, pack_id: editingPack.id } : i);
    setItems(updatedItems);
    // BD
    await supabase.from('items').update({ pack_id: editingPack.id }).eq('id', itemId);
  };

  const removeFromPack = async (itemId) => {
    const updatedItems = items.map(i => i.id === itemId ? { ...i, pack_id: null } : i);
    setItems(updatedItems);
    await supabase.from('items').update({ pack_id: null }).eq('id', itemId);
  };


  // --- RENDERIZADO ---

  // VISTA 1: DETALLE DEL PACK (PANTALLA COMPLETA)
  if (showPackDetail && editingPack) {
    const itemsInPack = items.filter(i => i.pack_id === editingPack.id);
    const availableItems = items.filter(i => i.pack_id !== editingPack.id);

    return (
      <div className="flex flex-col h-screen pb-24">
        <button onClick={() => setShowPackDetail(false)} className="text-yellow-400 font-bold mb-4 flex items-center p-2 bg-slate-800 rounded w-fit">
          ← Volver al listado
        </button>

        {/* Formulario Cabecera Pack */}
        <form onSubmit={handleSavePack} className="bg-slate-800 p-4 rounded-xl mb-4 border border-yellow-500/50 shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-yellow-500 uppercase font-bold">Editando Bulto</label>
            <button type="submit" className="text-xs bg-green-600 px-3 py-1 rounded text-white font-bold">Guardar</button>
          </div>
          <input name="nombre" defaultValue={editingPack.nombre} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-2 font-bold text-xl" />
          <input name="descripcion" defaultValue={editingPack.descripcion} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-slate-400 text-sm" />
        </form>

        <div className="flex-1 overflow-hidden flex flex-col gap-2">
          {/* DENTRO DE LA CAJA */}
          <div className="flex-1 bg-slate-800 rounded-lg p-2 overflow-y-auto border border-green-900/50">
            <h4 className="text-green-400 font-bold text-sm mb-2 sticky top-0 bg-slate-800 py-2 border-b border-slate-700">
              ⬇️ DENTRO DE LA CAJA ({itemsInPack.length})
            </h4>
            {itemsInPack.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-slate-700 p-3 rounded mb-2 shadow-sm">
                <span className="text-white font-medium">{item.nombre}</span>
                <button onClick={() => removeFromPack(item.id)} className="text-red-400 px-3 py-1 bg-slate-800 rounded ml-2">Sacar</button>
              </div>
            ))}
            {itemsInPack.length === 0 && <p className="text-slate-500 text-center mt-4 italic">Caja vacía...</p>}
          </div>

          {/* FUERA DE LA CAJA */}
          <div className="h-1/3 bg-slate-900 rounded-lg p-2 overflow-y-auto border-t-2 border-slate-600">
            <h4 className="text-slate-400 font-bold text-sm mb-2 sticky top-0 bg-slate-900 py-1">
              ⬆️ AÑADIR (Toca para meter)
            </h4>
            {availableItems.map(item => (
              <div key={item.id} onClick={() => moveItemToPack(item.id)}
                className="flex justify-between items-center bg-slate-800 p-3 rounded mb-1 cursor-pointer hover:bg-slate-700 border border-slate-700 active:scale-95 transition-transform">
                <div>
                  <span className="text-slate-300 block font-bold text-sm">{item.nombre}</span>
                  {item.pack_id && <span className="text-[10px] text-yellow-600 block">(En otro bulto)</span>}
                </div>
                <span className="text-green-500 font-bold text-xl">+</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: LISTADOS PRINCIPALES
  return (
    <div className="pb-24">

      {/* --- ESTOS SON LOS BOTONES QUE TE GUSTABAN --- */}
      <div className="grid grid-cols-2 bg-slate-800 p-1 rounded-xl mb-6 shadow-md">
        <button
          onClick={() => setActiveTab('items')}
          className={`py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'items'
            ? 'bg-yellow-500 text-slate-900 shadow-lg scale-100'
            : 'text-slate-400 hover:text-white scale-95'
            }`}
        >
          🎸 ITEMS
        </button>
        <button
          onClick={() => setActiveTab('packs')}
          className={`py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'packs'
            ? 'bg-yellow-500 text-slate-900 shadow-lg scale-100'
            : 'text-slate-400 hover:text-white scale-95'
            }`}
        >
          📦 BULTOS
        </button>
      </div>

      {/* --- PESTAÑA ITEMS --- */}
      {activeTab === 'items' && (
        <>
          {!showItemForm ? (
            <div className="space-y-3">
              <button onClick={() => { setEditingItem(null); setShowItemForm(true); }}
                className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold mb-4 shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all">
                + CREAR NUEVO ITEM
              </button>

              {items.map(item => (
                <div key={item.id} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-slate-700 shadow-sm">
                  <div>
                    <div className="font-bold text-white text-lg">{item.nombre}</div>
                    <div className="text-xs text-slate-400 mt-1">{item.descripcion || "Sin descripción"}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditItem(item)} className="bg-slate-700 text-blue-300 px-3 py-2 rounded-lg font-bold text-sm">Editar</button>
                    <button onClick={() => deleteItem(item.id)} className="bg-slate-900 text-red-400 px-3 py-2 rounded-lg font-bold text-sm">X</button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-center text-slate-500 mt-8">No tienes items sueltos.</p>}
            </div>
          ) : (
            // Formulario Items
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 shadow-2xl">
              <h3 className="font-bold text-white mb-6 text-xl border-b border-slate-700 pb-2">{editingItem ? 'Editar Item' : 'Nuevo Item'}</h3>
              <form onSubmit={handleSaveItem} className="space-y-4">
                <input name="nombre" placeholder="Nombre (Ej: Micrófono)" defaultValue={editingItem?.nombre} required className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-yellow-500 outline-none" />
                <input name="descripcion" placeholder="Descripción" defaultValue={editingItem?.descripcion} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none" />
                <div className="flex gap-2">
                  <input name="propietario" placeholder="Propietario" defaultValue={editingItem?.propietario} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none" />
                  <input name="cantidad_total" type="number" placeholder="Stock" defaultValue={editingItem?.cantidad_total || 1} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none" />
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={closeItemForm} className="flex-1 bg-slate-700 text-white py-3 rounded-lg font-bold">Cancelar</button>
                  <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold shadow-lg">Guardar</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* --- PESTAÑA PACKS --- */}
      {activeTab === 'packs' && (
        <div className="space-y-3">
          {/* Formulario rápido para crear pack */}
          <form onSubmit={handleSavePack} className="bg-slate-800 p-3 rounded-xl mb-6 flex gap-2 border border-slate-600 shadow-md">
            <input name="nombre" placeholder="Nombre nuevo bulto..." required className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-yellow-500" />
            <button className="bg-green-600 px-6 rounded-lg text-white font-bold text-xl shadow-lg">+</button>
          </form>

          {packs.map(pack => (
            <div key={pack.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex justify-between items-center shadow-md">
              <div>
                <h3 className="font-bold text-white text-xl">📦 {pack.nombre}</h3>
                <p className="text-slate-400 text-sm mt-1">{pack.descripcion || "Sin descripción"}</p>
              </div>
              <button onClick={() => openPackDetail(pack)} className="bg-yellow-500 text-slate-900 px-5 py-3 rounded-lg font-bold shadow hover:bg-yellow-400 active:translate-y-1 transition-all">
                ABRIR
              </button>
            </div>
          ))}
          {packs.length === 0 && <p className="text-center text-slate-500 mt-8">No hay bultos creados.</p>}
        </div>
      )}

    </div>
  );
}