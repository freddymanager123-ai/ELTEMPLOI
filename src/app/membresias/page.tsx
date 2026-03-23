"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X, Bookmark } from "lucide-react";

export default function MembresiasPage() {
  const [planes, setPlanes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ id: null as string | null, name: '', price: '', days: '' });

  const fetchPlanes = async () => {
    try {
      const res = await fetch('/api/planes');
      if (res.ok) {
        const data = await res.json();
        setPlanes(data.map((p: any) => ({
          ...p,
          id: p.id.toString(),
          price: Number(p.price),
          days: Number(p.duration_days || p.days || 30) // fallback if schema mismatch
        })));
      }
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    fetchPlanes();
  }, []);

  const handleEdit = (plan: any) => {
    setFormData({
      id: plan.id,
      name: plan.name,
      price: plan.price.toString(),
      days: (plan.duration_days || plan.days).toString()
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar permanentemente este plan de membresía?")) {
      try {
        const res = await fetch(`/api/planes/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setPlanes(planes.filter((p: any) => p.id !== id));
        } else {
          const err = await res.json();
          alert(err.error || 'Error al eliminar');
        }
      } catch(e) {}
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrice = parseFloat(formData.price) || 0;
    const cleanDays = parseInt(formData.days) || 0;

    const payload = {
      name: formData.name,
      price: cleanPrice,
      duration_type: 'DAYS',
      duration_days: cleanDays
    };

    try {
      let res;
      if (formData.id) {
        res = await fetch(`/api/planes/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/planes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        await fetchPlanes();
        setIsModalOpen(false);
        setFormData({ id: null, name: '', price: '', days: '' });
      } else {
        alert('Error al guardar el plan');
      }
    } catch(e) {
      alert('Error de conexión');
    }
  };

  const filtered = planes.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 lg:h-[calc(100vh-4rem)] flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Planes y Membresías</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Gestiona los precios y duraciones del catálogo de membresías ofrecido a tus atletas.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ id: null, name: '', price: '', days: '' });
            setIsModalOpen(true);
          }}
          className="flex-2 sm:flex-none flex items-center justify-center gap-2 bg-gold hover:bg-[#b8952a] text-black px-5 py-2.5 rounded-xl font-extrabold transition shadow-[0_0_15px_rgba(212,175,55,0.3)] w-full sm:w-auto"
        >
          <Plus size={20} />
          Nuevo Plan
        </button>
      </header>

      <div className="bg-oxford p-4 rounded-2xl border border-slate-700/60 shadow-lg flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar plan..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner"
          />
        </div>
      </div>

      <div className="bg-oxford border border-slate-700/60 rounded-2xl shadow-lg flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
          {planes.length === 0 ? (
            <div className="text-center py-10 text-slate-500">Cargando planes o catálogo vacío...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((plan, i) => (
                <div key={i} className="bg-slate-900 border border-slate-700 p-6 rounded-2xl flex flex-col justify-between hover:border-gold/50 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all group">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-white leading-tight pr-4">{plan.name}</h3>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(plan)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-gold transition"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(plan.id)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-danger transition"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <p className="text-4xl font-black text-gold">${plan.price.toFixed(2)} <span className="text-sm font-normal text-slate-500">MXN</span></p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-center gap-2 text-slate-300 font-medium text-sm bg-slate-800/50 rounded-xl p-3">
                    <Bookmark size={18} className="text-gold" /> Acceso por {plan.days} {plan.days === 1 ? 'Día' : 'Días'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-oxford border border-slate-700/60 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-700/60">
              <h2 className="text-xl font-bold text-white">{formData.id ? "Editar Plan" : "Registrar Nuevo Plan"}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition bg-slate-800 hover:bg-slate-700 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <form id="plan-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Nombre del Plan <span className="text-danger">*</span></label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner" placeholder="Ej. Promoción Verano" />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Precio (MXN) <span className="text-danger">*</span></label>
                    <input required min="1" type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner font-mono" placeholder="500.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Días de Acceso <span className="text-danger">*</span></label>
                    <input required min="1" type="number" value={formData.days} onChange={e => setFormData({...formData, days: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner font-mono" placeholder="30" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-700/60 bg-slate-800/30 rounded-b-2xl flex justify-end gap-3 items-center">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-white font-medium transition">Cancelar</button>
              <button type="submit" form="plan-form" className="px-6 py-2.5 bg-gold hover:bg-[#b8952a] text-black rounded-xl font-bold transition shadow-[0_0_15px_rgba(212,175,55,0.25)] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center gap-2">
                <Bookmark size={18} /> {formData.id ? "Actualizar Plan" : "Crear Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
