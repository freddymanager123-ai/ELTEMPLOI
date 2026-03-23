"use client";
import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Users, DollarSign, Activity, AlertTriangle, Plus, Search, BarChart3, PieChart, Banknote } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    ingresosDia: 0,
    ingresosSemana: 0,
    ingresosMes: 0,
    pagosPendientes: 0,
    lowStockList: [] as any[]
  });

  const [ultimosCobros, setUltimosCobros] = useState<any[]>([]);
  const [expiringClients, setExpiringClients] = useState<any[]>([]);

  const parseDate = (dateStr: string) => {
    const parts = dateStr.split('/');
    if(parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    return new Date();
  };

  useEffect(() => {
    // 1. Ingresos y Cobros
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/finanzas');
        const trans = res.ok ? await res.json() : [];
        setUltimosCobros(trans.slice(0, 5)); // Last 5
        
        // Calcular fechas
        const today = new Date();
        today.setHours(0,0,0,0);

        const dayOfWeek = today.getDay();
        const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(diffToMonday);
        
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        let iDia = 0, iSemana = 0, iMes = 0, pend = 0;

        trans.forEach((t: any) => {
           if (t.estadoCredito === 'PENDIENTE') {
              pend += (t.total || 0); // Deuda pendiente sumada
           } else {
              // Si está pagado (CASH, CARD, etc) o fue CRÉDITO LIQUIDADO
              const rawDateStr = t.fechaLiquidacion || t.fecha;
              const tDate = parseDate(rawDateStr);
              
              if (tDate && tDate.getTime() >= today.getTime()) iDia += (t.total || 0);
              if (tDate && tDate.getTime() >= startOfWeek.getTime()) iSemana += (t.total || 0);
              if (tDate && tDate.getTime() >= startOfMonth.getTime()) iMes += (t.total || 0);
           }
        });

        // 2. Inventario
        let lowStock: any[] = [];
        try {
          const prodRes = await fetch('/api/productos');
          if (prodRes.ok) {
            const prods = await prodRes.json();
            lowStock = prods.filter((p: any) => p.stock <= 3).sort((a: any, b: any) => a.stock - b.stock);
          }
        } catch(e){}
        
        setStats({
          ingresosDia: iDia,
          ingresosSemana: iSemana,
          ingresosMes: iMes,
          pagosPendientes: pend,
          lowStockList: lowStock
        });

        // 3. Membresías por vencer en los próximos 3 días
        const parseDate = (dateStr: string) => {
          if (!dateStr) return null;
          const parts = dateStr.split('/');
          if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
          return null;
        };

        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        threeDaysFromNow.setHours(23, 59, 59, 999);

        // Group by client name, get the latest membership per client
        const clientMemberships: Record<string, any> = {};
        trans.forEach((t: any) => {
          if (t.reference_type === 'MEMBRESIA' && t.fecha_vencimiento && t.cliente) {
            const existing = clientMemberships[t.cliente];
            const tDate = parseDate(t.fecha);
            const eDate = parseDate(existing?.fecha);
            if (!existing || (tDate && eDate && tDate.getTime() > eDate.getTime())) {
              clientMemberships[t.cliente] = t;
            }
          }
        });

        const expiring = Object.values(clientMemberships).filter((t: any) => {
          const vDate = parseDate(t.fecha_vencimiento);
          if (!vDate) return false;
          const now = today;
          return vDate.getTime() >= now.getTime() && vDate.getTime() <= threeDaysFromNow.getTime();
        }).map((t: any) => ({
          name: t.cliente,
          plan: t.elementos?.[0]?.name || 'Membresía',
          vence: t.fecha_vencimiento,
          diasRestantes: Math.ceil(((parseDate(t.fecha_vencimiento)?.getTime() || 0) - today.getTime()) / (1000 * 60 * 60 * 24))
        })).sort((a: any, b: any) => a.diasRestantes - b.diasRestantes);

        setExpiringClients(expiring);
      } catch (err) {
        console.error("Dashboard error:", err);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">¡Buen día, Admin!</h1>
        <p className="text-slate-400 mt-1">Resumen general de operaciones - EL TEMPLO GYM</p>
      </header>

      {/* Tarjetas de Métricas Solidas (Estilo Reference) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        <SolidMetricCard title="Ingresos del Día" value={stats.ingresosDia.toFixed(2)} icon={Banknote} gradient="bg-gradient-to-br from-[#0891b2] to-[#164e63]" />
        <SolidMetricCard title="Ingresos de la Semana" value={stats.ingresosSemana.toFixed(2)} icon={BarChart3} gradient="bg-gradient-to-br from-[#16a34a] to-[#14532d]" />
        <SolidMetricCard title="Ingresos del Mes" value={stats.ingresosMes.toFixed(2)} icon={PieChart} gradient="bg-gradient-to-br from-[#d97706] to-[#78350f]" />
        <SolidMetricCard title="Pagos Pendientes" value={stats.pagosPendientes.toFixed(2)} icon={AlertTriangle} gradient="bg-gradient-to-br from-[#dc2626] to-[#7f1d1d]" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
        {/* Panel Izquierdo: Alertas / Scanner */}
        <div className="col-span-1 xl:col-span-1 bg-oxford rounded-2xl p-6 border border-slate-700/60 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Alertas de Inventario</h2>
          </div>
          
          <div className="space-y-5">
            <div className="mt-2 border-slate-700/50 pt-2">
              {stats.lowStockList.length === 0 ? (
                <div className="bg-slate-800/50 p-4 rounded-xl text-xs text-center text-slate-400">Todo el inventario está sano. Ningún producto tiene 3 piezas o menos.</div>
              ) : (
                <div className="space-y-3">
                  {stats.lowStockList.map((p, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl border group hover:scale-[1.02] transition-transform ${p.stock === 0 ? 'bg-danger/10 border-danger/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl flex items-center justify-center w-10 h-10 overflow-hidden filter drop-shadow-md rounded-lg">
                          {p.image.startsWith('data:') || p.image.startsWith('http') ? (
                            <img src={p.image} className="w-full h-full object-cover border border-slate-700/50 rounded-lg" alt="prod" />
                          ) : p.image}
                        </span>
                        <div>
                          <p className="font-bold text-white text-base leading-tight">{p.name}</p>
                          <p className={`text-[11px] uppercase font-black tracking-widest mt-1 ${p.stock === 0 ? 'text-danger' : 'text-amber-500'}`}>{p.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-widest ${p.stock === 0 ? 'bg-danger text-white' : 'bg-amber-500 text-black'}`}>
                          {p.stock === 0 ? 'Agotado' : `Quedan ${p.stock}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel Derecho: Últimos Ingresos */}
        <div className="col-span-1 xl:col-span-2 bg-oxford rounded-2xl p-6 border border-slate-700/60 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Últimos Pagos Registrados</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-700/80 text-slate-400">
                  <th className="pb-4 font-semibold text-sm">Cliente</th>
                  <th className="pb-4 font-semibold text-sm">Concepto</th>
                  <th className="pb-4 font-semibold text-sm">Monto</th>
                  <th className="pb-4 font-semibold text-sm">Método</th>
                  <th className="pb-4 font-semibold text-sm text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {ultimosCobros.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">No hay ventas en el flujo contable aún.</td></tr>
                ) : (
                  ultimosCobros.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors group cursor-default">
                      <td className="py-4 font-medium text-white">{row.cliente}</td>
                      <td className="py-4 text-slate-300 text-sm max-w-[200px] truncate">{row.elementos?.[0]?.name} {row.elementos?.length > 1 ? `+${row.elementos.length - 1} prod.` : ''}</td>
                      <td className="py-4 font-bold text-white">${row.total?.toFixed(2)}</td>
                      <td className="py-4">
                        <span className="bg-slate-800/80 px-2.5 py-1 rounded text-[11px] font-black uppercase text-slate-300 border border-slate-600/50">
                           {row.metodo === 'CASH' ? 'EFECTIVO' : row.metodo === 'CARD' ? 'TARJETA' : 'ENLACE / MP'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-gold text-xs font-black uppercase bg-gold/5 px-2.5 py-1 rounded border border-gold/10">Contabilizado</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Panel: Membresías por Vencer */}
      <div className="mt-6 bg-oxford rounded-2xl p-6 border border-danger/40 shadow-[0_0_20px_rgba(239,68,68,0.08)] shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-2.5 w-2.5 rounded-full bg-danger animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
          <h2 className="text-xl font-bold text-white">Membresías por Vencer <span className="text-sm font-medium text-slate-400 ml-2">(próximos 3 días)</span></h2>
        </div>
        {expiringClients.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl">
            ✅ Ningún socio vence en los próximos 3 días.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiringClients.map((c, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${
                c.diasRestantes === 0
                  ? 'bg-danger/15 border-danger/50 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                  : c.diasRestantes <= 1
                    ? 'bg-orange-500/10 border-orange-500/40'
                    : 'bg-amber-500/10 border-amber-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                    c.diasRestantes === 0 ? 'bg-danger text-white' : c.diasRestantes <= 1 ? 'bg-orange-500 text-white' : 'bg-amber-500 text-black'
                  }`}>
                    {c.name.split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm leading-tight">{c.name}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{c.plan}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`block text-xs font-black uppercase px-2.5 py-1 rounded-lg ${
                    c.diasRestantes === 0 ? 'bg-danger text-white' : c.diasRestantes <= 1 ? 'bg-orange-500 text-white' : 'bg-amber-500 text-black'
                  }`}>
                    {c.diasRestantes === 0 ? 'HOY' : c.diasRestantes === 1 ? 'MAÑANA' : `${c.diasRestantes} días`}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">{c.vence}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SolidMetricCard({ title, value, icon: Icon, gradient }: any) {
  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.3)] ${gradient} text-white flex flex-col group`}>
       <div className="p-6 flex-1 z-10">
          <h3 className="text-3xl lg:text-4xl font-black mb-1 drop-shadow-md tracking-tight">${value}</h3>
          <p className="text-sm lg:text-base font-medium opacity-90">{title}</p>
       </div>
       {/* Icon Watermark */}
       <div className="absolute right-[-10px] top-[10px] opacity-20 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 pointer-events-none z-0">
          <Icon size={96} />
       </div>
    </div>
  );
}
