"use client";
import { useState, useEffect } from "react";
import { DollarSign, Search, Calendar as CalendarIcon, Filter, Receipt, Download, TrendingUp, CheckCircle, ShieldCheck } from "lucide-react";

export default function FinanzasPage() {
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMetodo, setFilterMetodo] = useState("TODOS");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
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

    const fetchFinanzas = async () => {
      try {
        const res = await fetch('/api/finanzas');
        if (res.ok) {
          const data = await res.json();
          setTransacciones(data);
        }
      } catch (e) {
        console.error("Error fetching finanzas:", e);
      }
    };
    
    fetchFinanzas();
  }, []);

  const getFiltered = () => {
    return transacciones.filter(t => {
      const matchSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.cliente.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMethod = filterMetodo === "TODOS" || t.metodo === filterMetodo;
      return matchSearch && matchMethod;
    });
  };

  const filteredTransacciones = getFiltered();
  const totalIngresos = filteredTransacciones.reduce((sum, t) => sum + t.total, 0);

  const exportToCSV = () => {
    const headers = ["ID Folio", "Fecha", "Hora", "Cliente", "Total", "Forma de Pago", "Cajero"];
    const csvRows = filteredTransacciones.map(t => {
      return [
        `"${t.id}"`,
        `"${t.fecha}"`,
        `"${t.hora}"`,
        `"${t.cliente}"`,
        `"${t.total.toFixed(2)}"`,
        `"${t.metodo}"`,
        `"${t.cajero}"`
      ].join(",");
    });
    
    const csvContent = "\uFEFF" + [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `templo_finanzas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isAuthorized === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center animate-in fade-in zoom-in duration-300">
         <ShieldCheck size={80} className="text-danger mb-4 opacity-80" />
         <h1 className="text-3xl font-black text-white mb-2">Acceso Restringido A Finanzas</h1>
         <p className="text-slate-400 max-w-md">Tu cuenta actual no tiene privilegios de Administrador para ver las auditorías y flujo de caja del gimnasio.</p>
      </div>
    );
  }

  if (isAuthorized === null) return null;

  return (
    <div className="space-y-6 lg:h-[calc(100vh-4rem)] flex flex-col pt-1">
      <header className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Finanzas e Historial</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Módulo unificado para supervisar auditorías, cortes de caja y entradas del club.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-bold transition border border-slate-600 shadow-sm w-full sm:w-auto"
        >
          <Download size={20} />
          Exportar Corte .CSV
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-oxford border border-slate-700/60 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition group-hover:opacity-20">
            <TrendingUp size={80} className="text-gold" />
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Ingresos Filtrados</p>
          <p className="text-4xl font-black text-white">${totalIngresos.toFixed(2)}</p>
          <p className="text-gold text-xs font-medium mt-2">+ Calculado del total en pantalla</p>
        </div>
        <div className="bg-oxford border border-slate-700/60 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition group-hover:opacity-20">
            <Receipt size={80} className="text-[#22C55E]" />
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Tickets Emitidos</p>
          <p className="text-4xl font-black text-white">{filteredTransacciones.length}</p>
          <p className="text-[#22C55E] text-xs font-medium mt-2">Operaciones Exitosas</p>
        </div>
        <div className="bg-oxford border border-slate-700/60 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition group-hover:opacity-20">
            <CalendarIcon size={80} className="text-[#009EE3]" />
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Ticket Promedio</p>
          <p className="text-4xl font-black text-white">${filteredTransacciones.length > 0 ? (totalIngresos / filteredTransacciones.length).toFixed(2) : "0.00"}</p>
          <p className="text-[#009EE3] text-xs font-medium mt-2">Consumo medio por transacción</p>
        </div>
      </div>

      {/* Toolbox */}
      <div className="bg-oxford p-4 rounded-2xl border border-slate-700/60 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Folio TKT- o Nombre..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold transition shadow-inner"
          />
        </div>
        <div className="flex overflow-x-auto w-full md:w-auto gap-2 pb-2 md:pb-0 scrollbar-hide items-center">
          <Filter className="text-slate-500 mr-2 shrink-0" size={18} />
          <button 
            onClick={() => setFilterMetodo("TODOS")}
            className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition ${filterMetodo === "TODOS" ? "bg-slate-700 text-white shadow-inner" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
            Todas
          </button>
          <button 
            onClick={() => setFilterMetodo("CASH")}
            className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition ${filterMetodo === "CASH" ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/50 shadow-inner" : "bg-transparent border border-slate-700 text-slate-400 hover:text-[#22C55E]"}`}>
            Efectivo
          </button>
          <button 
            onClick={() => setFilterMetodo("CARD")}
            className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition ${filterMetodo === "CARD" ? "bg-gold/20 text-gold border border-gold/50 shadow-inner" : "bg-transparent border border-slate-700 text-slate-400 hover:text-gold"}`}>
            Terminal Tarjeta
          </button>
          <button 
            onClick={() => setFilterMetodo("MP_LINK")}
            className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm transition ${filterMetodo === "MP_LINK" ? "bg-[#009EE3]/20 text-[#009EE3] border border-[#009EE3]/50 shadow-inner" : "bg-transparent border border-slate-700 text-slate-400 hover:text-[#009EE3]"}`}>
            Billeteras Virtuales
          </button>
        </div>
      </div>

      {/* Tabla de Finanzas */}
      <div className="bg-oxford border border-slate-700/60 rounded-2xl shadow-lg flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left whitespace-nowrap min-w-[900px]">
            <thead className="bg-slate-800/80 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
              <tr className="text-slate-400 text-sm border-b border-slate-700/80">
                <th className="px-6 py-4 font-semibold w-24">Folio ID</th>
                <th className="px-6 py-4 font-semibold">Fecha / Hora</th>
                <th className="px-6 py-4 font-semibold">Cliente Venta</th>
                <th className="px-6 py-4 font-semibold">Forma Cobro</th>
                <th className="px-6 py-4 font-semibold text-right">Monto Total</th>
                <th className="px-6 py-4 font-semibold text-center">Desglose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {filteredTransacciones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500">
                    <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No hay registros financieros asociados a tu consulta.</p>
                  </td>
                </tr>
              ) : (
                filteredTransacciones.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white tracking-widest">{t.id}</td>
                    <td className="px-6 py-4 text-slate-400">
                      <span className="text-white font-medium block">{t.fecha}</span>
                      <span className="text-xs">{t.hora}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-bold">{t.cliente}</span>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{t.clienteActivo ? 'Miembro Vigente' : 'Sin vinculación'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded border ${
                        t.metodo === 'CASH' ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]' : 
                        t.metodo === 'CARD' ? 'bg-gold/10 border-gold/30 text-gold' : 
                        'bg-[#009EE3]/10 border-[#009EE3]/30 text-[#009EE3]'
                      }`}>
                        {t.metodo === 'CASH' ? 'EFECTIVO' : t.metodo === 'CARD' ? 'TARJETA' : 'MERCADO / VIRTUAL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[20px] font-black text-white">${t.total.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedTicket(t)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded border border-slate-600 transition text-[11px] uppercase font-bold w-full max-w-[120px] hover:text-white"
                      >
                        Ver Detalle &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Desglose Ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-oxford border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
               <div>
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Receipt size={20} className="text-gold" /> Comprobante de Cobro
                 </h2>
                 <p className="text-xs text-slate-400 mt-1 font-mono tracking-widest opacity-80">{selectedTicket.id}</p>
                 <p className="text-xs text-slate-400 mt-2">Registrado por: {selectedTicket.cajero}</p>
               </div>
               <div className="text-right">
                 <p className="text-white font-bold">{selectedTicket.fecha}</p>
                 <p className="text-slate-400 text-sm">{selectedTicket.hora}</p>
               </div>
            </div>
            
            <div className="p-6">
               <div className="mb-6 bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between shadow-inner">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cliente Receptor</p>
                    <p className="font-bold text-white text-lg leading-none">{selectedTicket.cliente}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Aprobación</p>
                    <div className="flex justify-end">
                      <span className="bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/50 px-2 py-0.5 text-xs font-bold uppercase rounded flex items-center gap-1">
                        <CheckCircle size={12} /> Exitoso
                      </span>
                    </div>
                  </div>
               </div>

               <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">Artículos e Ítems Transferidos</p>
               <div className="space-y-2 mb-6 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                 {selectedTicket.elementos.map((item: any, i: number) => (
                   <div key={i} className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                     <div className="flex items-center gap-3 w-3/4">
                        <span className="w-7 h-7 bg-slate-800 rounded flex items-center justify-center text-[11px] font-black text-slate-300 shadow-sm">{item.quantity}</span>
                        <span className="text-white text-sm truncate font-medium">{item.name}</span>
                     </div>
                     <span className="text-slate-300 font-bold text-sm text-right w-1/4">${(item.price * item.quantity).toFixed(2)}</span>
                   </div>
                 ))}
               </div>

               <div className="bg-slate-900 rounded-xl p-4 border border-gold/20 flex justify-between items-center shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gold/5"></div>
                  <span className="text-white font-bold relative z-10 tracking-widest uppercase">Total Cobrado (MXN)</span>
                  <span className="text-3xl font-black text-gold relative z-10">${selectedTicket.total.toFixed(2)}</span>
               </div>
            </div>

            <div className="p-6 border-t border-slate-700 bg-slate-800/30 rounded-b-2xl flex justify-end gap-3 items-center">
              <span className="text-xs text-slate-500 mr-auto flex gap-1">PAGADO EN: <span className="text-white font-bold">{selectedTicket.metodo === 'CASH' ? 'EFECTIVO' : selectedTicket.metodo === 'CARD' ? 'TARJETA' : 'ENLACE DE PAGO'}</span></span>
              <button type="button" onClick={() => setSelectedTicket(null)} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-white font-bold transition shadow-sm uppercase text-xs tracking-wider">Cerrar Detalle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
