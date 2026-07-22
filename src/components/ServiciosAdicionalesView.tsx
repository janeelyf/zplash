"use client";

import { useApp } from "@/context/AppContext";
import Topbar from "@/components/Topbar";
import ServiciosAdicionalesForm from "@/components/ServiciosAdicionalesForm";
import ServiciosAdicionalesLog from "@/components/ServiciosAdicionalesLog";

export default function ServiciosAdicionalesView() {
  const { ui, patchUi, logout } = useApp();

  return (
    <>
      <Topbar
        mode={`Servicios Adicionales · ${ui.perfilActual?.nombre || ""}`}
        onLogout={() => logout({ loginMode: null })}
        onBack={() => patchUi({ view: "hub" })}
      />
      <div className="content">
        <ServiciosAdicionalesForm />
        <ServiciosAdicionalesLog />
      </div>
    </>
  );
}
