"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import DatosTransferencia from "@/components/DatosTransferencia";
import { fmtCLP } from "@/lib/helpers";
import type { PagoInfo } from "@/types";

export default function PagoModal({
  monto,
  descripcion,
  onConfirm,
}: {
  monto: number;
  descripcion: string;
  onConfirm: (pago: PagoInfo) => void;
}) {
  const { patchUi } = useApp();
  const [metodo, setMetodo] = useState<"efectivo" | "tarjeta" | "transferencia" | null>(null);
  const [err, setErr] = useState("");

  const confirmar = () => {
    if (!metodo) {
      setErr("Selecciona una forma de pago");
      return;
    }
    onConfirm({ metodo });
    patchUi({ modal: null });
  };

  return (
    <div className="modal" style={{ maxWidth: 400 }}>
      <h3>Forma de pago</h3>
      <div style={{ color: "var(--white)", fontSize: 14, marginBottom: 12 }}>{descripcion}</div>
      <div style={{ fontWeight: 700, fontSize: 26, color: "var(--gold)", marginBottom: 18 }}>{fmtCLP(monto)}</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button
          className={metodo === "efectivo" ? "btn" : "btn ghost"}
          style={{ flex: 1, marginTop: 0 }}
          onClick={() => {
            setMetodo("efectivo");
            setErr("");
          }}
        >
          Efectivo
        </button>
        <button
          className={metodo === "tarjeta" ? "btn" : "btn ghost"}
          style={{ flex: 1, marginTop: 0 }}
          onClick={() => {
            setMetodo("tarjeta");
            setErr("");
          }}
        >
          Tarjeta
        </button>
        <button
          className={metodo === "transferencia" ? "btn" : "btn ghost"}
          style={{ flex: 1, marginTop: 0 }}
          onClick={() => {
            setMetodo("transferencia");
            setErr("");
          }}
        >
          Transferencia bancaria
        </button>
      </div>
      {metodo === "transferencia" && <DatosTransferencia />}
      <div className="err">{err}</div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={() => patchUi({ modal: null })}>
          Cancelar
        </button>
        <button className="btn" onClick={confirmar}>
          Confirmar
        </button>
      </div>
    </div>
  );
}
