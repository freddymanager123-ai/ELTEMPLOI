"use client";
import Sidebar from "./Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Básic Client-side Auth Check
    const currentUser = localStorage.getItem("templo_current_user");
    if (!currentUser && pathname !== "/login") {
       router.replace("/login");
    } else if (currentUser && pathname === "/login") {
       router.replace("/");
    } else {
       setIsAuthLoading(false);
    }
  }, [pathname, router]);

  if (isAuthLoading) {
      return (
         <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center">
             <Image src="/logo.jpg" alt="Cargando..." width={150} height={150} className="w-40 animate-pulse mix-blend-screen drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] mb-4" />
             <p className="text-gold font-bold tracking-widest uppercase">Validando Accesos...</p>
         </div>
      );
  }

  if (pathname === "/login") {
    return <main className="w-full min-h-screen bg-[#0F172A] flex">{children}</main>;
  }

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 transition-all duration-300 w-full min-h-screen max-w-[100vw]">
        <div className="p-4 md:p-6 lg:px-8 xl:px-10 mt-12 md:mt-0 pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
