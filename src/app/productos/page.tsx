"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X, Package, AlertTriangle, LayoutGrid, List, Upload } from "lucide-react";

export const INITIAL_PRODUCTS = [
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

const CATEGORIAS_OPCIONES = ["Bebidas", "Suplementos", "Ropa", "Accesorios", "Snacks"];
const CATEGORIAS_FILTRO = ["Todas", ...CATEGORIAS_OPCIONES];

const EMOJI_OPTIONS = ["🥤", "⚡", "💊", "💧", "🧃", "🔋", "👕", "🫙", "🧣", "🏋️", "🍫", "🍎", "🥛", "👕", "👖", "🧢", "🎒", "🥊", "🧘", "💪"];

export default function ProductosPage() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [formData, setFormData] = useState({ id: null as string | null, name: '', price: '', stock: '', category: 'Suplementos', image: '🥤' });

  useEffect(() => {
    const saved = localStorage.getItem('templo_productos_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Parchar productos viejos que no tenían la propiedad stock
        const patched = parsed.map((p: any) => ({
          ...p,
          stock: typeof p.stock === 'number' ? p.stock : 0
        }));
        setProducts(patched);
        // Guardar el parche
        localStorage.setItem('templo_productos_data', JSON.stringify(patched));
      } catch (e) {}
    } else {
      localStorage.setItem('templo_productos_data', JSON.stringify(INITIAL_PRODUCTS));
    }
  }, []);

  const handleEdit = (product: any) => {
    setFormData({
      id: product.id,
      name: product.name,
      price: (product.price || 0).toString(),
      stock: (product.stock || 0).toString(),
      category: product.category || 'Suplementos',
      image: product.image || '🥤'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto del inventario?")) {
      const updated = products.filter((p: any) => p.id !== id);
      setProducts(updated);
      localStorage.setItem('templo_productos_data', JSON.stringify(updated));
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
        const MAX_SIZE = 300; // Reducir a 300px max para optimizar localStorage
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
        
        // Export base64 con calidad 60% para economizar string size en LocalStorage
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setFormData({ ...formData, image: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updated;
    const cleanPrice = parseFloat(formData.price) || 0;
    const cleanStock = parseInt(formData.stock) || 0;

    if (formData.id) {
      updated = products.map((p: any) => 
        p.id === formData.id ? { ...p, name: formData.name, price: cleanPrice, stock: cleanStock, category: formData.category, image: formData.image } : p
      );
    } else {
      updated = [{ id: Date.now().toString(), name: formData.name, price: cleanPrice, stock: cleanStock, category: formData.category, image: formData.image }, ...products];
    }

    setProducts(updated);
    localStorage.setItem('templo_productos_data', JSON.stringify(updated));
    setIsModalOpen(false);
    setFormData({ id: null, name: '', price: '', stock: '', category: 'Suplementos', image: '🥤' });
  };

  const filtered = products.filter(p => {
    const matchNameOrCat = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCatDropdown = selectedCategory === "Todas" || p.category === selectedCategory;
    return matchNameOrCat && matchCatDropdown;
  });

  return (
    <div className="space-y-6 lg:h-[calc(100vh-4rem)] flex flex-col pt-1">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Inventario de Productos</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Administra las existencias (stock) y los artículos de la caja registradora.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ id: null, name: '', price: '', stock: '', category: 'Suplementos', image: '🥤' });
            setIsModalOpen(true);
          }}
          className="flex-2 sm:flex-none flex items-center justify-center gap-2 bg-gold hover:bg-[#b8952a] text-black px-5 py-2.5 rounded-xl font-extrabold transition shadow-[0_0_15px_rgba(212,175,55,0.3)] w-full sm:w-auto"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </header>

      <div className="bg-oxford p-4 rounded-2xl border border-slate-700/60 shadow-lg flex flex-col md:flex-row gap-4 shrink-0 justify-between items-center">
        <div className="relative flex-1 min-w-[200px] md:max-w-[300px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner"
          />
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 sm:pb-0 scrollbar-hide flex-1 items-center">
          {CATEGORIAS_FILTRO.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm transition font-medium ${selectedCategory === cat ? 'bg-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.3)]' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-500'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-700 w-fit shrink-0">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-gold/20 text-gold shadow-sm' : 'text-slate-400 hover:text-white'}`} title="Vista de Cuadrícula">
             <LayoutGrid size={20} />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-gold/20 text-gold shadow-sm' : 'text-slate-400 hover:text-white'}`} title="Vista de Lista">
             <List size={20} />
          </button>
        </div>
      </div>

      <div className="bg-oxford border border-slate-700/60 rounded-2xl shadow-lg flex-1 overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
              {filtered.map((product, i) => (
                <div key={i} className={`bg-slate-900 border p-4 rounded-2xl flex flex-col justify-between hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all group relative ${product.stock === 0 ? 'border-danger/50 opacity-80' : product.stock <= 3 ? 'border-amber-500/50' : 'border-slate-700 hover:border-gold/50'}`}>
                  {/* Badge de Stock */}
                  <div className={`absolute -top-3 -left-3 px-3 py-1 rounded-full text-xs font-black uppercase text-white shadow-lg border ${product.stock === 0 ? 'bg-danger border-danger/80' : product.stock <= 3 ? 'bg-amber-500 border-amber-600' : 'bg-slate-700 border-slate-600'}`}>
                    {product.stock === 0 ? 'Agotado' : `Stock: ${product.stock}`}
                  </div>

                  <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(product)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-gold transition shadow-sm"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(product.id)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-danger transition shadow-sm"><Trash2 size={14} /></button>
                  </div>
                  
                  <div className="text-center mt-3">
                    <div className={`text-4xl mb-4 h-16 flex items-center justify-center transition-transform ${product.stock > 0 ? 'group-hover:scale-110' : 'grayscale opacity-60'}`}>
                       {product.image.startsWith('data:') || product.image.startsWith('http') ? (
                          <img src={product.image} className="w-16 h-16 object-cover rounded-xl shadow-sm border border-slate-700/50" alt="product" />
                       ) : (
                          product.image
                       )}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-tight h-10 line-clamp-2">{product.name}</h3>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-semibold">{product.category}</span>
                    <p className="text-xl font-black text-gold">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 p-0 custom-scrollbar">
             <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                <thead className="bg-slate-800/60 sticky top-0 z-10 backdrop-blur-sm">
                   <tr className="text-slate-400 text-sm border-b border-slate-700/80">
                      <th className="px-6 py-4 font-semibold">Producto</th>
                      <th className="px-6 py-4 font-semibold">Categoría</th>
                      <th className="px-6 py-4 font-semibold">Precio Venta</th>
                      <th className="px-6 py-4 font-semibold">Inventario (Stock)</th>
                      <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-sm">
                   {filtered.map((product, i) => (
                      <tr key={i} className={`hover:bg-slate-800/40 transition-colors ${product.stock === 0 ? 'bg-danger/5' : ''}`}>
                         <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-xl shrink-0 overflow-hidden">
                               {product.image.startsWith('data:') || product.image.startsWith('http') ? (
                                  <img src={product.image} className="w-full h-full object-cover" alt="product" />
                               ) : (
                                  product.image
                               )}
                            </div>
                            {product.name}
                         </td>
                         <td className="px-6 py-4 text-slate-400 text-xs font-bold uppercase tracking-wider">{product.category}</td>
                         <td className="px-6 py-4 font-black text-gold">${product.price.toFixed(2)}</td>
                         <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider ${product.stock === 0 ? 'bg-danger text-white' : product.stock <= 3 ? 'bg-amber-500 text-black' : 'bg-slate-700 text-white'}`}>
                               {product.stock === 0 ? 'Agotado' : `${product.stock} Unidades`}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                               <button onClick={() => handleEdit(product)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 hover:text-gold transition shadow-sm" title="Editar"><Edit size={16} /></button>
                               <button onClick={() => handleDelete(product.id)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 text-slate-300 hover:text-danger transition shadow-sm" title="Eliminar"><Trash2 size={16} /></button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {filtered.length === 0 && <div className="p-10 text-center text-slate-500">No se encontraron productos con ese nombre o categoría.</div>}
          </div>
        )}
      </div>

      {/* Modal Nuevo Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-oxford border border-slate-700/60 rounded-2xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-700/60">
              <h2 className="text-xl font-bold text-white">{formData.id ? "Editar Producto" : "Registrar Producto"}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition bg-slate-800 hover:bg-slate-700 p-2 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="flex gap-4 items-end">
                  <div className="w-24 h-24 text-6xl bg-slate-900 border border-slate-700/50 rounded-xl shadow-inner flex shrink-0 items-center justify-center overflow-hidden p-1">
                     {formData.image.startsWith('data:') || formData.image.startsWith('http') ? (
                        <img src={formData.image} className="w-full h-full object-contain drop-shadow-md rounded-lg" alt="preview" />
                     ) : (
                        formData.image
                     )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-sm font-semibold text-slate-400">Ícono o Fotografía</label>
                       <label className="text-xs font-bold text-black bg-gold hover:bg-[#b8952a] px-3 py-1.5 rounded-lg cursor-pointer transition shadow-[0_0_10px_rgba(212,175,55,0.3)] flex items-center gap-1 active:scale-95">
                          <Upload size={14} /> Subir Foto
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                       </label>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-700/50 custom-scrollbar">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setFormData({...formData, image: emoji})}
                          className={`text-2xl p-1 rounded-md transition ${formData.image === emoji ? 'bg-gold/20 scale-110' : 'hover:bg-slate-800'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Nombre del Producto <span className="text-danger">*</span></label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition shadow-inner" placeholder="Ej. Pre-entreno 400g" />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Precio de Venta (MXN) <span className="text-danger">*</span></label>
                    <input required min="1" type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition shadow-inner font-mono" placeholder="850.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-400 mb-2">Cantidad en Stock <span className="text-danger">*</span></label>
                    <input required min="0" type="number" step="1" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition shadow-inner font-mono" placeholder="Ej. 10" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">Categoría <span className="text-danger">*</span></label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-gold transition shadow-inner appearance-none cursor-pointer">
                    {CATEGORIAS_OPCIONES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-700/60 bg-slate-800/30 rounded-b-2xl flex justify-end gap-3 items-center">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-white font-medium transition">Cancelar</button>
              <button type="submit" form="product-form" className="px-6 py-2.5 bg-gold hover:bg-[#b8952a] text-black rounded-xl font-bold transition shadow-[0_0_15px_rgba(212,175,55,0.25)] flex items-center gap-2">
                <Package size={18} /> {formData.id ? "Actualizar Inventario" : "Registrar Producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
