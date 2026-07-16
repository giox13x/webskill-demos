import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Webskill Demos",
  description: "Generador de demos de agentes de WhatsApp para clientes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>{children}</body>
    </html>
  );
}
