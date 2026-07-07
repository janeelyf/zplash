"use client";

import { useApp } from "@/context/AppContext";
import Topbar from "@/components/Topbar";
import ClientesTab from "@/components/tabs/ClientesTab";
import IngresosTab from "@/components/tabs/IngresosTab";
import CierreTab from "@/components/tabs/CierreTab";
import OperadoresTab from "@/components/tabs/OperadoresTab";
import StatsTab from "@/components/tabs/StatsTab";
import ConfigTab from "@/components/tabs/ConfigTab";

const TABS = [
  { id: "clientes", label: "Clientes" },
  { id: "ingresos", label: "Historial de ingresos" },
  { id: "cierre", label: "Cierre de Caja" },
  { id: "operadores", label: "Operadores" },
  { id: "stats", label: "Estadísticas" },
  { id: "config", label: "Configuración" },
];

export default function AdminView() {
  const { ui, patchUi } = useApp();

  return (
    <>
      <Topbar mode="Administrador" onLogout={() => patchUi({ view: "login" })} />
      <div className="content">
        <div className="tabs">
          {TABS.map((t) => (
            <div
              key={t.id}
              className={`tab ${ui.adminTab === t.id ? "active" : ""}`}
              onClick={() => patchUi({ adminTab: t.id, search: "" })}
            >
              {t.label}
            </div>
          ))}
        </div>
        {ui.adminTab === "clientes" && <ClientesTab />}
        {ui.adminTab === "ingresos" && <IngresosTab />}
        {ui.adminTab === "cierre" && <CierreTab />}
        {ui.adminTab === "operadores" && <OperadoresTab />}
        {ui.adminTab === "stats" && <StatsTab />}
        {ui.adminTab === "config" && <ConfigTab />}
      </div>
    </>
  );
}
