const WHATSAPP_URL = "https://wa.me/56939059611?text=" + encodeURIComponent("Hola, quiero cotizar lavados para mi empresa");
const EMAIL = "TB@ZPLASH.CL";

export default function VentaEmpresaInfoTab() {
  return (
    <div className="card-grid">
      <div className="card">
        <h3>🏢 Lavados para tu empresa</h3>
        <p style={{ color: "var(--gray)", fontSize: 14, lineHeight: 1.6 }}>
          Compra lotes de cupones de lavado para regalar o entregar a tus trabajadores, clientes o proveedores. Cada
          cupón se canjea una sola vez, en el local, mostrando su código y la patente del vehículo.
        </p>
      </div>
      <div className="card">
        <h3>🧾 Boleta o factura</h3>
        <p style={{ color: "var(--gray)", fontSize: 14, lineHeight: 1.6 }}>
          Emitimos boleta o factura a nombre de tu empresa. El lote completo se paga por adelantado con el medio de
          pago que prefieras: efectivo, tarjeta o transferencia bancaria.
        </p>
      </div>
      <div className="card">
        <h3>📩 Cotiza tu lote</h3>
        <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 16 }}>
          Cuéntanos cuántos cupones necesitas y te enviamos una cotización.
        </p>
        <div className="map-actions">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn">
            Cotizar por WhatsApp
          </a>
          <a href={`mailto:${EMAIL}`} className="btn ghost">
            {EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
