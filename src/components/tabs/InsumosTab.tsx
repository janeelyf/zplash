"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { fmtCLP } from "@/lib/helpers";
import type { Insumo } from "@/types";

export default function InsumosTab() {
  const { data, ui, patchUi, commit } = useApp();
  const proveedorNombre = (id?: string) => data.proveedores.find((p) => p.id === id)?.nombre || "-";
  const categoriaNombre = (id?: string) => data.categoriasInsumo.find((c) => c.id === id)?.nombre || "-";

  const q = (ui.search || "").trim().toLowerCase();
  const filtrados = useMemo(() => {
    return data.insumos
      .filter(
        (i) =>
          !q ||
          i.nombre.toLowerCase().includes(q) ||
          categoriaNombre(i.categoriaId).toLowerCase().includes(q) ||
          proveedorNombre(i.proveedorId).toLowerCase().includes(q)
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- categoriaNombre/proveedorNombre son closures sobre data.categoriasInsumo/data.proveedores, ya listados abajo
  }, [data.insumos, data.categoriasInsumo, data.proveedores, q]);

  const bajoMinimo = data.insumos.filter((i) => i.activo && i.stock < i.stockMin).length;

  const eliminar = (i: Insumo) => {
    patchUi({
      modal: {
        type: "confirm",
        mensaje: `¿Eliminar el insumo ${i.nombre}? Esta acción no se puede deshacer.`,
        onConfirm: () => {
          commit({ insumos: data.insumos.filter((x) => x.id !== i.id) });
        },
      },
    });
  };

  return (
    <div>
      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="num">{data.insumos.length}</div>
          <div className="lbl">Insumos</div>
        </div>
        <div className={`stat-card ${bajoMinimo > 0 ? "warn" : ""}`}>
          <div className="num">{bajoMinimo}</div>
          <div className="lbl">Bajo Stock Mínimo</div>
        </div>
      </div>

      <div className="toolbar">
        <input
          placeholder="Buscar por nombre, categoría o proveedor..."
          value={ui.search || ""}
          onChange={(e) => patchUi({ search: e.target.value })}
        />
        <button className="btn" onClick={() => patchUi({ modal: { type: "insumo", data: null } })}>
          + Nuevo insumo
        </button>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Valor Compra</th>
              <th>Stock</th>
              <th>Stock Mín</th>
              <th>Stock Máx</th>
              <th>Proveedor</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty">No hay insumos que coincidan</div>
                </td>
              </tr>
            ) : (
              filtrados.map((i) => (
                <tr key={i.id}>
                  <td>{i.nombre}</td>
                  <td>{categoriaNombre(i.categoriaId)}</td>
                  <td>{fmtCLP(i.valorCompra)}</td>
                  <td style={i.stock < i.stockMin ? { color: "var(--red)", fontWeight: 600 } : undefined}>{i.stock}</td>
                  <td>{i.stockMin}</td>
                  <td>{i.stockMax || "-"}</td>
                  <td>{proveedorNombre(i.proveedorId)}</td>
                  <td>{i.activo ? "Activo" : "Inactivo"}</td>
                  <td className="row-actions">
                    <button className="icon-btn" onClick={() => patchUi({ modal: { type: "insumo", data: i } })}>
                      Editar
                    </button>
                    <button className="icon-btn" onClick={() => eliminar(i)}>
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
