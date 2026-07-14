import Image from "next/image";
import { fmtCLP } from "@/lib/helpers";
import type { PreciosPublicos } from "./types";

export default function PlanMensualTab({ precios }: { precios: PreciosPublicos | null }) {
  return (
    <div className="card-grid">
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <Image
          src="/plan-mensual.jpg"
          alt="Plan Full Túnel Ilimitado"
          width={900}
          height={300}
          unoptimized
          style={{ width: "100%", height: "auto", borderRadius: 12, marginBottom: 16 }}
        />
        <h3>🚗 Plan Full Túnel Ilimitado</h3>
        <p style={{ color: "var(--gray)", fontSize: 14, lineHeight: 1.6 }}>
          Lavados ilimitados por el túnel durante todo el mes (un ingreso al día). Ideal para quienes usan el auto
          a diario y quieren mantenerlo siempre limpio sin pensar en pagar cada vez.
        </p>
      </div>

      <div className="card">
        <h3>Pago período a período</h3>
        <p style={{ color: "var(--gray)", fontSize: 13, marginBottom: 12 }}>
          Contrata o renueva un mes a la vez con tarjeta (Webpay Plus).
        </p>
        <div className="price-row" style={{ marginBottom: 0 }}>
          <span className="new">{precios ? fmtCLP(precios.plan.precio) : "..."}</span>
          <span style={{ color: "var(--gray)", fontSize: 12.5 }}>/ mes</span>
        </div>
      </div>

      <div className="card">
        <h3>Renovación automática</h3>
        <p style={{ color: "var(--gray)", fontSize: 13, marginBottom: 12 }}>
          Inscribe tu tarjeta una vez y te cobramos automáticamente cada mes, más barato.
        </p>
        <div className="price-row" style={{ marginBottom: 0 }}>
          <span className="new">{precios ? fmtCLP(precios.planOneclick.precio) : "..."}</span>
          <span style={{ color: "var(--gray)", fontSize: 12.5 }}>/ mes</span>
        </div>
        {precios && (
          <div className="save" style={{ marginTop: 6 }}>
            Ahorras {fmtCLP(precios.plan.precio - precios.planOneclick.precio)} al mes
          </div>
        )}
      </div>

      <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
        <a href="/pagar" className="btn" style={{ textDecoration: "none", display: "inline-block" }}>
          Contratar o renovar mi plan
        </a>
      </div>
    </div>
  );
}
