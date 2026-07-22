"use client";

import { useApp } from "@/context/AppContext";
import Topbar from "@/components/Topbar";
import ProductosTab from "@/components/tabs/ProductosTab";
import ProveedoresTab from "@/components/tabs/ProveedoresTab";
import CategoriasProductoTab from "@/components/tabs/CategoriasProductoTab";
import CategoriasInsumoTab from "@/components/tabs/CategoriasInsumoTab";
import InsumosTab from "@/components/tabs/InsumosTab";
import StockDestinosTab from "@/components/tabs/StockDestinosTab";
import DestinosInventarioTab from "@/components/tabs/DestinosInventarioTab";
import GuiaTraspasoTab from "@/components/tabs/GuiaTraspasoTab";
import BodegasTab from "@/components/tabs/BodegasTab";

const TABS = [
  { id: "productos", label: "Productos" },
  { id: "categorias", label: "Categorías" },
  { id: "proveedores", label: "Proveedores" },
  { id: "insumos", label: "Insumos" },
  { id: "destinos", label: "Destinos" },
  { id: "bodegas", label: "Bodegas" },
  { id: "traspasarGuia", label: "Guías de Despacho" },
] as const;

export default function InventarioView() {
  const { ui, patchUi, logout } = useApp();
  const tabActual = TABS.find((t) => t.id === ui.inventarioTab) || TABS[0];

  return (
    <>
      <Topbar
        mode={`Inventario · ${ui.perfilActual?.nombre || ""}`}
        onLogout={() => logout()}
        onBack={() => patchUi({ view: "hub" })}
      />
      <div className="content">
        <div className="sidebar-layout">
          <div className="tabs-sidebar">
            {TABS.map((t) => (
              <div
                key={t.id}
                className={`tab ${ui.inventarioTab === t.id ? "active" : ""}`}
                onClick={() => patchUi({ inventarioTab: t.id, search: "" })}
              >
                {t.label}
              </div>
            ))}
          </div>
          <div className="sidebar-content">
            {tabActual.id === "productos" && <ProductosTab />}
            {tabActual.id === "categorias" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
                <CategoriasProductoTab />
                <CategoriasInsumoTab />
              </div>
            )}
            {tabActual.id === "proveedores" && <ProveedoresTab />}
            {tabActual.id === "insumos" && <InsumosTab />}
            {tabActual.id === "destinos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <StockDestinosTab />
                <DestinosInventarioTab />
              </div>
            )}
            {tabActual.id === "bodegas" && <BodegasTab />}
            {tabActual.id === "traspasarGuia" && <GuiaTraspasoTab />}
          </div>
        </div>
      </div>
    </>
  );
}
