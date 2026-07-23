const MENSAJES: Record<string, { titulo: string; texto: string; cls: "ok" | "warn" | "bad" }> = {
  ok: { titulo: "¡Pago exitoso!", texto: "Tu pago se procesó correctamente.", cls: "ok" },
  error: { titulo: "Pago rechazado", texto: "El pago no pudo procesarse. Puedes intentar de nuevo.", cls: "bad" },
  anulado: { titulo: "Pago cancelado", texto: "Cancelaste el pago antes de completarlo.", cls: "warn" },
};

export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; buyOrder?: string }>;
}) {
  const { estado: estadoParam, buyOrder } = await searchParams;
  const estado = estadoParam || "error";
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
