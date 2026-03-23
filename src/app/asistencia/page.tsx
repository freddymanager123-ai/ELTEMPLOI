"use client";
import { useState, useEffect, useRef } from "react";
import { CheckSquare, Wrench, Search, UserCheck, UserX, Clock, CalendarDays, KeyRound, QrCode, X } from "lucide-react";

export default function AsistenciaPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [dailyLog, setDailyLog] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastScanned, setLastScanned] = useState<any | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clientes');
      if (res.ok) {
        const data = await res.json();
        setClients(data.map((c: any) => ({
          ...c,
          id: c.id.toString(),
          name: `${c.first_name} ${c.last_name}`.trim(),
        })));
      }
    } catch(e) { console.error(e); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/asistencia');
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((log: any) => {
          const mdate = new Date(log.check_in);
          return {
            id: log.id.toString(),
            clientId: log.client_id?.toString() || '',
            name: `${log.first_name} ${log.last_name}`.trim(),
            time: mdate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            date: mdate.toLocaleDateString('es-MX'),
            isOk: log.client_status === 'ACTIVO',
            statusLabel: log.client_status
          };
        });
        // Filtrar opcionalmente solo los de hoy usando el client o la query SQl, 
        // pero la query ya trae los últimos 100, para esta versión está bien.
        const today = new Date().toLocaleDateString('es-MX');
        setDailyLog(formatted.filter((l: any) => l.date === today));
      }
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    fetchClients();
    fetchLogs();
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const term = searchTerm.toLowerCase().trim();
    let match = clients.find(c => c.id === term);
    
    if (!match) {
       match = clients.find(c => c.name.toLowerCase().includes(term));
    }

    if (match) {
      const isOk = match.status === 'ACTIVO' && !match.alert;
      const now = new Date();
      
      const newEntry = {
        id: Date.now().toString(),
        clientId: match.id,
        name: match.name,
        photo: match.photo_url || match.photo || null,
        time: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString('es-MX'),
        isOk: isOk,
        statusLabel: match.status
      };

      setLastScanned({ ...match, entry: newEntry });
      setDailyLog([newEntry, ...dailyLog]);

      try {
        await fetch('/api/asistencia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: match.id })
        });
        // We could call fetchLogs() to sync, but optimistic append is faster for UI scanner.
      } catch(err) {
        console.error("Error saving attendance to DB");
      }

    } else {
      setLastScanned({ error: 'NO ENCONTRADO', term });
    }

    setSearchTerm("");
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="space-y-6 lg:h-[calc(100vh-4rem)] flex flex-col pt-1">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Control de Accesos</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Registra entradas mediante búsqueda o escáner de ID/CURP.</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-2.5 flex items-center gap-3 shadow-inner">
           <CalendarDays size={20} className="text-gold" />
           <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fecha Operativa</p>
              <p className="text-white font-black">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
         <div className="lg:col-span-2 flex flex-col gap-6">
            
            <form onSubmit={handleScan} className="bg-oxford p-6 rounded-2xl border border-slate-700/60 shadow-lg relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-bl-full pointer-events-none"></div>
               <label className="text-sm font-bold text-gold uppercase tracking-widest mb-3 flex items-center gap-2">
                 <QrCode size={18} /> Escáner de Acceso / Búsqueda Predictiva
               </label>
               <div className="relative">
                 <input 
                   ref={inputRef}
                   type="text" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   autoFocus
                   placeholder="Escanea el código de barras, CURP o teclea el nombre..."
                   className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl pl-14 pr-6 py-5 text-xl font-medium text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/20 transition shadow-inner"
                 />
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                 <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-gold text-black font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-[#b8952a] transition shadow-md active:scale-95">
                    Entrar
                 </button>
               </div>
               <p className="text-xs text-slate-500 mt-3 flex items-center gap-2"><KeyRound size={12}/> El campo está siempre activo para lectores de códigos (Auto-focus habilitado).</p>
            </form>

            <div className={`flex-1 rounded-2xl border flex flex-col items-center justify-center p-8 transition-all duration-300 shadow-xl ${
               !lastScanned ? 'bg-oxford border-slate-700/60 opacity-80' : 
               lastScanned.error ? 'bg-danger/10 border-danger/40 shadow-[0_0_30px_rgba(239,68,68,0.15)]' :
               lastScanned.entry.isOk ? 'bg-[#22C55E]/10 border-[#22C55E]/40 shadow-[0_0_30px_rgba(34,197,94,0.15)]' : 
               'bg-danger/10 border-danger/40 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
            }`}>
               
               {!lastScanned ? (
                  <div className="text-center opacity-40">
                     <QrCode size={100} className="mx-auto mb-6 text-slate-400" />
                     <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Esperando Cliente...</h2>
                  </div>
               ) : lastScanned.error ? (
                  <div className="text-center animate-in zoom-in duration-300">
                     <UserX size={100} className="mx-auto mb-6 text-danger" />
                     <h2 className="text-4xl font-black text-white mb-2">¡NO ENCONTRADO!</h2>
                     <p className="text-slate-400 text-lg">El código <span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded">"{lastScanned.term}"</span> no coincide con nadie en la base de datos.</p>
                  </div>
               ) : (
                  <div className="text-center w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                     <div className={`w-40 h-40 mx-auto rounded-full border-8 shadow-2xl overflow-hidden flex items-center justify-center text-5xl font-bold bg-slate-800 mb-6 relative ${lastScanned.entry.isOk ? 'border-[#22C55E]' : 'border-danger'}`}>
                        {lastScanned.photo_url || lastScanned.photo ? (
                           <img src={lastScanned.photo_url || lastScanned.photo} alt="profile" className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-slate-500">{lastScanned.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)}</span>
                        )}
                        {!lastScanned.entry.isOk && (
                           <div className="absolute inset-0 bg-danger/30 backdrop-blur-[2px] flex items-center justify-center">
                             <X size={60} className="text-white drop-shadow-lg" />
                           </div>
                        )}
                     </div>
                     
                     <h2 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight">{lastScanned.name}</h2>
                     <p className="text-slate-400 font-mono text-lg mb-8 uppercase tracking-widest">Socio #{lastScanned.id}</p>

                     <div className={`w-full rounded-2xl p-6 border-2 flex items-center justify-center gap-4 ${lastScanned.entry.isOk ? 'bg-[#22C55E] border-[#16a34a] text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-danger border-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>
                        {lastScanned.entry.isOk ? <UserCheck size={40} /> : <AlertBannerIcon />}
                        <div className="text-left">
                           <h3 className="text-3xl font-black uppercase tracking-widest">{lastScanned.entry.isOk ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}</h3>
                           <p className="text-sm font-bold opacity-80 uppercase tracking-widest mt-1">
                             Status: {lastScanned.status} {lastScanned.alert && '(VENCIDO)'}
                           </p>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>

         <div className="bg-oxford border border-slate-700/60 rounded-2xl shadow-lg flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-700/60 bg-slate-800/80 shrink-0 flex items-center justify-between">
               <h3 className="text-lg font-bold text-white flex items-center gap-2"><Clock size={18} className="text-gold"/> Bitácora de Hoy</h3>
               <span className="bg-slate-900 border border-slate-700 text-slate-300 text-xs font-black px-2.5 py-1 rounded-md">{dailyLog.length} Accesos</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
               {dailyLog.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 p-6 text-center">
                    <Clock size={48} className="mb-4" />
                    <p className="font-medium">Nadie ha ingresado todavía el día de hoy.</p>
                 </div>
               ) : (
                 <div className="space-y-1">
                    {dailyLog.map((log: any, idx: number) => (
                       <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition border border-transparent hover:border-slate-700 group">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 border ${log.isOk ? 'border-[#22C55E]' : 'border-danger'} bg-slate-900`}>
                             {log.photo ? (
                                <img src={log.photo} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                             ) : (
                                <span className="text-xs font-bold text-slate-500">{log.name.substring(0,2).toUpperCase()}</span>
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-sm font-bold text-white truncate">{log.name}</p>
                             <p className={`text-[10px] font-black tracking-widest uppercase ${log.isOk ? 'text-[#22C55E]' : 'text-danger'}`}>{log.statusLabel}</p>
                          </div>
                          <div className="text-right shrink-0">
                             <p className="text-sm font-mono text-slate-300">{log.time}</p>
                             <p className="text-[10px] font-bold text-slate-500 uppercase">HRA</p>
                          </div>
                       </div>
                    ))}
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

function AlertBannerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
       <line x1="15" y1="9" x2="9" y2="15"></line>
       <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  );
}
