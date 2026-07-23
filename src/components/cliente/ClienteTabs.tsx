"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { id: "ubicacion", label: "Ubicación y Horarios" },
  { id: "lavados", label: "Tipos de Lavados" },
  { id: "detailing", label: "Limpieza y Detailing" },
  { id: "empresa", label: "Venta a Empresa" },
  { id: "faq", label: "Preguntas Frecuentes" },
  { id: "cuenta", label: "Mi Cuenta" },
] as const;

export type ClienteTabId = (typeof TABS)[number]["id"];

// Los paneles llegan ya renderizados desde el Server Component padre
// (/cliente/page.tsx): este componente solo aporta la interactividad de
// cambiar de pestaña sin volver a pedirle nada al servidor.
export default function ClienteTabs({ panels }: { panels: Record<ClienteTabId, ReactNode> }) {
  const [tab, setTab] = useState<ClienteTabId>("ubicacion");

  return (
    <>
      <div className="tabs cliente-tabs">
        {TABS.map((t) => (
          <div key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>
      {panels[tab]}
    </>
  );
}
