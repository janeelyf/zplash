"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const MENSAJES: Record<string, { titulo: string; texto: string; cls: "ok" | "warn" | "bad" }> = {
  ok: { titulo: "¡Pago exitoso!", texto: "Tu pago se procesó correctamente.", cls: "ok" },
  error: { titulo: "Pago rechazado", texto: "El pago no pudo procesarse. Puedes intentar de nuevo.", cls: "bad" },
  anulado: { titulo: "Pago cancelado", texto: "Cancelaste el pago antes de completarlo.", cls: "warn" },
};

function Resultado() {
  const params = useSearchParams();
  const estado = params.get("estado") || "error";
  const buyOrder = params.get("buyOrder");
  const info = MENSAJES[estado] || MENSAJES.error;

  return (
    <div className="content" style={{ maxWidth: 480 }}>
      <a href="/cliente" className="landing-back">
        ← Volver a Inicio
      </a>
      <div className={`result-card ${info.cls === "ok" ? "found" : "notfound"}`}>
        <div className="result-head">
          <strong>{info.titulo}</strong>
          <span className={`status-pill ${info.cls}`}>{estado.toUpperCase()}</span>
        </div>
        <p>{info.texto}</p>
        {buyOrder && (
          <p style={{ marginTop: 10, color: "var(--gray)", fontSize: 12.5 }}>N° de orden: {buyOrder}</p>
        )}
        <a href="/pagar" className="btn" style={{ display: "inline-block", marginTop: 16, textDecoration: "none" }}>
          Volver
        </a>
      </div>
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense>
      <Resultado />
    </Suspense>
  );
}
