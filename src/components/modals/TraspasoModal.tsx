"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { generarFolioTraspaso, productoPermitidoEnDestino, stockPorDestino, uid } from "@/lib/helpers";
import type { MovimientoInventario } from "@/types";

export default function TraspasoModal({ productoId }: { productoId?: string }) {
  const { data, ui, commit, patchUi } = useApp();
  const productoRef = useRef<HTMLSelectElement>(null);
  const origenRef = useRef<HTMLSelectElement>(null);
  const destinoRef = useRef<HTMLSelectElement>(null);
  const cantidadRef = useRef<HTMLInputElement>(null);
  const notasRef = useRef<HTMLInputElement>(null);
  const [productoSel, setProductoSel] = useState(productoId || data.productos.find((p) => p.activo)?.id || "");
  const [err, setErr] = useState("");

  const destinosActivos = data.destinosInventario.filter((d) => d.activo);
  const bodega = data.destinosInventario.find((d) => d.esBodega);
  const productosOrdenados = [...data.productos].filter((p) => p.activo).sort((a, b) => a.sku.localeCompare(b.sku));

  const producto = data.productos.find((p) => p.id === productoSel);
  const stockActual = producto ? stockPorDestino(producto, data.destinosInventario, data.movimientosInventario) : new Map<string, number>();
  const destinosPermitidos = producto
    ? destinosActivos.filter((d) => productoPermitidoEnDestino(producto, d))
    : destinosActivos;

  const guardar = async () => {
    const prodId = productoRef.current?.value || "";
    const origenId = origenRef.current?.value || "";
    const destinoId = destinoRef.current?.value || "";
    const cantidad = Number(cantidadRef.current?.value) || 0;

    if (!prodId) {
      setErr("Selecciona un producto");
      return;
    }
    if (!origenId || !destinoId) {
      setErr("Selecciona origen y destino");
      return;
    }
    if (origenId === destinoId) {
      setErr("El origen y el destino no pueden ser el mismo");
      return;
    }
    const destino = data.destinosInventario.find((d) => d.id === destinoId);
    if (producto && destino && !productoPermitidoEnDestino(producto, destino)) {
      setErr(`Este producto no puede estar en "${destino.nombre}"`);
      return;
    }
    if (cantidad <= 0) {
      setErr("La cantidad debe ser mayor a 0");
      return;
    }
    const disponibleEnOrigen = stockActual.get(origenId) ?? 0;
    if (cantidad > disponibleEnOrigen) {
      setErr(`No hay suficiente stock en el origen (disponible: ${disponibleEnOrigen})`);
      return;
    }

    const nuevo: MovimientoInventario = {
      id: uid(),
      folio: generarFolioTraspaso(data.movimientosInventario.map((m) => m.folio)),
      productoId: prodId,
      origenId,
      destinoId,
      cantidad,
      fecha: new Date().toISOString(),
      notas: notasRef.current?.value.trim() || undefined,
      creadoPor: ui.perfilActual?.nombre || "Administrador",
    };
    const ok = await commit({ movimientosInventario: [...data.movimientosInventario, nuevo] });
    if (!ok) {
      setErr("No se pudo guardar el traspaso (sin conexión). Intenta de nuevo.");
      return;
    }
    patchUi({ modal: null });
  };

  return (
    <div className="modal">
      <h3>Nuevo traspaso</h3>
      <div className="field">
        <label>Producto</label>
        <select ref={productoRef} value={productoSel} onChange={(e) => setProductoSel(e.target.value)}>
          {productosOrdenados.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.detalle}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Origen</label>
        <select ref={origenRef} defaultValue={bodega?.id || ""}>
          {destinosActivos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre} (disponible: {stockActual.get(d.id) ?? 0})
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Destino</label>
        <select ref={destinoRef} defaultValue="">
          <option value="" disabled>
            Selecciona un destino
          </option>
          {destinosPermitidos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre} (disponible: {stockActual.get(d.id) ?? 0})
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Cantidad</label>
        <input ref={cantidadRef} type="number" min={1} placeholder="0" />
      </div>
      <div className="field">
        <label>Notas (opcional)</label>
        <input ref={notasRef} placeholder="Ej: carga semanal" />
      </div>
      <div className="err">{err}</div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={() => patchUi({ modal: null })}>
          Cancelar
        </button>
        <button className="btn" onClick={guardar}>
          Guardar traspaso
        </button>
      </div>
    </div>
  );
}
