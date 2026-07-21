"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { generarFolioTraspaso, productoPermitidoEnDestino, stockPorDestino, uid } from "@/lib/helpers";
import type { MovimientoInventario } from "@/types";

export default function GuiaTraspasoTab() {
  const { data, ui, patchUi, commit } = useApp();
  const destinosActivos = data.destinosInventario.filter((d) => d.activo);
  const bodega = data.destinosInventario.find((d) => d.esBodega);

  const [origenId, setOrigenId] = useState(bodega?.id || destinosActivos[0]?.id || "");
  const [destinoId, setDestinoId] = useState("");
  const [notas, setNotas] = useState("");
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [err, setErr] = useState<{ msg: string; ok: boolean } | null>(null);

  const q = (ui.search || "").trim().toLowerCase();
  const productos = useMemo(() => {
    return data.productos
      .filter((p) => p.activo && (!q || p.sku.toLowerCase().includes(q) || p.detalle.toLowerCase().includes(q)))
      .sort((a, b) => a.sku.localeCompare(b.sku));
  }, [data.productos, q]);

  const disponibleEnOrigen = (productoId: string) => {
    const producto = data.productos.find((p) => p.id === productoId);
    if (!producto) return 0;
    const stock = stockPorDestino(producto, data.destinosInventario, data.movimientosInventario);
    return stock.get(origenId) ?? 0;
  };

  const permitidoEnDestino = (productoId: string) => {
    if (!destinoId) return true;
    const producto = data.productos.find((p) => p.id === productoId);
    return !producto || productoPermitidoEnDestino(producto, destinoId);
  };

  const setCantidad = (productoId: string, valor: number) => {
    setCantidades((prev) => ({ ...prev, [productoId]: valor }));
  };

  const cambiarDestino = (nuevoDestinoId: string) => {
    setDestinoId(nuevoDestinoId);
    setCantidades((prev) => {
      const siguiente = { ...prev };
      for (const productoId of Object.keys(siguiente)) {
        const producto = data.productos.find((p) => p.id === productoId);
        if (producto && !productoPermitidoEnDestino(producto, nuevoDestinoId)) delete siguiente[productoId];
      }
      return siguiente;
    });
  };

  const lineas = Object.entries(cantidades).filter(([, c]) => c > 0);
  const totalUnidades = lineas.reduce((sum, [, c]) => sum + c, 0);

  const limpiar = () => {
    setCantidades({});
    setNotas("");
  };

  const guardar = async () => {
    if (!origenId || !destinoId) {
      setErr({ msg: "Selecciona origen y destino", ok: false });
      return;
    }
    if (origenId === destinoId) {
      setErr({ msg: "El origen y el destino no pueden ser el mismo", ok: false });
      return;
    }
    if (lineas.length === 0) {
      setErr({ msg: "Ingresa la cantidad de al menos un producto", ok: false });
      return;
    }
    for (const [productoId, cantidad] of lineas) {
      const p = data.productos.find((x) => x.id === productoId);
      if (!permitidoEnDestino(productoId)) {
        setErr({ msg: `"${p?.sku}" no puede estar en "${data.destinosInventario.find((d) => d.id === destinoId)?.nombre}"`, ok: false });
        return;
      }
      const disponible = disponibleEnOrigen(productoId);
      if (cantidad > disponible) {
        setErr({ msg: `No hay suficiente stock de "${p?.sku}" en el origen (disponible: ${disponible})`, ok: false });
        return;
      }
    }

    const fecha = new Date().toISOString();
    const folio = generarFolioTraspaso(data.movimientosInventario.map((m) => m.folio));
    const nuevos: MovimientoInventario[] = lineas.map(([productoId, cantidad]) => ({
      id: uid(),
      folio,
      productoId,
      origenId,
      destinoId,
      cantidad,
      fecha,
      notas: notas.trim() || undefined,
      creadoPor: ui.perfilActual?.nombre || "Administrador",
    }));

    const ok = await commit({ movimientosInventario: [...data.movimientosInventario, ...nuevos] });
    if (!ok) {
      setErr({ msg: "No se pudo guardar la guía (sin conexión). Intenta de nuevo.", ok: false });
      return;
    }
    setErr({ msg: `Guía N° ${folio} guardada: ${lineas.length} producto(s), ${totalUnidades} unidad(es).`, ok: true });
    limpiar();
  };

  return (
    <div>
      <div className="hint" style={{ textAlign: "left", color: "var(--gray)", fontSize: 13, marginBottom: 14 }}>
        Selecciona un origen y un destino, luego ingresa la cantidad a traspasar de cada producto. Al guardar se
        registra un traspaso por cada producto con cantidad ingresada, como una sola guía.
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <div className="field" style={{ minWidth: 220, flex: 1 }}>
          <label>Origen</label>
          <select value={origenId} onChange={(e) => setOrigenId(e.target.value)}>
            {destinosActivos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 220, flex: 1 }}>
          <label>Destino</label>
          <select value={destinoId} onChange={(e) => cambiarDestino(e.target.value)}>
            <option value="" disabled>
              Selecciona un destino
            </option>
            {destinosActivos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 220, flex: 1 }}>
          <label>Notas (opcional)</label>
          <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: guía N° 123" />
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
              <th>Disponible en origen</th>
              <th>Cantidad a traspasar</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty">No hay productos que coincidan</div>
                </td>
              </tr>
            ) : (
              productos.map((p) => {
                const disponible = disponibleEnOrigen(p.id);
                const permitido = permitidoEnDestino(p.id);
                return (
                  <tr key={p.id} style={!permitido ? { opacity: 0.5 } : undefined}>
                    <td>{p.sku}</td>
                    <td>{p.detalle}</td>
                    <td>{disponible}</td>
                    <td>
                      {permitido ? (
                        <input
                          type="number"
                          min={0}
                          max={disponible}
                          placeholder="0"
                          value={cantidades[p.id] || ""}
                          onChange={(e) => setCantidad(p.id, Number(e.target.value) || 0)}
                          style={{ width: 90 }}
                        />
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--gray)" }}>No permitido en este destino</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
        <div style={{ color: "var(--gray)", fontSize: 13 }}>
          {lineas.length} producto(s) seleccionado(s), {totalUnidades} unidad(es) en total
        </div>
        <button className="btn ghost" onClick={limpiar}>
          Limpiar
        </button>
        <button className="btn" onClick={guardar}>
          Guardar guía de traspaso
        </button>
      </div>
      <div className="err" style={{ color: err?.ok ? "var(--green)" : undefined }}>
        {err?.msg || ""}
      </div>
    </div>
  );
}
