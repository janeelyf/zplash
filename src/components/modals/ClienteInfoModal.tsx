"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { obtenerSuscripcionOneclick, cobrarSuscripcionManual } from "@/lib/db";
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
              {suscripcion.estado === "activa" ? "Activa" : suscripcion.estado === "cancelada" ? "Cancelada" : "Pendiente"}
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
          {suscripcion.ultimoCobro?.estado === "rechazada" && suscripcion.estado === "activa" && (
            <div style={{ gridColumn: "1 / -1" }}>
              <button className="btn secondary" onClick={reintentarCobro} disabled={cobrando}>
                {cobrando ? "Cobrando..." : "Reintentar cobro ahora"}
              </button>
              {errSuscripcion && <div className="err">{errSuscripcion}</div>}
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
