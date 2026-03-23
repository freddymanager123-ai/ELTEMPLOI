"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Key, Mail, ShieldCheck, Dumbbell } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const savedUsers = localStorage.getItem('templo_users_data');
    if (savedUsers) {
      const users = JSON.parse(savedUsers);
      const user = users.find((u: any) => u.email === email && u.password === password && u.status === "ACTIVO");
      if (user) {
        localStorage.setItem("templo_current_user", JSON.stringify(user));
        router.replace("/");
      } else {
        setError("Credenciales incorrectas o usuario inactivo.");
      }
    } else {
      // Fallback
      if (email === "admin@eltemplo.com" && password === "password123") {
         localStorage.setItem("templo_current_user", JSON.stringify({ name: "Admin Principal", role: "Administrador" }));
         router.replace("/");
      } else {
         setError("Usuario incorrecto. Ingresa admin@eltemplo.com / password123");
      }
    }
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row items-center justify-center bg-[#0F172A] relative overflow-hidden">
      
      {/* Lado Decorativo e Iluminación */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-gold rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-gold rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>

      <div className="z-10 bg-oxford border border-slate-700/60 p-8 rounded-3xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-500">
         <div className="flex flex-col items-center mb-8">
            <Image src="/logo.jpg" alt="EL TEMPLO" width={150} height={150} className="w-32 h-auto mb-6 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)] mix-blend-screen" priority />
            <h1 className="text-2xl font-black text-white text-center tracking-tight">Acceso al Sistema</h1>
            <p className="text-slate-400 text-sm mt-2 text-center">Ingresa tus credenciales administrativas</p>
         </div>

         <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-xl text-sm font-semibold text-center animate-in shake">
                 {error}
              </div>
            )}
            
            <div>
               <label className="block text-sm font-semibold text-slate-400 mb-2">Correo Electrónico</label>
               <div className="relative">
                 <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input autoFocus required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner" placeholder="admin@eltemplo.com" />
               </div>
            </div>

            <div>
               <label className="block text-sm font-semibold text-slate-400 mb-2">Contraseña</label>
               <div className="relative">
                 <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition shadow-inner font-mono" placeholder="••••••••" />
               </div>
            </div>

            <button type="submit" className="w-full bg-gold hover:bg-[#b8952a] text-black font-extrabold py-3.5 px-4 rounded-xl mt-4 transition shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] flex items-center justify-center gap-2">
               <ShieldCheck size={20} /> Entrar al Panel
            </button>
         </form>

         <div className="mt-8 text-center border-t border-slate-700/50 pt-6">
            <p className="text-slate-500 flex items-center justify-center gap-2 text-xs font-semibold">
               <Dumbbell size={14} className="text-gold" /> EL TEMPLO GYM © 2026
            </p>
         </div>
      </div>
    </div>
  );
}
