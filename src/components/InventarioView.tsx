"use client";

import { useApp } from "@/context/AppContext";
import Topbar from "@/components/Topbar";
import ProductosTab from "@/components/tabs/ProductosTab";
import ProveedoresTab from "@/components/tabs/ProveedoresTab";
import CategoriasProductoTab from "@/components/tabs/CategoriasProductoTab";
import CategoriasInsumoTab from "@/components/tabs/CategoriasInsumoTab";
import InsumosTab from "@/components/tabs/InsumosTab";

const TABS = [
  { id: "productos", label: "Productos" },
  { id: "categorias", label: "Categorías" },
  { id: "proveedores", label: "Proveedores" },
  { id: "insumos", label: "Insumos" },
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
          </div>
        </div>
      </div>
    </>
  );
}
