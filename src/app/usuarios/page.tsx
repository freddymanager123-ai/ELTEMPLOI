"use client";
import { useState, useEffect } from "react";
import { Search, Plus, X, Edit, Trash2, ShieldCheck, UserPlus, Key } from "lucide-react";

export const INITIAL_USERS = [
  { id: "1", name: "Admin Principal", email: "admin@eltemplo.com", role: "Administrador", status: "ACTIVO", password: "password123" },
  { id: "2", name: "Recepcionista Mañana", email: "recepcion.am@eltemplo.com", role: "Recepcionista", status: "ACTIVO", password: "password123" },
  { id: "3", name: "Carlos Coach", email: "entrenador@eltemplo.com", role: "Entrenador", status: "ACTIVO", password: "password123" },
];

const ROLES = ["Administrador", "Recepcionista", "Entrenador"];

export default function UsuariosPage() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("TODOS");
  const [formData, setFormData] = useState({ id: null as string | null, name: '', email: '', role: 'Recepcionista', password: '', status: 'ACTIVO' });
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem("templo_current_user");
    if (rawUser) {
      const currentUser = JSON.parse(rawUser);
      if (currentUser.role !== 'Administrador') {
         setIsAuthorized(false);
         return;
      }
    }
    setIsAuthorized(true);

    const saved = localStorage.getItem('templo_users_data');
    if (saved) {
      try {
        setUsers(JSON.parse(saved));
      } catch (e) {}
    } else {
      localStorage.setItem('templo_users_data', JSON.stringify(INITIAL_USERS));
    }
  }, []);

  const handleEdit = (user: any) => {
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: user.password,
      status: user.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, role: string) => {
    if (role === 'Administrador' && users.filter(u => u.role === 'Administrador').length <= 1) {
      alert("No puedes eliminar al único Administrador del sistema.");
      return;
    }
    if (confirm("¿Estás seguro de revocar el acceso y eliminar a este usuario de sistema?")) {
      const updated = users.filter((u: any) => u.id !== id);
      setUsers(updated);
      localStorage.setItem('templo_users_data', JSON.stringify(updated));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updated;

    if (formData.id) {
      updated = users.map((u: any) => 
        u.id === formData.id ? { ...u, name: formData.name, email: formData.email, role: formData.role, password: formData.password, status: formData.status } : u
      );
    } else {
      updated = [{ id: Date.now().toString(), name: formData.name, email: formData.email, role: formData.role, password: formData.password, status: "ACTIVO" }, ...users];
    }

    setUsers(updated);
    localStorage.setItem('templo_users_data', JSON.stringify(updated));
    setIsModalOpen(false);
    setFormData({ id: null, name: '', email: '', role: 'Recepcionista', password: '', status: 'ACTIVO' });
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "TODOS" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  if (isAuthorized === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center animate-in fade-in zoom-in duration-300">
         <ShieldCheck size={80} className="text-danger mb-4 opacity-80" />
         <h1 className="text-3xl font-black text-white mb-2">Acceso Restringido</h1>
         <p className="text-slate-400 max-w-md">Tu cuenta actual no tiene privilegios de Administrador para acceder a la gestión de usuarios y controles de sistema.</p>
      </div>
    );
  }

  if (isAuthorized === null) return null; // loading state

  return (
    <div className="space-y-6 lg:h-[calc(100vh-4rem)] flex flex-col pt-1">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Usuarios y Roles de Sistema</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Administra qué personal tiene acceso al panel de control (Cajeros, Admins, Entrenadores).</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ id: null, name: '', email: '', role: 'Recepcionista', password: '', status: 'ACTIVO' });
            setIsModalOpen(true);
          }}
          className="flex-2 sm:flex-none flex items-center justify-center gap-2 bg-gold hover:bg-[#b8952a] text-black px-5 py-2.5 rounded-xl font-extrabold transition shadow-[0_0_15px_rgba(212,175,55,0.3)] w-full sm:w-auto"
        >
          <UserPlus size={20} />
          Nuevo Usuario
        </button>
      </header>

      <div className="bg-oxford p-4 rounded-2xl border border-slate-700/60 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o correo electrónico..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button onClick={() => setFilterRole("TODOS")} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition ${filterRole === "TODOS" ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>Todos</button>
          {ROLES.map(r => (
             <button key={r} onClick={() => setFilterRole(r)} className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition ${filterRole === r ? "bg-gold/20 border border-gold/50 text-gold" : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-gold"}`}>{r}</button>
          ))}
        </div>
      </div>

      <div className="bg-oxford border border-slate-700/60 rounded-2xl shadow-lg flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-slate-800/60">
              <tr className="text-slate-400 text-sm border-b border-slate-700/80">
                <th className="px-6 py-4 font-semibold">Staff / Empleado</th>
                <th className="px-6 py-4 font-semibold">Rol Asignado</th>
                <th className="px-6 py-4 font-semibold">Contacto (Email)</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {filtered.map((user, i) => (
                <tr key={i} className={`hover:bg-slate-800/40 transition-colors ${user.status === 'INACTIVO' ? 'opacity-50 grayscale' : ''}`}>
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 border border-slate-600">
                      <ShieldCheck size={20} className={user.role === 'Administrador' ? 'text-gold' : 'text-slate-400'}/>
                    </div>
                    {user.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-md border ${user.role === 'Administrador' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : user.role === 'Recepcionista' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' : 'bg-purple-500/10 border-purple-500/30 text-purple-500'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-mono text-xs">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 flex w-fit items-center gap-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${user.status === 'ACTIVO' ? 'bg-gold/10 text-gold border-gold/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                       <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVO' ? 'bg-gold animate-pulse' : 'bg-danger'}`}></span>
                       {user.status === 'ACTIVO' ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleEdit(user)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 hover:text-gold transition shadow-sm" title="Editar Credenciales">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(user.id, user.role)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 hover:text-danger transition shadow-sm" title="Revocar Accesos">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
             <div className="p-8 text-center text-slate-500">No se encontraron usuarios bajo esos parámetros.</div>
          )}
        </div>
      </div>

      {/* Modal Nuevo/Editar Rol */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-oxford border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-700/60">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><ShieldCheck className="text-gold"/> {formData.id ? "Editar Permisos de Usuario" : "Otorgar Acceso al Sistema"}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition bg-slate-800 hover:bg-slate-700 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
                
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Nombre Completo del Empleado <span className="text-danger">*</span></label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition shadow-inner" placeholder="Ej. Juan Pérez" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Correo Electrónico (Login) <span className="text-danger">*</span></label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition shadow-inner" placeholder="juan.perez@eltemplo.com" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Contraseña de Acceso <span className="text-danger">*</span></label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-gold font-mono transition shadow-inner" placeholder="PAs$w0rd..." />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Rol en Sistema <span className="text-danger">*</span></label>
                    <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition shadow-inner appearance-none cursor-pointer">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Status Cuenta</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition shadow-inner appearance-none cursor-pointer">
                      <option value="ACTIVO">ACTIVO (PERMITIDO)</option>
                      <option value="INACTIVO">INACTIVO (BLOQUEADO)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 text-xs text-gold flex gap-3 items-start">
                   <ShieldCheck size={28} className="shrink-0"/>
                   <p>El rol de <strong>Administrador</strong> tiene acceso irrestricto a los tickets, métricas de retención financiera y auditorías de caja. Los <strong>Recepcionistas</strong> operan el Punto de Venta y Pagos. Los <strong>Entrenadores</strong> solo pueden ver asistencias.</p>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-700/60 bg-slate-800/30 rounded-b-2xl flex justify-end gap-3 items-center">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-white font-medium transition">Cancelar</button>
              <button type="submit" form="user-form" className="px-6 py-2.5 bg-gold hover:bg-[#b8952a] text-black rounded-xl font-bold transition shadow-[0_0_15px_rgba(212,175,55,0.25)] flex items-center gap-2">
                 {formData.id ? "Actualizar Permisos" : "Otorgar Acceso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
