import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EL TEMPLO Gym",
  description: "Sistema de Gestión Integral Administrativo - EL TEMPLO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-background text-white min-h-screen flex`}>
        <LayoutWrapper>
           {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
