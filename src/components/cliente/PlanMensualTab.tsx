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
          Contrata o renueva un mes a la vez con cualquier tipo de tarjeta (Webpay Plus).
        </p>
        <div className="price-row" style={{ marginBottom: 14 }}>
          <span className="new">{precios ? fmtCLP(precios.plan.precio) : "..."}</span>
          <span style={{ color: "var(--gray)", fontSize: 12.5 }}>/ mes</span>
        </div>
        <a href="/pagar?item=plan" className="btn" style={{ marginTop: 0, textDecoration: "none" }}>
          Comprar
        </a>
      </div>

      <div className="card">
        <h3>Renovación automática</h3>
        <p style={{ color: "var(--gray)", fontSize: 13, marginBottom: 12 }}>
          Inscribe tu Tarjeta de Crédito una vez y te cobramos automáticamente cada mes, más barato.
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
        <a href="/pagar?item=plan&auto=1" className="btn" style={{ marginTop: 12, textDecoration: "none" }}>
          Contratar
        </a>
      </div>
    </div>
  );
}
