"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { puedeBorrarCategoriaInventario, uid } from "@/lib/helpers";
import type { DestinoInventario } from "@/types";

export default function DestinosInventarioTab() {
  const { data, ui, commit } = useApp();
  const nuevoDestinoNombreRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<{ msg: string; ok: boolean } | null>(null);
  const puedeBorrar = puedeBorrarCategoriaInventario(ui.perfilActual?.nombre);

  const agregarDestino = async () => {
    const nombre = (nuevoDestinoNombreRef.current?.value.trim() || "").toUpperCase();
    if (!nombre) {
      setErr({ msg: "Escribe el nombre del destino", ok: false });
      return;
    }
    if (data.destinosInventario.some((d) => d.nombre.toLowerCase() === nombre.toLowerCase())) {
      setErr({ msg: "Ya existe un destino con ese nombre", ok: false });
      return;
    }
    const nuevo: DestinoInventario = { id: uid(), nombre, esBodega: false, activo: true };
    const ok = await commit({ destinosInventario: [...data.destinosInventario, nuevo] });
    if (!ok) {
      setErr({ msg: "No se pudo guardar (sin conexión). Intenta de nuevo.", ok: false });
      return;
    }
    setErr({ msg: "Destino agregado correctamente", ok: true });
    if (nuevoDestinoNombreRef.current) nuevoDestinoNombreRef.current.value = "";
  };

  const toggleActivo = (destino: DestinoInventario) => {
    const actualizado = { ...destino, activo: !destino.activo };
    commit({ destinosInventario: data.destinosInventario.map((d) => (d.id === destino.id ? actualizado : d)) });
  };

  const borrarDestino = (destino: DestinoInventario) => {
    const enUso = data.movimientosInventario.filter((m) => m.origenId === destino.id || m.destinoId === destino.id).length;
    if (enUso > 0) {
      setErr({ msg: `No se puede borrar: ${enUso} traspaso(s) usan el destino "${destino.nombre}".`, ok: false });
      return;
    }
    setErr(null);
    commit({ destinosInventario: data.destinosInventario.filter((d) => d.id !== destino.id) }).then((ok) => {
      setErr(ok ? { msg: "Destino borrado", ok: true } : { msg: "No se pudo borrar el destino", ok: false });
    });
  };

  return (
    <div className="modal" style={{ maxWidth: 520, margin: 0 }}>
      <h3>Destinos de inventario</h3>
      <div className="hint" style={{ textAlign: "left", color: "var(--gray)", fontSize: 13, marginBottom: 14 }}>
        Los destinos son los lugares físicos donde puede estar un producto: Bodega (de donde sale todo el stock) y las
        máquinas vending a las que se reparte. Agrega un destino nuevo cuando instales una máquina, o desactívalo si la
        dan de baja.
      </div>
      <div className="field">
        <label>Nuevo destino</label>
        <input ref={nuevoDestinoNombreRef} placeholder="Ej: Vending 3" />
      </div>
      <div className="err" style={{ color: err?.ok ? "var(--green)" : undefined }}>
        {err?.msg || ""}
      </div>
      <button className="btn" onClick={agregarDestino}>
        Agregar destino
      </button>

      <div style={{ marginTop: 22 }}>
        {data.destinosInventario
          .slice()
          .sort((a, b) => (b.esBodega ? 1 : 0) - (a.esBodega ? 1 : 0) || a.nombre.localeCompare(b.nombre))
          .map((d) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid var(--border)",
                opacity: d.activo ? 1 : 0.5,
              }}
            >
              <div style={{ flex: 1 }}>{d.nombre}</div>
              {d.esBodega ? (
                <span style={{ fontSize: 12, color: "var(--gray)" }}>Origen del stock</span>
              ) : (
                <>
                  <button className="icon-btn" onClick={() => toggleActivo(d)}>
                    {d.activo ? "Desactivar" : "Reactivar"}
                  </button>
                  {puedeBorrar && (
                    <button className="icon-btn" onClick={() => borrarDestino(d)}>
                      Borrar
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
