"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { fmtCLP } from "@/lib/helpers";
import type { Producto } from "@/types";

export default function ProductosTab() {
  const { data, ui, patchUi, commit } = useApp();
  const proveedorNombre = (id?: string) => data.proveedores.find((p) => p.id === id)?.nombre || "-";
  const categoriaNombre = (id?: string) => data.categoriasProducto.find((c) => c.id === id)?.nombre || "-";

  const q = (ui.search || "").trim().toLowerCase();
  const filtrados = useMemo(() => {
    return data.productos
      .filter(
        (p) =>
          !q ||
          p.codigo.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.detalle.toLowerCase().includes(q) ||
          categoriaNombre(p.categoriaId).toLowerCase().includes(q)
      )
      .sort((a, b) => a.sku.localeCompare(b.sku));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- categoriaNombre is a plain closure over data.categoriasProducto, already listed below
  }, [data.productos, data.categoriasProducto, q]);

  const bajoMinimo = data.productos.filter((p) => p.activo && p.stock < p.stockMin).length;

  const eliminar = (p: Producto) => {
    patchUi({
      modal: {
        type: "confirm",
        mensaje: `¿Eliminar el producto ${p.sku} — ${p.detalle}? Esta acción no se puede deshacer.`,
        onConfirm: () => {
          commit({ productos: data.productos.filter((x) => x.id !== p.id) });
        },
      },
    });
  };

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="num">{data.productos.length}</div>
          <div className="lbl">Productos</div>
        </div>
        <div className={`stat-card ${bajoMinimo > 0 ? "warn" : ""}`}>
          <div className="num">{bajoMinimo}</div>
          <div className="lbl">Bajo Stock Mínimo</div>
        </div>
      </div>

      <div className="toolbar">
        <input
          placeholder="Buscar por código, SKU, detalle o categoría..."
          value={ui.search || ""}
          onChange={(e) => patchUi({ search: e.target.value })}
        />
        <button className="btn" onClick={() => patchUi({ modal: { type: "producto", data: null } })}>
          + Nuevo producto
        </button>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>SKU</th>
              <th>Detalle</th>
              <th>Categoría</th>
              <th>Valor Compra</th>
              <th>Valor Venta</th>
              <th>Stock</th>
              <th>Stock Mín</th>
              <th>Stock Máx</th>
              <th>Empaque</th>
              <th>Proveedor</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={13}>
                  <div className="empty">No hay productos que coincidan</div>
                </td>
              </tr>
            ) : (
              filtrados.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigo}</td>
                  <td>{p.sku}</td>
                  <td>{p.detalle}</td>
                  <td>{categoriaNombre(p.categoriaId)}</td>
                  <td>{fmtCLP(p.valorCompra)}</td>
                  <td>{fmtCLP(p.valorVenta)}</td>
                  <td style={p.stock < p.stockMin ? { color: "var(--red)", fontWeight: 600 } : undefined}>{p.stock}</td>
                  <td>{p.stockMin}</td>
                  <td>{p.stockMax || "-"}</td>
                  <td>{p.empaqueMinimo}</td>
                  <td>{proveedorNombre(p.proveedorId)}</td>
                  <td>{p.activo ? "Activo" : "Inactivo"}</td>
                  <td className="row-actions">
                    <button className="icon-btn" onClick={() => patchUi({ modal: { type: "producto", data: p } })}>
                      Editar
                    </button>
                    <button className="icon-btn" onClick={() => eliminar(p)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
