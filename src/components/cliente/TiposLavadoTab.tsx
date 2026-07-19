import Image from "next/image";
import Link from "next/link";
import { fmtCLP } from "@/lib/helpers";
import type { PreciosPublicos } from "./types";

export default function TiposLavadoTab({ precios }: { precios: PreciosPublicos | null }) {
  const categorias = Array.from(new Set((precios?.servicios ?? []).map((s) => s.categoria || "Otros")));

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>LAVADOS EXTERIOR TUNEL + USO ILIMITADO ESTACIONES DE ASPIRADO</h2>
      <div className="landing-banners" style={{ marginBottom: 22 }}>
        <Link href="/servicios/full-tunnel" className="landing-banner">
          <Image src="/servicios-precios.jpg" alt="Lavado Full Tunnel" fill unoptimized />
          <div className="overlay">
            <h3>🚿 Lavado Full Tunnel</h3>
            <p>Un pase completo por nuestro túnel, sin reserva de hora.</p>
            <span className="ver-mas">Ver detalles →</span>
          </div>
        </Link>
        <Link href="/servicios/plan-mensual" className="landing-banner">
          <Image src="/plan-mensual.jpg" alt="Plan Mensual Ilimitado" fill unoptimized />
          <div className="overlay">
            <h3>🚗 Plan Mensual Ilimitado</h3>
            <p>Lavados ilimitados por el túnel durante todo el mes.</p>
            <span className="ver-mas">Ver detalles →</span>
          </div>
        </Link>
        <Link href="/servicios/zona-aspirado" className="landing-banner">
          <Image src="/servicios-precios.jpg" alt="Uso Zona Aspirado Autoservicio" fill unoptimized />
          <div className="overlay">
            <h3>🧹 Uso Zona Aspirado Autoservicio</h3>
            <p>Estación de aspirado autoservicio, sin límite de tiempo por uso.</p>
            <span className="ver-mas">Ver detalles →</span>
          </div>
        </Link>
      </div>

      <h2 style={{ marginBottom: 12 }}>SERVICIOS DE LIMPIEZA PROFESIONAL Y DETAILING AUTOMOTRIZ</h2>
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
                  <Link href={`/servicios/${s.id}`} className="service-btn" key={s.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="nombre">{s.nombre}</div>
                    <div className="precio">{fmtCLP(s.precio)}</div>
                  </Link>
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
