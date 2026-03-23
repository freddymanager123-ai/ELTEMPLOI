"use client";
import { useState, useEffect } from "react";
import { Search, Plus, MoreVertical, Filter, Download, UserPlus, X, Edit, Trash2, Eye, Calendar, ShoppingBag, Activity, BadgeDollarSign, BookOpen, Upload } from "lucide-react";

export default function ClientesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null as string | null, first_name: '', last_name: '', birth_date: '', age: '', email: '', phone: '', photo: '' });
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("TODOS");

  // Expediente Detallado
  const [viewClient, setViewClient] = useState<any | null>(null);
  const [clientHistory, setClientHistory] = useState<{matriculas: any[], ventas: any[], creditos: any[]}>({ matriculas: [], ventas: [], creditos: [] });

  const fetchClients = async () => {
    try {
      // Parallel fetch for clients and global transactions
      const [clientRes, finanzasRes] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/finanzas').catch(() => ({ ok: false, json: () => [] }))
      ]);

      if (clientRes.ok) {
        const data = await clientRes.json();
        const trans = finanzasRes.ok ? await (finanzasRes as Response).json() : [];

        const formatted = data.map((c: any) => {
           const fullName = `${c.first_name} ${c.last_name}`;
           const clientTrans = trans.filter((t: any) => t.cliente && typeof t.cliente === 'string' && t.cliente.trim().toLowerCase() === fullName.trim().toLowerCase());
           const hasPending = clientTrans.some((t: any) => t.estadoCredito === 'PENDIENTE');
           
           return {
              ...c,
              id: c.id.toString(), 
              name: fullName,
              birth_date: c.birth_date ? new Date(c.birth_date).toISOString().split('T')[0] : "",
              age: c.age || "N/A",
              phone: c.phone || "N/A",
              email: c.email || "N/A",
              photo: c.photo_url || "",
              status: c.status === 'DELETED' ? 'INACTIVO' : c.status || 'ACTIVO',
              stateClass: c.status === 'DELETED' ? 'bg-danger/10 text-danger border-danger/20' : 'bg-gold/10 text-gold border-gold/20',
              end: "N/A", 
              alert: false,
              hasPending
           };
        });
        setClients(formatted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleEdit = (client: any) => {
    const parts = client.name.split(' ');
    setFormData({
      id: client.id || null,
      first_name: client.first_name || parts[0] || '',
      last_name: client.last_name || parts.slice(1).join(' ') || '',
      birth_date: client.birth_date || "",
      age: client.age !== "N/A" ? client.age : "",
      email: client.email === "N/A" ? "" : client.email,
      phone: client.phone === "N/A" ? "" : client.phone,
      photo: client.photo || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar permanentemente este expediente?")) {
      try {
        const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setClients(clients.filter((c: any) => c.id !== id));
          fetchClients(); 
        } else {
          alert('Hubo un error al eliminar el cliente.');
        }
      } catch(e) { console.error(e); }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300; 
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setFormData({ ...formData, photo: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleViewProfile = async (client: any) => {
    setViewClient(client);
    
    // Fetch real-time Finanzas
    try {
      const res = await fetch('/api/finanzas');
      if (res.ok) {
        const trans = await res.json();
        const clientTrans = trans.filter((t: any) => 
           t.cliente && typeof t.cliente === 'string' && t.cliente.trim().toLowerCase() === client.name.trim().toLowerCase()
        );
        
        const matriculas = clientTrans.filter((t: any) => t.elementos && t.elementos.some((e: any) => !e.category));
        const ventas = clientTrans.filter((t: any) => t.elementos && t.elementos.some((e: any) => e.category) && t.metodo !== 'CREDIT');
        const creditos = clientTrans.filter((t: any) => t.metodo === 'CREDIT');
        
        setClientHistory({ matriculas, ventas, creditos });
      }
    } catch (e) {
      setClientHistory({ matriculas: [], ventas: [], creditos: [] });
    }
  };

  const handleLiquidarCredito = async (ticketId: string) => {
    // Permitir liquidar tanto en efectivo como en tarjeta
    if (confirm("¿Confirmas que el cliente ha pagado esta deuda? Esto sumará el flujo a las ventas del día y el adeudo desaparecerá.")) {
       const method = confirm("Presiona Aceptar (OK) si el pago fue en EFECTIVO. Presiona Cancelar si fue con TARJETA.") ? 'CASH' : 'CARD';
       try {
         const res = await fetch(`/api/finanzas/liquidar`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ ticketId, metodo: method })
         });
         if (res.ok) {
           await fetchClients();
           if (viewClient) handleViewProfile(viewClient);
         } else {
           alert("Ocurrió un error al intentar liquidar la deuda.");
         }
       } catch (e) {
         alert("Error de conexión al liquidar deuda.");
       }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rawPhone = formData.phone ? formData.phone.replace(/\D/g, '') : '';
    if (formData.phone && rawPhone.length !== 10) {
      alert("⚠️ El teléfono celular debe contener exactamente 10 números.");
      return;
    }

    if (formData.email && !formData.email.includes('@')) {
      alert("⚠️ El correo electrónico no es válido. Debe contener el símbolo '@'.");
      return;
    }

    try {
      const payload = {
         first_name: formData.first_name,
         last_name: formData.last_name,
         birth_date: formData.birth_date || null,
         age: formData.age || null,
         phone: formData.phone,
         email: formData.email,
         photo_url: formData.photo 
      };

      let res;
      if (formData.id) {
        res = await fetch(`/api/clientes/${formData.id}`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/clientes`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
         await fetchClients();
         setIsModalOpen(false);
         setFormData({ id: null, first_name: '', last_name: '', birth_date: '', age: '', email: '', phone: '', photo: '' });
      } else {
         const errorData = await res.json();
         alert(`Error: ${errorData.error || 'Ocurrió un problema al guardar el cliente.'}`);
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión con el servidor.');
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "TODOS") return matchesSearch;
    if (filterStatus === "ACTIVO") return matchesSearch && c.status === "ACTIVO";
    if (filterStatus === "VENCIDO") return matchesSearch && (c.status === "VENCIDO" || c.status.includes("INACTIVO"));
    
    return matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ["Nombre Completo", "Edad", "Telefono", "Email", "Status Membresia", "Vencimiento"];
    const csvRows = filteredClients.map(client => {
      return [
        `"${client.name}"`,
        `"${client.age}"`,
        `"${client.phone}"`,
        `"${client.email}"`,
        `"${client.status}"`,
        `"${client.end}"`
      ].join(",");
    });
    
    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `templo_clientes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 lg:h-[calc(100vh-4rem)] flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Directorio de Clientes</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Gestiona los expedientes integrales y estados de membresía.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={exportToCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-semibold transition border border-slate-600 shadow-sm"
          >
            <Download size={18} />
            <span className="hidden md:inline">Exportar .CSV</span>
          </button>
          <button 
            onClick={() => {
              setFormData({ id: null, first_name: '', last_name: '', birth_date: '', age: '', email: '', phone: '', photo: '' });
              setIsModalOpen(true);
            }}
            className="flex-2 sm:flex-none flex items-center justify-center gap-2 bg-gold hover:bg-[#b8952a] text-black px-5 py-2.5 rounded-xl font-extrabold transition shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          >
            <UserPlus size={20} />
            Nuevo Cliente
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-oxford p-4 rounded-2xl border border-slate-700/60 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar predicción: nombre, email..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition"
          />
        </div>
        <div className="flex overflow-x-auto w-full md:w-auto gap-2 pb-2 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setFilterStatus("TODOS")}
            className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${filterStatus === "TODOS" ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
            Estado: Todos
          </button>
          <button 
            onClick={() => setFilterStatus("ACTIVO")}
            className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition ${filterStatus === "ACTIVO" ? "bg-gold/20 border border-gold/50 text-gold" : "bg-transparent border border-slate-700 text-slate-400 hover:text-gold"}`}>
            Activos
          </button>
          <button 
            onClick={() => setFilterStatus("VENCIDO")}
            className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition ${filterStatus === "VENCIDO" ? "bg-danger/20 border border-danger/50 text-danger" : "bg-transparent border border-slate-700 hover:bg-danger/10 text-slate-400 hover:text-danger"}`}>
            Morosos / Vencidos
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-oxford border border-slate-700/60 rounded-2xl shadow-lg flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead className="bg-slate-800/60">
              <tr className="text-slate-400 text-sm border-b border-slate-700/80">
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Edad</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Status Membresía</th>
                <th className="px-6 py-4 font-semibold">Vencimiento</th>
                <th className="px-6 py-4 font-semibold text-center">Adeudo POS</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {filteredClients.slice(0, 20).map((client, i) => (
                <tr key={i} className={`hover:bg-slate-800/40 transition-colors ${client.alert ? 'bg-danger/5' : ''}`}>
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 border border-slate-600 overflow-hidden shrink-0">
                      {client.photo ? (
                        <img src={client.photo} className="w-full h-full object-cover" alt="client" />
                      ) : (
                        client.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)
                      )}
                    </div>
                    {client.name}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-medium">{client.age} años</td>
                  <td className="px-6 py-4">
                    <p className="text-slate-200">{client.phone}</p>
                    <p className="text-slate-500 text-xs">{client.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border ${client.stateClass}`}>
                      {client.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-medium ${client.alert ? 'text-danger' : 'text-slate-300'}`}>{client.end}</td>
                  <td className="px-6 py-4 text-center">
                    {client.hasPending && (
                       <span className="bg-danger/20 text-danger border border-danger/50 text-[10px] font-black uppercase px-2 py-1 rounded shadow-sm flex items-center justify-center gap-1 w-fit mx-auto animate-pulse">
                          <BadgeDollarSign size={12} /> PENDIENTE
                       </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleViewProfile(client)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 hover:text-white transition shadow-sm" title="Ver Expediente Completo">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleEdit(client)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 hover:text-gold transition shadow-sm" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 hover:text-danger transition shadow-sm" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        <div className="border-t border-slate-700/80 p-4 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-400 mt-auto gap-4">
          <p className="font-medium">Mostrando <span className="text-white">1 a {Math.min(20, filteredClients.length)}</span> de <span className="text-white">{filteredClients.length}</span> registros</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition disabled:opacity-50 font-medium" disabled>Anterior</button>
            <button className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg hover:bg-slate-700 transition font-medium">Siguiente</button>
          </div>
        </div>
      </div>

      {isModalOpen && (
       <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-oxford border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-700/60">
              <h2 className="text-xl font-bold text-white">{formData.id ? "Editar Cliente" : "Registrar Nuevo Cliente"}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition bg-slate-800 hover:bg-slate-700 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="new-client-form" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="flex flex-col sm:flex-row gap-6 mb-2 text-left">
                   <div className="flex flex-col items-center gap-3 shrink-0 mx-auto sm:mx-0">
                      <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center shadow-inner relative group">
                         {formData.photo ? (
                            <img src={formData.photo} alt="profile" className="w-full h-full object-cover" />
                         ) : (
                            <UserPlus size={32} className="text-slate-500" />
                         )}
                         
                         <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm touch-auto">
                            <span className="text-xs font-bold text-white tracking-widest uppercase">Cambiar</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                         </label>
                      </div>
                      <label className="text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg cursor-pointer transition shadow-sm flex items-center gap-2">
                          <Upload size={14} /> Subir Foto
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                   </div>
                   
                   <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                     <div>
                       <label className="block text-sm font-semibold text-slate-400 mb-2">Nombre(s) <span className="text-danger">*</span></label>
                       <input required type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner" placeholder="Ej. Carlos" />
                     </div>
                     <div>
                       <label className="block text-sm font-semibold text-slate-400 mb-2">Apellidos <span className="text-danger">*</span></label>
                       <input required type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner" placeholder="Ej. Jiménez" />
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Fecha de Nacimiento</label>
                    <input 
                      type="date" 
                      value={formData.birth_date} 
                      onChange={e => {
                        const bd = e.target.value;
                        let ageStr = formData.age;
                        if (bd) {
                           const bdDate = new Date(bd);
                           const ageDiffMs = Date.now() - bdDate.getTime();
                           const ageDate = new Date(ageDiffMs);
                           ageStr = String(Math.abs(ageDate.getUTCFullYear() - 1970));
                        }
                        setFormData({...formData, birth_date: bd, age: ageStr});
                      }} 
                      className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Edad</label>
                    <input 
                      type="number" 
                      value={formData.age} 
                      onChange={e => setFormData({...formData, age: e.target.value})} 
                      className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner" 
                      placeholder="Ej. 25" 
                      min={0}
                      max={120}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Teléfono Celular</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner" placeholder="10 dígitos numéricos" maxLength={10} minLength={10} pattern="[0-9]{10}" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Correo Electrónico</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner" placeholder="correo@ejemplo.com" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-700/60 bg-slate-800/30 rounded-b-2xl flex justify-end gap-3 items-center">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-white font-medium transition">Cancelar</button>
              <button type="submit" form="new-client-form" className="px-6 py-2.5 bg-gold hover:bg-[#b8952a] text-black rounded-xl font-bold transition shadow-[0_0_15px_rgba(212,175,55,0.25)] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center gap-2">
                <UserPlus size={18} /> {formData.id ? "Actualizar Cliente" : "Guardar Cliente"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Visor de Expediente del Cliente (Modo Pantalla Completa) */}
       {viewClient && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 lg:p-8 animate-in fade-in duration-200">
          <div className="bg-oxford border border-slate-700/60 rounded-2xl w-full max-w-6xl h-full shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-700/60 bg-slate-800/50 shrink-0">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center text-gold border border-gold/40 overflow-hidden shrink-0">
                    {viewClient.photo ? (
                      <img src={viewClient.photo} className="w-full h-full object-cover" alt="client" />
                    ) : (
                      viewClient.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)
                    )}
                 </div>
                 Expediente Completo
              </h2>
              <button type="button" onClick={() => setViewClient(null)} className="text-slate-400 hover:text-white transition bg-slate-800 hover:bg-slate-700 py-2 px-4 text-sm font-bold flex items-center gap-2 rounded-xl border border-slate-600">
                Salir <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar space-y-8 bg-slate-900/30">
               
               {/* 1. Datos Personales */}
               <section>
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><UserPlus size={18} className="text-gold"/> Datos Personales</h3>
                 <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shadow-inner">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Cédula / Nombre</p>
                      <p className="text-white font-bold text-lg">{viewClient.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Edad</p>
                      <p className="text-white font-medium">{viewClient.age !== "N/A" ? `${viewClient.age} años` : "No registrada"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Teléfono Móvil</p>
                      <p className="text-white">{viewClient.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Dirección Email</p>
                      <p className="text-white">{viewClient.email}</p>
                    </div>
                 </div>
                 <div className={`bg-slate-900 border p-6 rounded-2xl grid grid-cols-1 mt-4 gap-6 shadow-inner ${viewClient.alert ? 'border-danger/30 bg-danger/5' : 'border-gold/30 bg-gold/5'}`}>
                   <div className="flex items-center justify-between">
                     <div>
                       <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Vencimiento de Matrícula Registrado</p>
                       <p className={`text-2xl font-black ${viewClient.alert ? 'text-danger' : 'text-[#22C55E]'}`}>
                         {viewClient.end} {viewClient.alert && <span className="text-sm font-bold uppercase ml-2 px-2 py-1 bg-danger/20 rounded">(Vencido)</span>}
                       </p>
                     </div>
                     <span className={`px-5 py-2 rounded-xl text-sm font-black uppercase tracking-wider border shadow-sm ${viewClient.stateClass}`}>
                        {viewClient.status}
                     </span>
                   </div>
                 </div>
               </section>

               {/* Deudas Activas */}
               {clientHistory.creditos.filter(c => c.estadoCredito === 'PENDIENTE').length > 0 && (
                 <section className="animate-in slide-in-from-top-4">
                   <h3 className="text-lg font-bold text-danger mb-4 flex items-center gap-2"><BadgeDollarSign size={20} /> Cuentas por Cobrar (Fiado / Crédito)</h3>
                   <div className="bg-danger/10 border border-danger/30 rounded-2xl overflow-hidden shadow-lg p-1">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                         <thead className="bg-danger/20">
                           <tr className="text-danger border-b border-danger/30">
                             <th className="px-5 py-3 font-black">Fecha de Adeudo</th>
                             <th className="px-5 py-3 font-black">Ticket / Concepto</th>
                             <th className="px-5 py-3 font-black">Deuda Total</th>
                             <th className="px-5 py-3 font-black text-right">Liquidar</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-danger/20">
                            {clientHistory.creditos.filter(c => c.estadoCredito === 'PENDIENTE').map((t, idx) => (
                               <tr key={idx} className="hover:bg-danger/20 transition">
                                 <td className="px-5 py-4 text-white font-medium">{t.fecha}</td>
                                 <td className="px-5 py-4 text-slate-200 truncate max-w-[200px]">
                                    <span className="font-mono text-xs opacity-70 block">{t.id}</span>
                                    {t.elementos?.[0]?.name} {t.elementos?.length > 1 && <span className="text-[10px] bg-danger/20 text-danger px-1.5 py-0.5 rounded ML-1">+{t.elementos.length - 1}</span>}
                                 </td>
                                 <td className="px-5 py-4 font-black text-white text-lg">${t.total.toFixed(2)}</td>
                                 <td className="px-5 py-4 text-right">
                                    <button onClick={() => handleLiquidarCredito(t.id)} className="bg-gold text-black text-xs font-black px-4 py-2.5 rounded-xl hover:bg-[#b8952a] transition shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                                       Pagar Deuda
                                    </button>
                                 </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                 </section>
               )}

               {/* Historiales (Grid de 2 columnas) */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Historial de Matrículas */}
                  <section>
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Calendar size={18} className="text-gold"/> Historial de Matrículas</h3>
                     <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-lg h-64 flex flex-col">
                       <div className="overflow-y-auto custom-scrollbar flex-1">
                         <table className="w-full text-left text-sm whitespace-nowrap">
                           <thead className="bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm">
                             <tr className="text-slate-400 border-b border-slate-700">
                               <th className="px-5 py-4 font-semibold">Plan Registrado</th>
                               <th className="px-5 py-4 font-semibold">Fecha Pago</th>
                               <th className="px-5 py-4 font-semibold text-right">Boleta/Recibo</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-700/50">
                             {clientHistory.matriculas.length === 0 ? (
                               <tr><td colSpan={3} className="text-center py-10 text-slate-500">No hay matrículas pagadas por este cliente.</td></tr>
                             ) : (
                               clientHistory.matriculas.map((t, idx) => (
                                 <tr key={idx} className="hover:bg-slate-800/50 transition">
                                   <td className="px-5 py-4 font-bold text-white truncate max-w-[200px]">{t.elementos?.[0]?.name}</td>
                                   <td className="px-5 py-4 text-slate-400 font-medium">
                                     {t.fecha} <br/><span className="text-[10px] text-gold">${t.total.toFixed(2)} ({t.metodo})</span>
                                   </td>
                                   <td className="px-5 py-4 text-right">
                                     <span className="font-mono text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">{t.id}</span>
                                   </td>
                                 </tr>
                               ))
                             )}
                           </tbody>
                         </table>
                       </div>
                     </div>
                  </section>
                  
                  {/* Historial de Ventas */}
                  <section>
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><ShoppingBag size={18} className="text-gold"/> Historial en Punto de Venta</h3>
                     <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-lg h-64 flex flex-col">
                       <div className="overflow-y-auto custom-scrollbar flex-1">
                         <table className="w-full text-left text-sm whitespace-nowrap">
                           <thead className="bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm">
                             <tr className="text-slate-400 border-b border-slate-700">
                               <th className="px-5 py-4 font-semibold">Fecha Operación</th>
                               <th className="px-5 py-4 font-semibold">Consumo Principal</th>
                               <th className="px-5 py-4 font-semibold text-right">Boleta/Ticket</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-700/50">
                             {clientHistory.ventas.length === 0 && clientHistory.creditos.filter((c) => c.estadoCredito === 'PAGADO').length === 0 ? (
                               <tr><td colSpan={3} className="text-center py-10 text-slate-500">Este cliente no ha comprado productos aún.</td></tr>
                             ) : (
                               [...clientHistory.ventas, ...clientHistory.creditos.filter((c) => c.estadoCredito === 'PAGADO')]
                               .sort((a,b) => new Date(a.fecha.split('/').reverse().join('-')).getTime() > new Date(b.fecha.split('/').reverse().join('-')).getTime() ? -1 : 1)
                               .map((t, idx) => (
                                 <tr key={idx} className="hover:bg-slate-800/50 transition">
                                   <td className="px-5 py-4 text-slate-400 font-medium">
                                     {t.fecha} <br/><span className="text-[10px] text-gold">${t.total.toFixed(2)} ({t.metodo === 'CREDIT' ? 'CRÉDITO LIQUIDADO' : t.metodo})</span>
                                   </td>
                                   <td className="px-5 py-4 font-bold text-white truncate max-w-[200px]">
                                     {t.elementos?.[0]?.name} {t.elementos?.length > 1 && <span className="text-[10px] bg-slate-700 text-white px-1.5 py-0.5 rounded ml-1">+{t.elementos.length - 1}</span>}
                                   </td>
                                   <td className="px-5 py-4 text-right">
                                     <span className="font-mono text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">{t.id}</span>
                                   </td>
                                 </tr>
                               ))
                             )}
                           </tbody>
                         </table>
                       </div>
                     </div>
                  </section>
               </div>

               {/* Historial Asistencias Placeholder */}
               <section>
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Activity size={18} className="text-gold"/> Historial de Accesos (Check-ins)</h3>
                 <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center border-dashed">
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Próximamente</p>
                   <p className="text-slate-600 text-xs mt-2">Los datos de la bitácora de asistencia se mostrarán aquí una vez finalizado el módulo.</p>
                 </div>
               </section>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
