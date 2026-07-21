"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { puedeBorrarCategoriaInventario, stockPorDestino } from "@/lib/helpers";
import type { MovimientoInventario } from "@/types";

export default function StockDestinosTab() {
  const { data, ui, patchUi, commit } = useApp();
  const puedeBorrar = puedeBorrarCategoriaInventario(ui.perfilActual?.nombre);
  const destinoNombre = (id: string) => data.destinosInventario.find((d) => d.id === id)?.nombre || "-";

  const destinosActivos = useMemo(
    () => data.destinosInventario.filter((d) => d.activo).sort((a, b) => (b.esBodega ? 1 : 0) - (a.esBodega ? 1 : 0) || a.nombre.localeCompare(b.nombre)),
    [data.destinosInventario]
  );

  const q = (ui.search || "").trim().toLowerCase();
  const productosFiltrados = useMemo(() => {
    return data.productos
      .filter((p) => p.activo && (!q || p.sku.toLowerCase().includes(q) || p.detalle.toLowerCase().includes(q)))
      .sort((a, b) => a.sku.localeCompare(b.sku));
  }, [data.productos, q]);

  const historial = useMemo(() => data.movimientosInventario.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 50), [data.movimientosInventario]);

  const productoNombre = (id: string) => {
    const p = data.productos.find((x) => x.id === id);
    return p ? `${p.sku} — ${p.detalle}` : "(producto eliminado)";
  };

  const eliminarTraspaso = (m: MovimientoInventario) => {
    patchUi({
      modal: {
        type: "confirm",
        mensaje: `¿Eliminar el traspaso de ${m.cantidad} unidad(es) de "${productoNombre(m.productoId)}" (${destinoNombre(m.origenId)} → ${destinoNombre(m.destinoId)})? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar",
        onConfirm: () => {
          commit({ movimientosInventario: data.movimientosInventario.filter((x) => x.id !== m.id) });
        },
      },
    });
  };

  return (
    <div>
      <div className="toolbar">
        <input
          placeholder="Buscar por SKU o detalle..."
          value={ui.search || ""}
          onChange={(e) => patchUi({ search: e.target.value })}
        />
        <button className="btn" onClick={() => patchUi({ modal: { type: "traspasoInventario" } })}>
          + Nuevo traspaso
        </button>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Detalle</th>
              <th>Stock total</th>
              {destinosActivos.map((d) => (
                <th key={d.id}>{d.nombre}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={3 + destinosActivos.length}>
                  <div className="empty">No hay productos que coincidan</div>
                </td>
              </tr>
            ) : (
              productosFiltrados.map((p) => {
                const porDestino = stockPorDestino(p, data.destinosInventario, data.movimientosInventario);
                return (
                  <tr key={p.id}>
                    <td>{p.sku}</td>
                    <td>{p.detalle}</td>
                    <td>{p.stock}</td>
                    {destinosActivos.map((d) => (
                      <td key={d.id}>{porDestino.get(d.id) ?? 0}</td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 28 }}>Historial de traspasos</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Cantidad</th>
              <th>Notas</th>
              <th>Registrado por</th>
              {puedeBorrar && <th></th>}
            </tr>
          </thead>
          <tbody>
            {historial.length === 0 ? (
              <tr>
                <td colSpan={puedeBorrar ? 9 : 8}>
                  <div className="empty">Todavía no hay traspasos registrados</div>
                </td>
              </tr>
            ) : (
              historial.map((m) => (
                <tr key={m.id}>
                  <td>{m.folio}</td>
                  <td>{new Date(m.fecha).toLocaleString("es-CL")}</td>
                  <td>{productoNombre(m.productoId)}</td>
                  <td>{destinoNombre(m.origenId)}</td>
                  <td>{destinoNombre(m.destinoId)}</td>
                  <td>{m.cantidad}</td>
                  <td>{m.notas || "-"}</td>
                  <td>{m.creadoPor || "-"}</td>
                  {puedeBorrar && (
                    <td className="row-actions">
                      <button className="icon-btn" onClick={() => eliminarTraspaso(m)}>
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
