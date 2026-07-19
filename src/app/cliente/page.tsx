"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import UbicacionTab from "@/components/cliente/UbicacionTab";
import TiposLavadoTab from "@/components/cliente/TiposLavadoTab";
import VentaEmpresaInfoTab from "@/components/cliente/VentaEmpresaInfoTab";
import PlanMensualTab from "@/components/cliente/PlanMensualTab";
import FaqTab from "@/components/cliente/FaqTab";
import MiCuentaTab from "@/components/cliente/MiCuentaTab";
import CarritoBadge from "@/components/cliente/CarritoBadge";
import type { PreciosPublicos } from "@/components/cliente/types";

const TABS = [
  { id: "ubicacion", label: "Ubicación y Horarios" },
  { id: "lavados", label: "Tipos de Lavados" },
  { id: "empresa", label: "Venta a Empresa" },
  { id: "plan", label: "Plan Mensual" },
  { id: "faq", label: "Preguntas Frecuentes" },
  { id: "cuenta", label: "Mi Cuenta" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ClientePage() {
  const [tab, setTab] = useState<TabId>("ubicacion");
  const [precios, setPrecios] = useState<PreciosPublicos | null>(null);

  useEffect(() => {
    fetch("/api/pagos/precios")
      .then((r) => r.json())
      .then(setPrecios)
      .catch(() => setPrecios(null));
  }, []);

  return (
    <div id="app">
      <div className="cliente-header">
        <div className="title">
          <Image src="/logo.png" alt="ZPlash" width={30} height={30} className="topbar-logo" unoptimized />
          <span className="mode">Portal Cliente</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CarritoBadge />
          <a href="/pagar" className="btn" style={{ marginTop: 0, textDecoration: "none" }}>
            Pagar / Renovar plan
          </a>
        </div>
      </div>

      <div className="cliente-hero">
        <h1>Bienvenido a ZPlash</h1>
        <p>Toda la información de nuestro lavado de autos, y tu cuenta para revisar tus compras y vehículos.</p>
      </div>

      <div className="content">
        <div className="tabs cliente-tabs">
          {TABS.map((t) => (
            <div key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </div>
          ))}
        </div>

        {tab === "ubicacion" && <UbicacionTab />}
        {tab === "lavados" && <TiposLavadoTab precios={precios} />}
        {tab === "empresa" && <VentaEmpresaInfoTab precios={precios} />}
        {tab === "plan" && <PlanMensualTab precios={precios} />}
        {tab === "faq" && <FaqTab />}
        {tab === "cuenta" && <MiCuentaTab />}
      </div>
    </div>
  );
}
