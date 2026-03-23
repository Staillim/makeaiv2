import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maket AI — Crea tu tienda hablando",
  description: "Plataforma de e-commerce con IA. Crea, administra y vende con agentes inteligentes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
