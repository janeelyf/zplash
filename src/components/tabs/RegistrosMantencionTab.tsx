"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { uid, vehiculosDesdeUltimaMantencion } from "@/lib/helpers";
import type { RegistroMantencion } from "@/types";

export default function RegistrosMantencionTab() {
  const { data, ui, patchUi, commit } = useApp();
  const maquinariasActivas = data.maquinarias.filter((m) => m.activo);

  const [maquinariaId, setMaquinariaId] = useState(maquinariasActivas[0]?.id || "");
  const [descripcion, setDescripcion] = useState("");
  const [responsable, setResponsable] = useState(ui.perfilActual?.nombre || "");
  const [costoTexto, setCostoTexto] = useState("");
  const [notas, setNotas] = useState("");
  const [err, setErr] = useState<{ msg: string; ok: boolean } | null>(null);
  const puedeBorrar = ui.perfilActual?.modulos.includes("permisos") || false;

  const maquinariaNombre = (id: string) => data.maquinarias.find((m) => m.id === id)?.nombre || "(máquina eliminada)";

  const maquinariaSeleccionada = data.maquinarias.find((m) => m.id === maquinariaId);
  const proximoConteo = useMemo(() => {
    if (!maquinariaSeleccionada) return null;
    return vehiculosDesdeUltimaMantencion(maquinariaSeleccionada, data.registrosMantencion, data.ingresos, new Date().toISOString());
  }, [maquinariaSeleccionada, data.registrosMantencion, data.ingresos]);

  const registros = useMemo(
    () => data.registrosMantencion.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
    [data.registrosMantencion]
  );

  const limpiar = () => {
    setDescripcion("");
    setCostoTexto("");
    setNotas("");
  };

  const guardar = async () => {
    if (!maquinariaId) {
      setErr({ msg: "Selecciona una máquina", ok: false });
      return;
    }
    if (!descripcion.trim()) {
      setErr({ msg: "Describe la mantención realizada", ok: false });
      return;
    }
    const maquinaria = data.maquinarias.find((m) => m.id === maquinariaId);
    if (!maquinaria) {
      setErr({ msg: "La máquina seleccionada ya no existe", ok: false });
      return;
    }
    const costo = costoTexto.trim() ? Number(costoTexto) : undefined;
    if (costoTexto.trim() && (Number.isNaN(costo) || (costo as number) < 0)) {
      setErr({ msg: "El costo debe ser un número válido", ok: false });
      return;
    }

    const fecha = new Date().toISOString();
    const nuevo: RegistroMantencion = {
      id: uid(),
      maquinariaId,
      fecha,
      descripcion: descripcion.trim(),
      responsable: responsable.trim() || undefined,
      costo,
      vehiculosDesdeUltima: vehiculosDesdeUltimaMantencion(maquinaria, data.registrosMantencion, data.ingresos, fecha),
      notas: notas.trim() || undefined,
      creadoPor: ui.perfilActual?.nombre || undefined,
    };

    const ok = await commit({ registrosMantencion: [...data.registrosMantencion, nuevo] });
    if (!ok) {
      setErr({ msg: "No se pudo guardar el registro (sin conexión). Intenta de nuevo.", ok: false });
      return;
    }
    setErr({ msg: `Mantención registrada para "${maquinaria.nombre}".`, ok: true });
    limpiar();
  };

  const eliminarRegistro = (registro: RegistroMantencion) => {
    patchUi({
      modal: {
        type: "confirm",
        mensaje: `¿Eliminar el registro de mantención de "${maquinariaNombre(registro.maquinariaId)}" del ${new Date(registro.fecha).toLocaleString("es-CL")}? Esta acción no se puede deshacer.`,
        confirmLabel: "Eliminar",
        onConfirm: () => {
          commit({ registrosMantencion: data.registrosMantencion.filter((r) => r.id !== registro.id) });
        },
      },
    });
  };

  return (
    <div>
      <div className="hint" style={{ textAlign: "left", color: "var(--gray)", fontSize: 13, marginBottom: 14 }}>
        Al guardar, el sistema calcula automáticamente cuántos vehículos ingresaron al túnel desde la última
        mantención registrada de la máquina elegida (o desde que se creó, si es la primera).
      </div>

      {maquinariasActivas.length === 0 ? (
        <div className="empty">Agrega una máquina activa en la pestaña Máquinas antes de registrar una mantención</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div className="field" style={{ minWidth: 220, flex: 1 }}>
              <label>Máquina</label>
              <select value={maquinariaId} onChange={(e) => setMaquinariaId(e.target.value)}>
                {maquinariasActivas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ minWidth: 220, flex: 1 }}>
              <label>Responsable</label>
              <input value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Nombre de quien la realizó" />
            </div>
            <div className="field" style={{ minWidth: 140 }}>
              <label>Costo (opcional)</label>
              <input
                type="number"
                min={0}
                value={costoTexto}
                onChange={(e) => setCostoTexto(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="field">
            <label>Descripción</label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Cambio de cepillos laterales" />
          </div>

          <div className="field">
            <label>Notas (opcional)</label>
            <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Detalles adicionales" />
          </div>

          {proximoConteo !== null && (
            <div style={{ color: "var(--gray)", fontSize: 13, marginTop: 4 }}>
              Vehículos ingresados desde la última mantención de esta máquina: <strong>{proximoConteo}</strong>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
            <button className="btn ghost" onClick={limpiar}>
              Limpiar
            </button>
            <button className="btn" onClick={guardar}>
              Guardar mantención
            </button>
          </div>
          <div className="err" style={{ color: err?.ok ? "var(--green)" : undefined }}>
            {err?.msg || ""}
          </div>
        </>
      )}

      <h3 style={{ marginTop: 28 }}>Historial de mantenciones</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Máquina</th>
              <th>Descripción</th>
              <th>Vehículos desde última</th>
              <th>Responsable</th>
              <th>Costo</th>
              <th>Notas</th>
              {puedeBorrar && <th></th>}
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan={puedeBorrar ? 8 : 7}>
                  <div className="empty">Todavía no hay mantenciones registradas</div>
                </td>
              </tr>
            ) : (
              registros.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.fecha).toLocaleString("es-CL")}</td>
                  <td>{maquinariaNombre(r.maquinariaId)}</td>
                  <td>{r.descripcion}</td>
                  <td>{r.vehiculosDesdeUltima}</td>
                  <td>{r.responsable || "-"}</td>
                  <td>{r.costo != null ? `$${r.costo.toLocaleString("es-CL")}` : "-"}</td>
                  <td>{r.notas || "-"}</td>
                  {puedeBorrar && (
                    <td className="row-actions">
                      <button className="icon-btn" onClick={() => eliminarRegistro(r)}>
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
