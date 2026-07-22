"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { ESTADOS_CITA, esEstadoFinal, esRetrocesoInvalido } from "@/lib/agenda";
import { fmtCLP, sumarDias, todayYMD, ymd } from "@/lib/helpers";
import type { Cita, Venta } from "@/types";

export default function ServiciosAdicionalesLog() {
  const { data, ui, commit, patchUi } = useApp();
  const [fechaLog, setFechaLog] = useState(todayYMD());

  const logList = data.ventas.filter((v) => v.esServicioAdicional && ymd(new Date(v.fecha)) === fechaLog);

  // Solo Gerencia (módulo "permisos", mismo criterio que PerfilesTab) puede
  // borrar un servicio ya registrado: es destructivo y además elimina el
  // pago Transbank asociado, si tuvo uno (ver deleteVentas en dataAccess.ts).
  const puedeEliminarServicios = ui.perfilActual?.modulos.includes("permisos") || false;

  const eliminarServicio = (v: Venta) => {
    patchUi({
      modal: {
        type: "confirm",
        mensaje: `¿Eliminar el servicio de ${v.patente} (${v.nombre})? Esta acción no se puede deshacer y también elimina el pago asociado, si existe.`,
        onConfirm: () => {
          commit({ ventas: data.ventas.filter((x) => x.id !== v.id) });
        },
      },
    });
  };

  // Al retirar el vehículo (último paso del circuito) se cobra cualquier
  // saldo pendiente de las ventas ligadas a esa cita antes de aplicar el
  // cambio de status: si ya estaba todo pagado, se aplica directo.
  const cambiarStatusCita = (citaId: string, estado: Cita["estado"]) => {
    if (estado === "retirado") {
      const ventasCita = data.ventas.filter((v) => v.citaId === citaId);
      const totalPrecio = ventasCita.reduce((s, v) => s + v.precio, 0);
      const totalCobrado = ventasCita.reduce((s, v) => s + (v.montoCobrado ?? 0), 0);
      const saldo = totalPrecio - totalCobrado;
      if (saldo > 0) {
        patchUi({
          modal: {
            type: "pago",
            monto: saldo,
            descripcion: `Saldo pendiente — ${ventasCita[0]?.patente || ""}`,
            onConfirm: (pago) => {
              commit({
                ventas: data.ventas.map((v) =>
                  v.citaId === citaId ? { ...v, estadoPago: "pagado", montoCobrado: v.precio, metodoPago: pago.metodo } : v
                ),
                citas: data.citas.map((c) => (c.id === citaId ? { ...c, estado } : c)),
              });
            },
          },
        });
        return;
      }
    }
    commit({ citas: data.citas.map((c) => (c.id === citaId ? { ...c, estado } : c)) });
  };

  return (
    <div className="today-log">
      <h3>Servicios registrados{fechaLog === todayYMD() ? " hoy" : ` el ${fechaLog}`}</h3>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button className="btn ghost" style={{ marginTop: 0 }} onClick={() => setFechaLog(sumarDias(fechaLog, -1))}>
          ← Día anterior
        </button>
        <input type="date" value={fechaLog} onChange={(e) => setFechaLog(e.target.value)} style={{ flex: "0 0 auto" }} />
        <button className="btn ghost" style={{ marginTop: 0 }} onClick={() => setFechaLog(sumarDias(fechaLog, 1))}>
          Día siguiente →
        </button>
        {fechaLog !== todayYMD() && (
          <button className="btn ghost" style={{ marginTop: 0 }} onClick={() => setFechaLog(todayYMD())}>
            Volver a hoy
          </button>
        )}
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Patente</th>
              <th>Servicio</th>
              <th>Pago</th>
              <th>Entrega</th>
              <th>Status</th>
              <th>Precio</th>
              {puedeEliminarServicios && <th></th>}
            </tr>
          </thead>
          <tbody>
            {logList.length === 0 ? (
              <tr>
                <td colSpan={puedeEliminarServicios ? 7 : 6}>
                  <div className="empty">Sin servicios registrados ese día</div>
                </td>
              </tr>
            ) : (
              logList.map((v) => (
                <tr key={v.id} title={v.notas || undefined}>
                  <td>
                    <span className="plate-tag">{v.patente}</span>
                  </td>
                  <td>
                    {v.nombre} — {v.tipo}
                  </td>
                  <td>
                    {v.estadoPago && (
                      <span
                        className={`status-pill ${v.estadoPago === "pagado" ? "ok" : v.estadoPago === "abono50" ? "warn" : "bad"}`}
                      >
                        {v.estadoPago === "pagado"
                          ? "Pagado"
                          : v.estadoPago === "abono50"
                          ? `Abono ${fmtCLP(v.montoCobrado ?? 0)}`
                          : "Por pagar"}
                      </span>
                    )}
                  </td>
                  <td>
                    {v.horaEntrega
                      ? `${v.fechaEntrega && v.fechaEntrega !== todayYMD() ? `${v.fechaEntrega} ` : ""}${v.horaEntrega}`
                      : "—"}
                  </td>
                  <td>
                    {v.citaId ? (
                      <StatusCell
                        // Fuerza a remontar (y así resetear la selección local al
                        // valor real) cuando el estado de la cita cambia por fuera
                        // de este control, en vez de sincronizar con un efecto.
                        key={`${v.citaId}:${data.citas.find((c) => c.id === v.citaId)?.estado || "agendado"}`}
                        estadoActual={data.citas.find((c) => c.id === v.citaId)?.estado || "agendado"}
                        onCambiar={(estado) => cambiarStatusCita(v.citaId!, estado)}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{fmtCLP(v.precio)}</td>
                  {puedeEliminarServicios && (
                    <td className="row-actions">
                      <button className="icon-btn" onClick={() => eliminarServicio(v)}>
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

// Selector + botón "Cambiar" en vez de aplicar al vuelo con onChange: así el
// cambio de status (incluido el cobro de saldo al pasar a "Retirado") solo
// ocurre cuando el usuario confirma, no con un clic accidental en el select.
function StatusCell({
  estadoActual,
  onCambiar,
}: {
  estadoActual: Cita["estado"];
  onCambiar: (estado: Cita["estado"]) => void;
}) {
  // No hay un useEffect que resincronice `seleccion` con `estadoActual`: el
  // padre remonta este componente (ver el `key` en el llamador) cada vez que
  // el estado real de la cita cambia por fuera de este control, así que el
  // valor inicial de useState ya queda al día solo.
  const [seleccion, setSeleccion] = useState<Cita["estado"]>(estadoActual);
  const bloqueado = esEstadoFinal(estadoActual);

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <select
        value={seleccion}
        onChange={(e) => setSeleccion(e.target.value as Cita["estado"])}
        disabled={bloqueado}
        style={{ fontSize: 13 }}
      >
        {ESTADOS_CITA.map((e) => (
          <option key={e.valor} value={e.valor} disabled={esRetrocesoInvalido(estadoActual, e.valor)}>
            {e.label}
          </option>
        ))}
      </select>
      {!bloqueado && (
        <button
          type="button"
          className="btn ghost"
          style={{ marginTop: 0, padding: "4px 10px", fontSize: 12 }}
          disabled={seleccion === estadoActual}
          onClick={() => onCambiar(seleccion)}
        >
          Cambiar
        </button>
      )}
    </div>
  );
}
