"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { stockPorDestino } from "@/lib/helpers";

export default function BodegasTab() {
  const { data, ui, patchUi } = useApp();
  const destinosActivos = useMemo(
    () =>
      data.destinosInventario
        .filter((d) => d.activo)
        .sort((a, b) => (b.esBodega ? 1 : 0) - (a.esBodega ? 1 : 0) || a.nombre.localeCompare(b.nombre)),
    [data.destinosInventario]
  );
  const bodega = data.destinosInventario.find((d) => d.esBodega);

  const [destinoId, setDestinoId] = useState(bodega?.id || destinosActivos[0]?.id || "");

  const q = (ui.search || "").trim().toLowerCase();
  const filas = useMemo(() => {
    return data.productos
      .filter((p) => p.activo && (!q || p.sku.toLowerCase().includes(q) || p.detalle.toLowerCase().includes(q)))
      .map((p) => ({
        producto: p,
        stock: stockPorDestino(p, data.destinosInventario, data.movimientosInventario).get(destinoId) ?? 0,
      }))
      .filter((f) => f.stock > 0)
      .sort((a, b) => a.producto.sku.localeCompare(b.producto.sku));
  }, [data.productos, data.destinosInventario, data.movimientosInventario, q, destinoId]);

  const totalUnidades = filas.reduce((sum, f) => sum + f.stock, 0);

  return (
    <div>
      <div className="hint" style={{ textAlign: "left", color: "var(--gray)", fontSize: 13, marginBottom: 14 }}>
        Selecciona una bodega o destino para ver qué productos tiene actualmente en existencia.
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div className="field" style={{ minWidth: 220, flex: 1 }}>
          <label>Bodega / destino</label>
          <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)}>
            {destinosActivos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="toolbar">
        <input
          placeholder="Buscar por SKU o detalle..."
          value={ui.search || ""}
          onChange={(e) => patchUi({ search: e.target.value })}
        />
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Detalle</th>
              <th>Stock en este destino</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={3}>
                  <div className="empty">Este destino no tiene productos en existencia</div>
                </td>
              </tr>
            ) : (
              filas.map((f) => (
                <tr key={f.producto.id}>
                  <td>{f.producto.sku}</td>
                  <td>{f.producto.detalle}</td>
                  <td>{f.stock}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ color: "var(--gray)", fontSize: 13, marginTop: 14 }}>
        {filas.length} producto(s), {totalUnidades} unidad(es) en total
      </div>
    </div>
  );
}
