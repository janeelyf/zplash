import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZPlash · Control de Acceso",
  description: "Sistema de control de acceso y planes de ZPlash",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
