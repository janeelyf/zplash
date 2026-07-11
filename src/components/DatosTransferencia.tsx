import { DATOS_TRANSFERENCIA } from "@/lib/helpers";

/** Datos bancarios a mostrar cuando se elige "Transferencia bancaria" como forma de pago. */
export default function DatosTransferencia() {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        marginTop: 10,
        marginBottom: 4,
        fontSize: 13.5,
      }}
    >
      {DATOS_TRANSFERENCIA.map((d) => (
        <div key={d.label} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "2px 0" }}>
          <span style={{ color: "var(--gray)" }}>{d.label}</span>
          <span style={{ color: "var(--gold)", fontWeight: 600, textAlign: "right" }}>{d.valor}</span>
        </div>
      ))}
    </div>
  );
}
