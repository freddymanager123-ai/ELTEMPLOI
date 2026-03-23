"use client";
import { useState, useEffect } from "react";
import { CreditCard, Search, User, Calendar, DollarSign, Wallet, Link as LinkIcon, Smartphone, CheckCircle, Receipt, Send } from "lucide-react";

// Mock Plans
const PLANES = [
  { id: 1, name: "Visita (1 Día)", price: 80, days: 1 },
  { id: 2, name: "Semana", price: 250, days: 7 },
  { id: 3, name: "Mensualidad Base", price: 600, days: 30 },
  { id: 4, name: "Mensualidad + Coach", price: 900, days: 30 },
  { id: 5, name: "Trimestre", price: 1500, days: 90 },
  { id: 6, name: "Anualidad VIP", price: 5000, days: 365 },
];

export default function PagosPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH"); // CASH, CARD_TERMINAL, MP_LINK
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completedTicket, setCompletedTicket] = useState<any | null>(null);
  const [planes, setPlanes] = useState<any[]>(PLANES);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clientes');
        if (response.ok) {
          const data = await response.json();
          const formatted = data.map((c: any) => ({
            ...c,
            name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
            alert: c.status !== 'ACTIVE' && c.status !== 'ACTIVO (PLAN)'
          }));
          setClients(formatted);
        }
      } catch (error) {
        console.error('Error fetching clients for pagos:', error);
      }
    };
    
    fetchClients();

    // Load dynamic planes
    const fetchPlanes = async () => {
      try {
        const res = await fetch('/api/planes');
        if (res.ok) {
          const data = await res.json();
          setPlanes(data.map((p: any) => ({
            ...p,
            id: p.id.toString(),
            price: Number(p.price),
            days: Number(p.duration_days || p.days || 30)
          })));
        }
      } catch (error) {
        console.error('Error fetching planes:', error);
      }
    };
    
    fetchPlanes();
  }, []);

  const filteredClients = searchTerm.length >= 2 
    ? clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())))
    : [];

  const handleProcessPayment = async () => {
    if (!selectedClient || !selectedPlan) return;
    setIsProcessing(true);

    // Integración Mercado Pago para Tarjetas y Links MP
    if (paymentMethod === "CARD_TERMINAL" || paymentMethod === "MP_LINK") {
      let paymentWindow: Window | null = null;
      try {
        paymentWindow = window.open('about:blank', '_blank');
      } catch (e) {
        console.warn("Popups bloqueados", e);
      }

      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: selectedClient.id,
            planId: selectedPlan.id,
            description: `Membresía El Templo - ${selectedPlan.name}`,
            price: selectedPlan.price,
            quantity: 1
          })
        });
        
        const data = await response.json();
        
        if (data.initPoint) {
           if (paymentWindow) {
             paymentWindow.location.href = data.initPoint; 
           } else {
             window.location.href = data.initPoint; 
             return; 
           }
        } else {
           if (paymentWindow) paymentWindow.close();
           alert("Error MP: " + (data.details || "Falló al crear preferencia. Revise credenciales en .env.local"));
           setIsProcessing(false);
           return;
        }
      } catch (err) {
         if (paymentWindow) paymentWindow.close();
         alert("Error conectando con Mercado Pago.");
         setIsProcessing(false);
         return;
      }
    }

    // Registro local del pago
    setTimeout(async () => {
      if (selectedClient && selectedPlan) {
        try {
          // Send update to database API
          await fetch(`/api/clientes/${selectedClient.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ACTIVO (PLAN)' })
          });
          
          setClients(prev => prev.map(c => {
            if (c.id === selectedClient.id) {
              return { ...c, status: "ACTIVO (PLAN)", alert: false };
            }
            return c;
          }));
        } catch (error) {
          console.error("Error updating client status:", error);
        }
      }

      // Add to treasury
      const transaccion = {
        id: "TKT-" + Date.now().toString().slice(-6),
        fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        cliente: selectedClient ? selectedClient.name : "Invitado",
        clienteActivo: true,
        reference_type: 'MEMBRESIA',
        elementos: [{ name: `Membresía: ${selectedPlan?.name}`, quantity: 1, price: selectedPlan?.price }],
        total: selectedPlan?.price || 0,
        metodo: paymentMethod === 'CARD_TERMINAL' ? 'CARD' : paymentMethod,
        cajero: "Administrador (En línea)"
      };

      try {
        await fetch('/api/finanzas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaccion)
        });
      } catch (err) {
        console.error("No se pudo guardar la transacción contable:", err);
      }

      // 2. Show Ticket
      setIsProcessing(false);
      setPaymentSuccess(true);
      setCompletedTicket(transaccion);
    }, 1500); // Simulate local processing delay after successful API or local cash
  };

  const closeReceipt = () => {
    setCompletedTicket(null);
    setPaymentSuccess(false);
    setSelectedClient(null);
    setSelectedPlan(null);
    setSearchTerm("");
  };

  return (
    <div className="space-y-6 lg:h-[calc(100vh-4rem)] flex flex-col min-h-screen">
      <header className="print:hidden">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Pagos e Inscripciones
        </h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">
          Renovaciones de mensualidad, pre-inscripciones y cobros integrados vía Mercado Pago.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-y-auto lg:overflow-hidden print:hidden">
        
        {/* Panel Izquierdo: Selección */}
        <div className="w-full lg:w-7/12 flex flex-col gap-6 lg:overflow-y-auto custom-scrollbar pb-6 pr-2">
          
          {/* Buscar Cliente */}
          <div className="bg-oxford p-6 rounded-2xl border border-slate-700/60 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-gold" />
              1. Seleccionar Cliente
            </h2>
            
            {!selectedClient ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Escribe el nombre del cliente (Min. 2 letras)" 
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition text-lg shadow-inner"
                  />
                </div>
                
                {filteredClients.length > 0 && (
                  <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredClients.map((client, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setSelectedClient(client)}
                        className="w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800 transition flex justify-between items-center"
                      >
                        <div>
                          <p className="text-white font-bold">{client.name}</p>
                          <p className="text-slate-400 text-xs">{client.phone} | Status: <span className={client.alert ? 'text-danger font-bold' : 'text-gold'}>{client.status}</span></p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchTerm.length >= 2 && filteredClients.length === 0 && (
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center text-slate-400">
                    No se encontraron clientes. Regístralo primero en el Directorio.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-gold/30 rounded-xl p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-800 border border-gold/50 flex items-center justify-center font-bold text-gold text-lg shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                    {selectedClient.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{selectedClient.name}</p>
                    <p className="text-slate-400 text-sm">{selectedClient.email || "Sin correo"}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedClient(null)} 
                  className="text-slate-400 hover:text-white px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg transition text-sm font-medium"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>

          {/* Seleccionar Plan */}
          <div className={`bg-oxford p-6 rounded-2xl border border-slate-700/60 shadow-lg transition-opacity duration-300 ${!selectedClient ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-gold" />
              2. Seleccionar Plan de Membresía
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {planes.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative p-4 rounded-xl border-2 transition-all flex flex-col text-left ${
                    selectedPlan?.id === plan.id 
                      ? 'border-gold bg-gold/10 shadow-[0_0_15px_rgba(212,175,55,0.15)] scale-[1.02]' 
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  {selectedPlan?.id === plan.id && (
                    <div className="absolute top-2 right-2 flex items-center justify-center bg-gold text-black rounded-full h-5 w-5">
                      <CheckCircle size={14} className="stroke-[3]" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-300 mb-1">{plan.name}</span>
                  <span className="text-xl font-black text-white">${plan.price.toFixed(2)} <span className="text-xs font-normal text-slate-500">MXN</span></span>
                  <span className="text-xs text-gold mt-2 font-medium">{plan.days} Días de acceso</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Panel Derecho: Resumen y Metodo de Pago */}
        <div className="w-full lg:w-5/12">
          <div className="bg-oxford p-6 rounded-2xl border border-slate-700/60 shadow-lg h-full flex flex-col sticky top-0">
            <h2 className="text-lg font-bold text-white mb-6 border-b border-slate-700/50 pb-4">Resumen de Cobro</h2>
            
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center text-slate-300">
                <span>Subtotal</span>
                <span className="font-mono text-lg">${selectedPlan ? selectedPlan.price.toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex justify-between items-center text-gold/70">
                <span>Descuento Aplicado</span>
                <span className="font-mono text-lg">-$0.00</span>
              </div>
              <div className="flex justify-between items-center text-white border-t border-slate-700 pt-4 mt-2">
                <span className="text-xl font-bold">Total a Cobrar</span>
                <span className="text-3xl font-black text-gold">${selectedPlan ? selectedPlan.price.toFixed(2) : "0.00"}</span>
              </div>

              {/* Métodos de Pago */}
              <div className={`pt-6 transition-opacity duration-300 ${!selectedPlan ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Forma de Pago</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setPaymentMethod("CASH")}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border ${paymentMethod === 'CASH' ? 'bg-slate-800 border-white text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'} transition`}
                  >
                    <div className="flex items-center gap-3 font-semibold"><Wallet size={20} /> Efectivo en Caja</div>
                    {paymentMethod === 'CASH' && <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_white]"></div>}
                  </button>
                  
                  <button 
                    onClick={() => setPaymentMethod("CARD_TERMINAL")}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border ${paymentMethod === 'CARD_TERMINAL' ? 'bg-slate-800 border-white text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'} transition`}
                  >
                    <div className="flex items-center gap-3 font-semibold"><CreditCard size={20} /> Terminal de Tarjeta</div>
                    {paymentMethod === 'CARD_TERMINAL' && <div className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_white]"></div>}
                  </button>

                  <button 
                    onClick={() => setPaymentMethod("MP_LINK")}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border ${paymentMethod === 'MP_LINK' ? 'bg-[#009EE3]/10 border-[#009EE3] text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-[#009EE3] hover:bg-[#009EE3]/5 hover:text-[#009EE3]'} transition group`}
                  >
                    <div className="flex items-center gap-3 font-semibold group-hover:text-[#009EE3] transition-colors"><Smartphone size={20} /> Enviar Link (Mercado Pago)</div>
                    {paymentMethod === 'MP_LINK' && <div className="h-2 w-2 rounded-full bg-[#009EE3] shadow-[0_0_8px_#009EE3]"></div>}
                  </button>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
              {paymentSuccess ? (
                <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-[#22C55E] animate-in slide-in-from-bottom-2 duration-300">
                  <CheckCircle size={32} />
                  <p className="font-bold text-center">¡Pago Procesado Exitosamente!</p>
                  <p className="text-xs text-center text-[#22C55E]/80">La membresía de {selectedClient?.name} ha sido actualizada en la BD.</p>
                </div>
              ) : (
                <button 
                  disabled={!selectedClient || !selectedPlan || isProcessing}
                  onClick={handleProcessPayment}
                  className="w-full py-4 bg-gold hover:bg-[#b8952a] text-black font-extrabold text-lg rounded-xl transition shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
                >
                  {isProcessing ? (
                    <span className="animate-pulse">Procesando...</span>
                  ) : paymentMethod === 'MP_LINK' ? (
                    <><LinkIcon size={20} /> Generar Link de Cobro</>
                  ) : (
                    <><DollarSign size={20} /> Recibir ${selectedPlan ? selectedPlan.price.toFixed(2) : "0.00"}</>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Modal / Overlay del Recibo */}
      {completedTicket && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:absolute print:inset-0 print:bg-white print:p-0">
          
          <div id="receipt-content" className="bg-[#fdfdfd] text-black border border-slate-300 rounded-none w-full max-w-sm shadow-[0_0_40px_rgba(0,0,0,0.5)] relative flex flex-col animate-in zoom-in duration-300 font-mono print:shadow-none print:border-none print:m-0 print:w-auto" onClick={e => e.stopPropagation()}>
            <div className="h-3 w-full" style={{ backgroundImage: 'radial-gradient(circle at 5px 0, transparent 4px, #fdfdfd 5px)', backgroundSize: '10px 10px', backgroundRepeat: 'repeat-x', transform: 'rotate(180deg)' }}></div>
            
            <div className="pt-8 px-8 pb-10">
              <div className="text-center mb-8 flex flex-col items-center">
                <img src="/templo.jpg" alt="EL TEMPLO GYM" className="w-32 h-auto object-contain mx-auto mb-3" />
                <div className="border-b-2 border-black/80 w-full mb-3 pb-2"></div>
                <p className="text-xs mb-1 font-bold">CAJERO: {completedTicket.cajero.toUpperCase()}</p>
                <p className="text-xs ">{completedTicket.fecha} - {completedTicket.hora}</p>
                <div className="mt-3 flex justify-center">
                  <span className="text-xs font-bold border-2 border-dashed border-black px-3 py-1 bg-black/5">TKT: {completedTicket.id}</span>
                </div>
              </div>

              <div className="mb-6 bg-black/5 p-3 rounded-sm border border-black/10">
                <p className="text-[10px] uppercase font-bold tracking-wider mb-1">=== ASIGNADO A ===</p>
                <p className="text-sm font-black uppercase truncate">{completedTicket.cliente}</p>
                {completedTicket.cliente !== "Público General" && (
                   <div className="mt-1 flex items-center gap-2">
                     <span className="text-[10px] bg-black text-white px-2 py-0.5 font-bold uppercase rounded-sm">
                       {completedTicket.clienteActivo ? 'VIGENTE' : 'VENCIDO'}
                     </span>
                     <span className="text-[10px]">SOCIO GYM</span>
                   </div>
                )}
              </div>

              <table className="w-full text-xs mb-8">
                <thead>
                  <tr className="border-b-2 border-black text-left font-black">
                    <th className="py-2 w-8 text-center">CANT</th>
                    <th className="py-2">DESCRIPCIÓN</th>
                    <th className="py-2 text-right">MONTO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {completedTicket.elementos.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2 text-center font-bold">{item.quantity}</td>
                      <td className="py-2 pr-2">{item.name}</td>
                      <td className="py-2 text-right overflow-hidden whitespace-nowrap overflow-ellipsis" style={{ maxWidth: '60px' }}>
                         ${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t-2 border-black pt-4 mb-2">
                <div className="flex justify-between items-end text-lg font-black uppercase">
                  <span>TOTAL MXN</span>
                  <span className="text-2xl">${completedTicket.total.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-right font-bold tracking-widest bg-black text-white py-1 px-2 float-right mt-1">
                PAGO: {completedTicket.metodo === 'CASH' ? 'EFECTIVO' : completedTicket.metodo === 'CARD' ? 'TARJETA' : completedTicket.metodo === 'MP_LINK' ? 'LINK PAGO' : 'TRANSFERENCIA'}
              </p>
              <div className="clear-both"></div>
              
              <div className="mt-12 text-center text-xs space-y-4 print:hidden">
                <p className="uppercase font-bold tracking-wider">¡GRACIAS POR TU PAGO!</p>
                <button onClick={() => window.print()} className="mt-6 w-full py-3 border-2 border-black rounded-sm hover:bg-black hover:text-white transition uppercase font-black tracking-widest text-sm flex justify-center items-center gap-2" title="Imprimir Recibo Termal">
                  <Receipt size={18} /> IMPRIMIR RECIBO
                </button>
                <button onClick={() => {
                   let text = `*EL TEMPLO GYM*\n¡Hola! Aquí tienes tu comprobante de pago de membresía. 🏋️‍♂️\n\n`;
                   text += `*TKT:* ${completedTicket.id}\n`;
                   text += `*SOCIO:* ${completedTicket.cliente}\n\n*DETALLE:*\n`;
                   completedTicket.elementos.forEach((item: any) => { text += `- ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toFixed(2)})\n`; });
                   text += `\n*TOTAL MXN:* $${completedTicket.total.toFixed(2)}\n`;
                   text += `*FECHA:* ${completedTicket.fecha} ${completedTicket.hora}\n\n`;
                   text += `¡Gracias por entrenar con nosotros! 💪`;
                   window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                }} className="mt-2 w-full py-3 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-sm transition uppercase font-black tracking-widest text-sm flex justify-center items-center gap-2 shadow-sm" title="Enviar vía WhatsApp">
                  <Send size={18} /> ENVIAR WHATSAPP
                </button>
                <button onClick={closeReceipt} className="text-slate-500 hover:text-black underline uppercase text-[10px] pt-4 block w-full">Finalizar y Cerrar</button>
              </div>
            </div>
            
            <div className="h-3 w-full" style={{ backgroundImage: 'radial-gradient(circle at 5px 0, transparent 4px, #fdfdfd 5px)', backgroundSize: '10px 10px', backgroundRepeat: 'repeat-x' }}></div>
          </div>

          <div className="absolute top-6 right-8 opacity-70 print:hidden">
            <p className="text-white text-sm font-mono tracking-widest animate-pulse">Previsualización de Ticket Digital</p>
          </div>
        </div>
      )}
    </div>
  );
}
