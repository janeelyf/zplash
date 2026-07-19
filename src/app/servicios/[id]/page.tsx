"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { fmtCLP } from "@/lib/helpers";
import { obtenerContenidoServicio } from "@/lib/servicioContenido";
import ProductoBanner from "@/components/cliente/ProductoBanner";
import type { PreciosPublicos } from "@/components/cliente/types";

const WHATSAPP_URL = (nombre: string) =>
  "https://wa.me/56939059611?text=" + encodeURIComponent(`Hola, quiero agendar el servicio "${nombre}" para mi auto`);

export default function ServicioLandingPage() {
  const { id } = useParams<{ id: string }>();
  const [precios, setPrecios] = useState<PreciosPublicos | null>(null);

  useEffect(() => {
    fetch("/api/pagos/precios")
      .then((r) => r.json())
      .then(setPrecios)
      .catch(() => setPrecios(null));
  }, []);

  const servicio = precios?.servicios.find((s) => s.id === id);
  const contenido = obtenerContenidoServicio(id);

  return (
    <div id="app">
      <div className="cliente-header">
        <div className="title">
          <Image src="/logo.png" alt="ZPlash" width={30} height={30} className="topbar-logo" unoptimized />
          <span className="mode">{servicio?.nombre ?? "Servicio"}</span>
        </div>
        <a href="/pagar" className="btn" style={{ marginTop: 0, textDecoration: "none" }}>
          Pagar / Renovar plan
        </a>
      </div>

      <div className="content">
        <a href="/cliente" className="landing-back">
          ← Volver a Tipos de Lavados
        </a>

        {!precios ? (
          <div className="empty">Cargando...</div>
        ) : !servicio ? (
          <div className="card">
            <p style={{ color: "var(--gray)", fontSize: 14 }}>No encontramos este servicio.</p>
          </div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 18 }}>
              <ProductoBanner imagen="/servicios-precios.jpg" alt={servicio.nombre} videoUrl={contenido.videoUrl} />
              <h3>{servicio.nombre}</h3>
              <div className="price-row" style={{ marginBottom: 0 }}>
                <span className="new">{fmtCLP(servicio.precio)}</span>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 18 }}>
              <h3>Cómo funciona</h3>
              <p style={{ color: "var(--gray)", fontSize: 14, lineHeight: 1.6 }}>{contenido.descripcion}</p>
            </div>

            <div className="card" style={{ textAlign: "center" }}>
              <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 14 }}>
                Este servicio se agenda con horario. Cuéntanos la patente de tu auto y coordinamos tu hora.
              </p>
              <a
                href={WHATSAPP_URL(servicio.nombre)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ textDecoration: "none", display: "inline-block" }}
              >
                Agendar por WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
