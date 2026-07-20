"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  cancelarSuscripcionOneclick,
  cobrarSuscripcionManual,
  obtenerSuscripcionOneclick,
  reactivarSuscripcionOneclick,
  suspenderSuscripcionOneclick,
} from "@/lib/db";
import type { SuscripcionOneclickInfo } from "@/lib/dataAccess";
import { fmtDate } from "@/lib/helpers";
import type { Cliente } from "@/types";

export default function ClienteInfoModal({ data: c }: { data: Cliente }) {
  const { patchUi } = useApp();
  const [suscripcion, setSuscripcion] = useState<SuscripcionOneclickInfo | null>(null);
  const [cobrando, setCobrando] = useState(false);
  const [errSuscripcion, setErrSuscripcion] = useState("");

  useEffect(() => {
    obtenerSuscripcionOneclick(c.patente)
      .then(setSuscripcion)
      .catch(() => setSuscripcion(null));
  }, [c.patente]);

  async function reintentarCobro() {
    if (!suscripcion) return;
    setCobrando(true);
    setErrSuscripcion("");
    try {
      const resultado = await cobrarSuscripcionManual(suscripcion.id);
      if (!resultado) {
        setErrSuscripcion("No se pudo reintentar el cobro.");
        return;
      }
      const actualizada = await obtenerSuscripcionOneclick(c.patente);
      setSuscripcion(actualizada);
      if (resultado.estado === "rechazada") setErrSuscripcion("El cobro fue rechazado nuevamente.");
    } catch {
      setErrSuscripcion("Este ciclo ya fue cobrado o hubo un error.");
    } finally {
      setCobrando(false);
    }
  }

  async function reactivar() {
    if (!suscripcion) return;
    setCobrando(true);
    setErrSuscripcion("");
    try {
      await reactivarSuscripcionOneclick(suscripcion.id);
      const actualizada = await obtenerSuscripcionOneclick(c.patente);
      setSuscripcion(actualizada);
    } catch {
      setErrSuscripcion("No se pudo reactivar la suscripción.");
    } finally {
      setCobrando(false);
    }
  }

  function suspender() {
    if (!suscripcion) return;
    patchUi({
      modal: {
        type: "confirm",
        mensaje: `¿Suspender la renovación automática de ${c.nombre}? Se pausan los cobros, pero la tarjeta queda inscrita y se puede reactivar después.`,
        confirmLabel: "Suspender",
        danger: false,
        onConfirm: () => suspenderSuscripcionOneclick(suscripcion.id),
      },
    });
  }

  function cancelar() {
    if (!suscripcion) return;
    patchUi({
      modal: {
        type: "confirm",
        mensaje: `¿Cancelar la renovación automática de ${c.nombre}? Se elimina la tarjeta inscrita en Transbank y no se puede reactivar después.`,
        confirmLabel: "Cancelar suscripción",
        danger: true,
        onConfirm: () => cancelarSuscripcionOneclick(suscripcion.id),
      },
    });
  }

  return (
    <div className="modal" style={{ maxWidth: 400 }}>
      <h3>Información adicional</h3>
      <div className="info-grid">
        <div>
          <div className="k">Cliente</div>
          <div className="v">{c.nombre}</div>
        </div>
        <div>
          <div className="k">Patente</div>
          <div className="v">{c.patente}</div>
        </div>
        <div>
          <div className="k">Creado por</div>
          <div className="v">{c.creadoPor || "No disponible"}</div>
        </div>
        <div>
          <div className="k">Fecha de creación</div>
          <div className="v">{c.creadoEn ? fmtDate(c.creadoEn) : "-"}</div>
        </div>
      </div>

      {suscripcion && (
        <div className="info-grid" style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <div>
            <div className="k">Renovación automática</div>
            <div className="v">
              {suscripcion.estado === "activa"
                ? "Activa"
                : suscripcion.estado === "suspendida"
                  ? "Suspendida"
                  : suscripcion.estado === "cancelada"
                    ? "Cancelada"
                    : "Pendiente"}
              {suscripcion.cardUltimosDigitos ? ` (tarjeta ${suscripcion.cardUltimosDigitos})` : ""}
            </div>
          </div>
          {suscripcion.proximoCobro && (
            <div>
              <div className="k">Próximo cobro</div>
              <div className="v">{fmtDate(suscripcion.proximoCobro)}</div>
            </div>
          )}
          {suscripcion.ultimoCobro && (
            <div>
              <div className="k">Último intento</div>
              <div className="v">
                {suscripcion.ultimoCobro.estado === "aprobada" ? "Aprobado" : "Rechazado"} — {fmtDate(suscripcion.ultimoCobro.fecha)}
              </div>
            </div>
          )}
          {(suscripcion.estado === "activa" || suscripcion.estado === "suspendida") && (
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {suscripcion.ultimoCobro?.estado === "rechazada" && suscripcion.estado === "activa" && (
                <button className="btn secondary" onClick={reintentarCobro} disabled={cobrando}>
                  {cobrando ? "Cobrando..." : "Reintentar cobro ahora"}
                </button>
              )}
              {suscripcion.estado === "activa" && (
                <button className="btn secondary" onClick={suspender} disabled={cobrando}>
                  Suspender
                </button>
              )}
              {suscripcion.estado === "suspendida" && (
                <button className="btn secondary" onClick={reactivar} disabled={cobrando}>
                  {cobrando ? "Reactivando..." : "Reactivar"}
                </button>
              )}
              <button className="btn danger" onClick={cancelar} disabled={cobrando}>
                Cancelar suscripción
              </button>
              {errSuscripcion && <div style={{ width: "100%" }} className="err">{errSuscripcion}</div>}
            </div>
          )}
        </div>
      )}

      <div className="modal-actions">
        <button className="btn ghost" onClick={() => patchUi({ modal: null })}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
