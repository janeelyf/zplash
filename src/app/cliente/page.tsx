import Image from "next/image";
import UbicacionTab from "@/components/cliente/UbicacionTab";
import TiposLavadoTab from "@/components/cliente/TiposLavadoTab";
import DetailingTab from "@/components/cliente/DetailingTab";
import VentaEmpresaInfoTab from "@/components/cliente/VentaEmpresaInfoTab";
import FaqTab from "@/components/cliente/FaqTab";
import MiCuentaTab from "@/components/cliente/MiCuentaTab";
import CarritoBadge from "@/components/cliente/CarritoBadge";
import ClienteTabs from "@/components/cliente/ClienteTabs";
import { getPreciosPublicos } from "@/lib/preciosPublicos";

// Los precios se leen de la base en cada request (no estáticos en build):
// deben reflejar siempre lo que /api/pagos/webpay/crear va a cobrar de
// verdad, igual que el resto de las páginas que usan getPreciosPublicos().
export const dynamic = "force-dynamic";

export default async function ClientePage() {
  const precios = await getPreciosPublicos();

  return (
    <div id="app">
      <div className="cliente-header">
        <div className="title">
          <Image src="/logo.png" alt="ZPlash" width={30} height={30} className="topbar-logo" unoptimized />
          <span className="mode">Portal Cliente</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CarritoBadge />
          <a href="/pagar" className="btn" style={{ marginTop: 0, textDecoration: "none" }}>
            Pagar / Renovar plan
          </a>
        </div>
      </div>

      <div className="cliente-hero">
        <h1>Bienvenido a ZPlash</h1>
        <p>Toda la información de nuestro lavado de autos, y tu cuenta para revisar tus compras y vehículos.</p>
      </div>

      <div className="content">
        <ClienteTabs
          panels={{
            ubicacion: <UbicacionTab />,
            lavados: <TiposLavadoTab precios={precios} />,
            detailing: <DetailingTab precios={precios} />,
            empresa: <VentaEmpresaInfoTab precios={precios} />,
            faq: <FaqTab />,
            cuenta: <MiCuentaTab />,
          }}
        />
      </div>
    </div>
  );
}
