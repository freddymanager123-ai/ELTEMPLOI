"use client";
import { useState, useMemo, useEffect } from "react";
import { ShoppingBag, Search, Plus, Minus, Trash2, Wallet, CreditCard, Receipt, CheckCircle, User, X, BookOpen, Send } from "lucide-react";

const INITIAL_PRODUCTS = [
  { id: "1", name: "Proteína Whey Fx", price: 1200, category: "Suplementos", image: "🥤", stock: 12 },
  { id: "2", name: "Pre-entreno C4", price: 850, category: "Suplementos", image: "⚡", stock: 5 },
  { id: "3", name: "Creatina Monohidratada", price: 600, category: "Suplementos", image: "💊", stock: 0 },
  { id: "4", name: "Agua Natural 1L", price: 20, category: "Bebidas", image: "💧", stock: 48 },
  { id: "5", name: "Gatorade Morado", price: 35, category: "Bebidas", image: "🧃", stock: 24 },
  { id: "6", name: "Bebida Energética Monster", price: 50, category: "Bebidas", image: "🔋", stock: 15 },
  { id: "7", name: "Playera Dry-Fit Templo", price: 350, category: "Ropa", image: "👕", stock: 8 },
  { id: "8", name: "Shaker Metálico", price: 250, category: "Accesorios", image: "🫙", stock: 3 },
  { id: "9", name: "Toalla Microfibra", price: 120, category: "Accesorios", image: "🧣", stock: 10 },
  { id: "10", name: "Straps para Levantamiento", price: 200, category: "Accesorios", image: "🏋️", stock: 6 },
  { id: "11", name: "Barra Energética Avena", price: 40, category: "Snacks", image: "🍫", stock: 30 },
];

const CATEGORIAS = ["Todas", "Bebidas", "Suplementos", "Ropa", "Accesorios", "Snacks"];

export default function VentasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [clients, setClients] = useState<any[]>([]);
  
  // Client selection for POS
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  
  // Quick Add Client Modal
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: '', phone: '' });
  
  // Receipt
  const [completedTicket, setCompletedTicket] = useState<any>(null);

  useEffect(() => {
    // Cargar Inventario
    const saved = localStorage.getItem('templo_productos_data');
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (e) {}
    } else {
      localStorage.setItem('templo_productos_data', JSON.stringify(INITIAL_PRODUCTS));
    }
    
    // Cargar Directorio de Clientes
    const savedClients = localStorage.getItem('templo_clients_data');
    if (savedClients) {
      try {
        setClients(JSON.parse(savedClients));
      } catch (error) {}
    }
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchName = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === "Todas" || product.category === selectedCategory;
      return matchName && matchCat;
    });
  }, [searchTerm, selectedCategory, products]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`¡Límite alcanzado! Solo quedan ${product.stock} unidades en stock.`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      if (product.stock <= 0) {
        alert("Producto Agotado");
        return prev;
      }
      return [...prev, { ...product, quantity: 1, maxStock: product.stock }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        if (newQ > item.maxStock) {
           alert("No hay más unidades en stock.");
           return item;
        }
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; 

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "CREDIT" && (!selectedClient || selectedClient.id === "EXTERNO")) {
       alert("No puedes fiar o dar crédito a Público General. Por favor selecciona a un socio registrado.");
       return;
    }
    setIsProcessing(true);

    // Integración de Mercado Pago para Tarjetas
    if (paymentMethod === "CARD") {
      // Intentar pre-abrir la ventana de forma segura
      let paymentWindow: Window | null = null;
      try {
        paymentWindow = window.open('about:blank', '_blank');
      } catch (e) {
        console.warn("Popups están completamente bloqueados u ocurrió un error local", e);
      }

      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: selectedClient?.id || "EXTERNO",
            description: `El Templo Gym - Venta POS (${cart.length} Artículos)`,
            price: total,
            quantity: 1
          })
        });
        
        const data = await response.json();
        
        if (data.initPoint) {
           if (paymentWindow) {
             paymentWindow.location.href = data.initPoint; // Abrir en nueva pestaña
           } else {
             window.location.href = data.initPoint; // Fallback: Pestaña actual si hubo bloqueo pop-up
             return; // Evitar que continúe si se fue en la misma pestaña
           }
        } else {
           if (paymentWindow) paymentWindow.close();
           console.error("MP Error:", data);
           alert("Alerta: Credenciales inválidas. Revise .env.local.");
           setIsProcessing(false);
           return;
        }
      } catch (err) {
         if (paymentWindow) paymentWindow.close();
         console.error("MP Request Error:", err);
         alert("Error conectando con MP.");
         setIsProcessing(false);
         return;
      }
    }
    
    // El sistema continúa con el registro local del ticket después de abrir MP
    setTimeout(() => {
      setIsProcessing(false);
      
      const transaccion = {
        id: "TKT-" + Date.now().toString().slice(-6),
        fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        cliente: selectedClient ? selectedClient.name : "Público General",
        clienteActivo: selectedClient ? (selectedClient.status === "ACTIVO" || selectedClient.status === "VENCIDO" || selectedClient.status === "INACTIVO (SIN PLAN)") : false, // Identificador de que está en base de datos
        elementos: cart,
        total: total,
        metodo: paymentMethod,
        estadoCredito: paymentMethod === 'CREDIT' ? 'PENDIENTE' : 'PAGADO',
        cajero: "Administrador (En línea)"
      };

      // Guardar en Array de Entradas/Salidas Históricas en localStorage
      const guardadas = localStorage.getItem('templo_transacciones');
      const historial = guardadas ? JSON.parse(guardadas) : [];
      localStorage.setItem('templo_transacciones', JSON.stringify([transaccion, ...historial]));

      // ACTUALIZAR INVENTARIO (RESTO DEL STOCK)
      const savedProducts = localStorage.getItem('templo_productos_data');
      if (savedProducts) {
        let inv = JSON.parse(savedProducts);
        cart.forEach(cartItem => {
           inv = inv.map((p: any) => p.id === cartItem.id ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) } : p);
        });
        localStorage.setItem('templo_productos_data', JSON.stringify(inv));
        setProducts(inv); // Refresh available stock on screen
      }

      setCompletedTicket(transaccion);
    }, 1500);
  };

  const handleQuickAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientData.name.trim()) return;

    const newClient = {
      id: "CLI" + Date.now().toString().slice(-6),
      name: newClientData.name,
      contact: newClientData.phone || "Sin teléfono",
      status: "INACTIVO (SIN PLAN)", 
      end: "N/A",
      alert: true, 
      stateClass: "bg-slate-800 text-slate-400 border-slate-700"
    };

    const savedClients = localStorage.getItem('templo_clients_data');
    const parsedClients = savedClients ? JSON.parse(savedClients) : [];
    const updatedClients = [newClient, ...parsedClients];
    
    localStorage.setItem('templo_clients_data', JSON.stringify(updatedClients));
    setClients(updatedClients);
    
    setSelectedClient(newClient);
    setIsNewClientModalOpen(false);
    setNewClientData({ name: '', phone: '' });
  };

  const closeReceipt = () => {
    setCompletedTicket(null);
    setCart([]);
    setSelectedClient(null);
    setClientSearch("");
  };

  return (
    <div className="space-y-6 lg:h-[calc(100vh-4rem)] flex flex-col pt-1">
      <header className="shrink-0 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Punto de Venta (POS)
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Sistema de cobro, asignación de cuentas y generador de recibos.
          </p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden print:hidden">
        
        {/* Panel Izquierdo: Catálogo */}
        <div className="w-full lg:w-7/12 flex flex-col gap-4 overflow-hidden">
          
          <div className="bg-oxford p-4 rounded-2xl border border-slate-700/60 shadow-lg flex flex-col sm:flex-row gap-4 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar artículos..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner"
              />
            </div>
            <div className="flex overflow-x-auto gap-2 pb-2 sm:pb-0 scrollbar-hide shrink-0 items-center">
              {CATEGORIAS.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm transition font-medium ${selectedCategory === cat ? 'bg-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-oxford p-6 rounded-2xl border border-slate-700/60 shadow-lg flex-1 overflow-y-auto custom-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <ShoppingBag size={48} className="mb-4 opacity-50" />
                <p>No se encontraron productos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => product.stock > 0 && addToCart(product)}
                    className={`bg-slate-900 border ${product.stock > 0 ? 'border-slate-700 hover:border-gold/50 cursor-pointer active:scale-95 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-danger/40 opacity-50 cursor-not-allowed'} rounded-xl p-4 flex flex-col items-center text-center transition-all group relative`}
                  >
                    {product.stock <= 3 && product.stock > 0 && <span className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full z-10 shadow-sm">Quedan {product.stock}</span>}
                    {product.stock === 0 && <span className="absolute top-2 right-2 bg-danger text-white text-[10px] font-black px-2 py-0.5 rounded-full z-10 shadow-sm">Agotado</span>}
                    
                    <div className={`text-4xl mb-3 h-12 flex items-center justify-center ${product.stock > 0 ? 'group-hover:scale-110 transition-transform' : 'grayscale text-slate-500'}`}>
                      {product.image.startsWith('data:') || product.image.startsWith('http') ? (
                        <img src={product.image} className="w-12 h-12 object-cover rounded shadow-sm" alt="product" />
                      ) : product.image}
                    </div>
                    <p className="text-white font-semibold text-sm leading-tight mb-2 line-clamp-2 h-10">{product.name}</p>
                    <p className="text-gold font-black mt-auto">${product.price.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho: Carrito / Ticket */}
        <div className="w-full lg:w-5/12">
          <div className="bg-oxford p-6 rounded-2xl border border-slate-700/60 shadow-lg h-full flex flex-col sticky top-0 relative">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-slate-700/50 pb-4 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-2"><Receipt size={20} className="text-gold" /> Ticket de Venta</span>
              <span className="text-sm bg-slate-800 px-3 py-1 rounded-full text-white">{cart.length} ítems</span>
            </h2>
            
            {/* Buscador de Cliente Activo integrado en Venta */}
            <div className="mb-4 shrink-0 bg-slate-900/50 p-3 rounded-xl border border-slate-700">
              {!selectedClient ? (
                <div className="space-y-3 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Registrar a nombre de:</label>
                    <button 
                      onClick={() => setIsNewClientModalOpen(true)}
                      className="text-xs font-bold text-gold hover:text-white transition flex items-center gap-1 bg-gold/10 hover:bg-gold/20 px-2 py-1 rounded border border-gold/30"
                    >
                      <Plus size={12} /> Registrar Socio Nuevo
                    </button>
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="text" 
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Escribe para buscar socio o añadir nombre..." 
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none"
                    />
                  </div>
                  {/* Desplegable de búsqueda de clientes */}
                  {clientSearch.length > 0 && (
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 max-h-48 overflow-y-auto bg-slate-800 border border-slate-600 rounded-xl shadow-2xl custom-scrollbar">
                      
                      {/* Opción para registrar nombre sin ser socio */}
                      <button 
                        onClick={() => {
                          setSelectedClient({ name: clientSearch, status: "EXTERNO", id: "EXTERNO" });
                          setClientSearch("");
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gold hover:bg-slate-700/80 border-b border-slate-700 flex justify-between items-center transition bg-slate-800/50"
                      >
                        <span className="font-bold truncate max-w-[200px]">Usar "{clientSearch}"</span> 
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-700 text-white border border-slate-500 whitespace-nowrap">
                          Extra
                        </span>
                      </button>

                      {/* Resultados de Búsqueda Socios del Gym */}
                      {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                          <button 
                            key={c.id} 
                            onClick={() => {
                              setSelectedClient(c);
                              setClientSearch("");
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-slate-700 border-b border-slate-700 flex justify-between items-center transition"
                          >
                            <span className="font-bold">{c.name}</span> 
                            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${c.status === 'ACTIVO' ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/50' : 'bg-danger/20 text-danger border border-danger/50'}`}>
                              {c.status}
                            </span>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center bg-gold/10 border border-gold/40 p-3 rounded-lg shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="bg-gold/20 p-2 rounded-full hidden sm:block">
                      <User size={18} className="text-gold" />
                    </div>
                    <div>
                      <span className="text-white text-sm font-bold block leading-tight">{selectedClient.name}</span>
                      <span className="text-xs text-gold font-medium block">{selectedClient.id === "EXTERNO" ? "Compra en Mostrador (No Socio)" : `Socio (ID: ${selectedClient.id.substring(0,4).toUpperCase()})`}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedClient(null); setClientSearch(""); }}
                    className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition"
                    title="Remover cliente asociado"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 mb-6 relative z-0">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-70 mt-10">
                  <ShoppingBag size={48} className="mb-4" />
                  <p className="text-sm px-8 text-center">El carrito está vacío. Toca un producto para abrir la caja.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex gap-3 animate-in slide-in-from-right-2 duration-200 shadow-sm">
                    <div className="h-12 w-12 bg-slate-800 rounded-lg flex items-center justify-center text-2xl shrink-0 overflow-hidden border border-slate-700/50">
                      {item.image.startsWith('data:') || item.image.startsWith('http') ? (
                        <img src={item.image} className="w-full h-full object-cover" alt="item" />
                      ) : item.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-gold font-black text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col justify-between items-end gap-2 shrink-0">
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-500 hover:text-danger px-1">
                        <Trash2 size={16} />
                      </button>
                      <div className="flex items-center bg-slate-800 rounded-lg">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition"><Minus size={14} /></button>
                        <span className="w-6 text-center text-white text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition"><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Subtotal y Cobro */}
            <div className="border-t border-slate-700/50 pt-4 space-y-4 shrink-0 bg-oxford z-10 sticky bottom-0">
              <div className="flex justify-between items-center text-white">
                <span className="text-xl font-bold">Total</span>
                <span className="text-3xl font-black text-gold">${total.toFixed(2)}</span>
              </div>

              {/* Métodos de Pago POS */}
              <div className="grid grid-cols-3 gap-3 pt-2 relative z-50">
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setPaymentMethod("CASH"); }}
                  disabled={cart.length === 0}
                  className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === 'CASH' ? 'bg-gold/10 border-gold text-gold shadow-inner scale-[1.02]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                >
                  <Wallet size={24} />
                  <span className="text-xs font-bold uppercase">Efectivo</span>
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setPaymentMethod("CARD"); }}
                  disabled={cart.length === 0}
                  className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === 'CARD' ? 'bg-gold/10 border-gold text-gold shadow-inner scale-[1.02]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                >
                  <CreditCard size={24} />
                  <span className="text-xs font-bold uppercase">Tarjeta</span>
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.preventDefault(); setPaymentMethod("CREDIT"); }}
                  disabled={cart.length === 0}
                  className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === 'CREDIT' ? 'bg-gold/10 border-gold text-gold shadow-inner scale-[1.02]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                >
                  <BookOpen size={24} />
                  <span className="text-xs font-bold uppercase">Crédito</span>
                </button>
              </div>

              {/* Acciones */}
              <div className="pt-2">
                <button 
                  disabled={cart.length === 0 || isProcessing}
                  onClick={handleCheckout}
                  className="w-full py-4 bg-gold hover:bg-[#b8952a] text-black font-extrabold text-lg rounded-xl transition shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
                >
                  {isProcessing ? (
                    <span className="animate-pulse flex items-center gap-2">Procesando Venta...</span>
                  ) : (
                    <>Cobrar e Imprimir Ticket</>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Modal / Overlay del Recibo */}
      {completedTicket && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:absolute print:inset-0 print:bg-white print:p-0">
          
          <div id="receipt-content" className="bg-[#fdfdfd] text-black border border-slate-300 rounded-none w-full max-w-sm shadow-[0_0_40px_rgba(0,0,0,0.5)] relative flex flex-col animate-in zoom-in duration-300 font-mono print:shadow-none print:border-none print:m-0 print:w-auto" onClick={e => e.stopPropagation()}>
            {/* Adorno de corte de papel (CSS illusion) */}
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
                  <span>TOTAL USD</span>
                  <span className="text-2xl">${completedTicket.total.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-right font-bold tracking-widest bg-black text-white py-1 px-2 float-right mt-1">
                PAGO: {completedTicket.metodo === 'CASH' ? 'EFECTIVO' : completedTicket.metodo === 'CARD' ? 'TARJETA' : 'CRÉDITO (ADEUDO)'}
              </p>
              <div className="clear-both"></div>
              
              <div className="mt-12 text-center text-xs space-y-4 print:hidden">
                <p className="uppercase font-bold tracking-wider">¡GRACIAS POR TU COMPRA!</p>
                <button onClick={() => window.print()} className="mt-6 w-full py-3 border-2 border-black rounded-sm hover:bg-black hover:text-white transition uppercase font-black tracking-widest text-sm flex justify-center items-center gap-2" title="Imprimir Recibo Termal">
                  <Receipt size={18} /> IMPRIMIR RECIBO
                </button>
                <button onClick={() => {
                   let text = `*EL TEMPLO GYM*\n¡Hola! Aquí tienes tu comprobante de pago. 🏋️‍♂️\n\n`;
                   text += `*TKT:* ${completedTicket.id}\n`;
                   text += `*CLIENTE:* ${completedTicket.cliente}\n\n*DETALLE:*\n`;
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
            
            {/* Adorno de corte de papel bottom */}
            <div className="h-3 w-full" style={{ backgroundImage: 'radial-gradient(circle at 5px 0, transparent 4px, #fdfdfd 5px)', backgroundSize: '10px 10px', backgroundRepeat: 'repeat-x' }}></div>

          </div>

          <div className="absolute top-6 right-8 opacity-70 print:hidden">
            <p className="text-white text-sm font-mono tracking-widest animate-pulse">Previsualización de Ticket Digital</p>
          </div>
        </div>
      )}

      {/* Modal Quick Add Client */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-oxford border border-slate-700/60 rounded-2xl w-full max-w-sm shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User size={18} className="text-gold" /> Alta Rápida de Socio
              </h2>
              <button type="button" onClick={() => setIsNewClientModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg transition">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <form id="quick-client-form" onSubmit={handleQuickAddClient} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Nombre Completo <span className="text-danger">*</span></label>
                  <input required type="text" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner text-sm" placeholder="Ej. Juan Pérez" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Teléfono de Contacto</label>
                  <input type="tel" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner text-sm" placeholder="Opcional" />
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-slate-700 bg-slate-800/30 rounded-b-2xl flex justify-end gap-3">
              <button type="button" onClick={() => setIsNewClientModalOpen(false)} className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-white font-bold transition">Cancelar</button>
              <button type="submit" form="quick-client-form" className="px-5 py-2 text-sm bg-gold hover:bg-[#b8952a] text-black rounded-xl font-bold transition shadow-[0_0_15px_rgba(212,175,55,0.25)] flex items-center gap-2">
                <Plus size={16} /> Guardar Socio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
