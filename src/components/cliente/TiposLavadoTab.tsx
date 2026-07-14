import { PRECIO_LAVADO_UNICO, fmtCLP } from "@/lib/helpers";
import type { PreciosPublicos } from "./types";

export default function TiposLavadoTab({ precios }: { precios: PreciosPublicos | null }) {
  const categorias = Array.from(new Set((precios?.servicios ?? []).map((s) => s.categoria || "Otros")));

  return (
    <div>
      <div className="card" style={{ marginBottom: 18 }}>
        <h3>🚿 Lavado túnel único</h3>
        <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 10 }}>
          Para quienes no tienen el Plan Ilimitado Mensual vigente: un pase por el túnel de lavado.
        </p>
        <div className="price-row" style={{ marginBottom: 0 }}>
          <span className="new">{fmtCLP(PRECIO_LAVADO_UNICO)}</span>
        </div>
      </div>

      {!precios ? (
        <div className="empty">Cargando servicios...</div>
      ) : (
        categorias.map((cat) => (
          <div key={cat} style={{ marginBottom: 22 }}>
            <h3 style={{ marginBottom: 12 }}>{cat}</h3>
            <div className="service-grid">
              {precios.servicios
                .filter((s) => (s.categoria || "Otros") === cat)
                .map((s) => (
                  <div className="service-btn" key={s.id} style={{ cursor: "default" }}>
                    <div className="nombre">{s.nombre}</div>
                    <div className="precio">{fmtCLP(s.precio)}</div>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}

      <div className="card" style={{ marginTop: 4 }}>
        <p style={{ color: "var(--gray)", fontSize: 13 }}>
          Los servicios adicionales (tapiz, alfombra, techo, motor, chasis) se pueden agregar a cualquier lavado
          completo. Consulta disponibilidad en el local o por WhatsApp.
        </p>
      </div>
    </div>
  );
}
