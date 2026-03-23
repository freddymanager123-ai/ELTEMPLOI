"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, Users, CreditCard, ShoppingBag, Menu, X, CheckSquare, Bookmark, Package, BarChart3, ShieldCheck, LogOut } from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem("templo_current_user");
    if (raw) setCurrentUser(JSON.parse(raw));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("templo_current_user");
    window.location.href = "/login";
  };

  const links = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["Administrador", "Recepcionista", "Entrenador"] },
    { name: "Clientes", href: "/clientes", icon: Users, roles: ["Administrador", "Recepcionista"] },
    { name: "Asistencia", href: "/asistencia", icon: CheckSquare, roles: ["Administrador", "Recepcionista", "Entrenador"] },
    { name: "Membresías", href: "/membresias", icon: Bookmark, roles: ["Administrador", "Recepcionista"] },
    { name: "Pagos e Inscripciones", href: "/pagos", icon: CreditCard, roles: ["Administrador", "Recepcionista"] },
    { name: "Ventas (POS)", href: "/ventas", icon: ShoppingBag, roles: ["Administrador", "Recepcionista"] },
    { name: "Productos", href: "/productos", icon: Package, roles: ["Administrador", "Recepcionista"] },
    { name: "Finanzas y Transacciones", href: "/finanzas", icon: BarChart3, roles: ["Administrador"] },
    { name: "Usuarios y Roles", href: "/usuarios", icon: ShieldCheck, roles: ["Administrador"] },
  ];

  return (
    <>
      {/* Mobile Toggle Navbar */}
      <div className="md:hidden fixed top-0 w-full h-16 bg-oxford border-b border-slate-700 z-50 flex items-center px-4 shadow-md justify-between print:hidden">
        <Image src="/logo.jpg" alt="El Templo" width={100} height={40} className="h-10 w-auto object-contain mix-blend-screen block" priority />
        <button 
          className="p-2 bg-slate-800 rounded-md hover:bg-slate-700 transition"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
        </button>
      </div>

      {/* Overlay background when mobile menu is open */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/60 z-40 transition-opacity ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Component */}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-oxford border-r border-slate-700 transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 print:hidden`}>
        <div className="flex flex-col h-full px-4 py-6 md:py-8">
          <div className="hidden md:flex items-center justify-center mb-10">
            <Image src="/logo.jpg" alt="El Templo Gym" width={180} height={180} className="w-40 h-auto object-contain mx-auto drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]" priority />
          </div>
          
          <nav className="space-y-2 flex-1 mt-10 md:mt-0">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Módulos</p>
            {links.filter(link => !currentUser || !link.roles || link.roles.includes(currentUser.role)).map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? "bg-gold/10 text-gold font-bold" : "text-slate-300 hover:bg-slate-800 hover:text-white font-medium"}`}
                >
                  <Icon size={20} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="border-t border-slate-700 pt-4 mt-6">
            <div className="flex items-center justify-between px-2 gap-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white uppercase overflow-hidden border-2 border-slate-600">
                  {currentUser?.name?.substring(0,2) || 'AD'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">{currentUser?.name || 'Administrador'}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gold font-black">{currentUser?.role || 'Sistema'}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                title="Cerrar Sesión" 
                className="shrink-0 p-2.5 bg-slate-800 hover:bg-danger/20 hover:text-danger rounded-xl text-slate-400 transition"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
