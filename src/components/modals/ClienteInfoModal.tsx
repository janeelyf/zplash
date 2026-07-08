"use client";

import { useApp } from "@/context/AppContext";
import { fmtDate } from "@/lib/helpers";
import type { Cliente } from "@/types";

export default function ClienteInfoModal({ data: c }: { data: Cliente }) {
  const { patchUi } = useApp();

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
      <div className="modal-actions">
        <button className="btn ghost" onClick={() => patchUi({ modal: null })}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
