"use client";

import { useState } from "react";
import { fmtCLP, formatRut, isValidEmail, isValidPatente, isValidRut, parsearPatentes } from "@/lib/helpers";
import { redirigirAWebpay } from "@/lib/webpayClient";
import { useSesionCliente } from "@/hooks/useSesionCliente";
import type { PreciosPublicos } from "@/components/cliente/types";

const WHATSAPP_URL = "https://wa.me/56939059611?text=" + encodeURIComponent("Hola, quiero cotizar lavados para mi empresa");
const EMAIL = "TB@ZPLASH.CL";

type TipoDocumento = "Boleta" | "Factura";
type ModoPatente = "abierto" | "lista";

interface TicketConsulta {
  codigo: string;
  nombreLote: string;
  numeroLote: number;
  totalLote: number;
  estado: string;
  patenteUso: string | null;
  fechaUso: string | null;
}

function estadoClase(estado: string): "ok" | "warn" | "bad" {
  if (estado === "Usado") return "ok";
  if (estado === "Caducado") return "bad";
  return "warn";
}

function FormularioCompra({ cantidad, precio }: { cantidad: number; precio: number }) {
  const { sesion } = useSesionCliente();
  const patentesPropias = sesion?.paso === "encontrado" ? sesion.vehiculos.map((v) => v.patente) : [];
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("Boleta");
  const [email, setEmail] = useState("");
  const [nombreLote, setNombreLote] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [rut, setRut] = useState("");
  const [direccion, setDireccion] = useState("");
  const [giro, setGiro] = useState("");
  const [modoPatente, setModoPatente] = useState<ModoPatente>("abierto");
  const [patentesTexto, setPatentesTexto] = useState("");
  const [pagando, setPagando] = useState(false);
  const [err, setErr] = useState("");

  async function comprar() {
    setErr("");
    if (!isValidEmail(email)) {
      setErr("Ingresa un email válido. Ahí podrás ver tus tickets desde Mi Cuenta.");
      return;
    }
    if (tipoDocumento === "Factura") {
      if (!razonSocial.trim() || !rut.trim() || !direccion.trim() || !giro.trim()) {
        setErr("Completa Razón Social, RUT, Dirección y Giro para la factura");
        return;
      }
      if (!isValidRut(rut)) {
        setErr("RUT inválido. Ej: 12.345.678-9");
        return;
      }
    }
    let patentes: string[] = [];
    if (modoPatente === "lista") {
      patentes = parsearPatentes(patentesTexto);
      const invalida = patentes.find((p) => !isValidPatente(p));
      if (invalida) {
        setErr(`Patente inválida: ${invalida}. Ej: AB1234 o ABCD12.`);
        return;
      }
    }

    setPagando(true);
    try {
      const res = await fetch("/api/pagos/webpay/crear-empresa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cantidad,
          tipoDocumento,
          email: email.trim().toLowerCase(),
          nombreLote: nombreLote.trim() || undefined,
          razonSocial: tipoDocumento === "Factura" ? razonSocial.trim() : undefined,
          rut: tipoDocumento === "Factura" ? rut.trim() : undefined,
          direccion: tipoDocumento === "Factura" ? direccion.trim() : undefined,
          giro: tipoDocumento === "Factura" ? giro.trim() : undefined,
          patentes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "No se pudo iniciar el pago");
        setPagando(false);
        return;
      }
      redirigirAWebpay(data.url, data.token);
    } catch {
      setErr("Sin conexión. Intenta de nuevo.");
      setPagando(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="field">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@empresa.cl"
        />
        <div style={{ color: "var(--gray)", fontSize: 12, marginTop: 4 }}>
          Con este correo podrás ver tus tickets desde Mi Cuenta.
        </div>
      </div>
      <div className="field">
        <label>Nombre del lote (opcional)</label>
        <input
          value={nombreLote}
          onChange={(e) => setNombreLote(e.target.value)}
          placeholder='Ej: Lavados rentacar SALFA Mayo'
          maxLength={120}
        />
        <div style={{ color: "var(--gray)", fontSize: 12, marginTop: 4 }}>
          Para reconocer este lote de tickets después, tanto tú como nosotros.
        </div>
      </div>
      <div className="field">
        <label>Tipo de documento</label>
        <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}>
          <option value="Boleta">Boleta</option>
          <option value="Factura">Factura</option>
        </select>
      </div>

      {tipoDocumento === "Factura" && (
        <div>
          <div className="field">
            <label>RUT</label>
            <input
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              onBlur={() => setRut((r) => (isValidRut(r) ? formatRut(r) : r))}
              placeholder="12.345.678-9"
            />
          </div>
          <div className="field">
            <label>Razón Social</label>
            <input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
          </div>
          <div className="field">
            <label>Dirección</label>
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
          <div className="field">
            <label>Giro</label>
            <input value={giro} onChange={(e) => setGiro(e.target.value)} />
          </div>
        </div>
      )}

      <div className="field">
        <label>¿Para qué patentes son los tickets?</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className={modoPatente === "abierto" ? "btn" : "btn ghost"}
            style={{ flex: 1, marginTop: 0 }}
            onClick={() => setModoPatente("abierto")}
          >
            Dejar abierto (cualquier patente)
          </button>
          <button
            type="button"
            className={modoPatente === "lista" ? "btn" : "btn ghost"}
            style={{ flex: 1, marginTop: 0 }}
            onClick={() => setModoPatente("lista")}
          >
            Ingresar patentes de mi flota
          </button>
        </div>
      </div>
      {modoPatente === "lista" && (
        <div className="field">
          <label>Patentes (una por línea o separadas por coma)</label>
          {patentesPropias.length > 0 && (
            <button
              type="button"
              className="btn ghost"
              style={{ marginTop: 0, marginBottom: 8, padding: "6px 10px", fontSize: 12.5 }}
              onClick={() => {
                const actuales = parsearPatentes(patentesTexto);
                const combinadas = [...actuales, ...patentesPropias].filter((p, i, arr) => arr.indexOf(p) === i);
                setPatentesTexto(combinadas.join(", "));
              }}
            >
              🚛 Cargar mis patentes registradas ({patentesPropias.length})
            </button>
          )}
          <textarea
            value={patentesTexto}
            onChange={(e) => setPatentesTexto(e.target.value)}
            placeholder={"AB1234\nCD5678"}
            rows={3}
            style={{ textTransform: "uppercase" }}
          />
        </div>
      )}

      <div className="err">{err}</div>
      <button className="btn" onClick={comprar} disabled={pagando}>
        {pagando ? "Redirigiendo..." : `Pagar con Webpay — ${fmtCLP(precio)}`}
      </button>
    </div>
  );
}

function ConsultaTickets() {
  const [rut, setRut] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [err, setErr] = useState("");
  const [tickets, setTickets] = useState<TicketConsulta[] | null>(null);

  async function buscar() {
    setErr("");
    setTickets(null);
    if (!isValidRut(rut)) {
      setErr("RUT inválido. Ej: 12.345.678-9");
      return;
    }
    setBuscando(true);
    try {
      const res = await fetch(`/api/empresa/tickets?rut=${encodeURIComponent(rut)}`);
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "No se pudo consultar");
        return;
      }
      setTickets(data.tickets);
    } catch {
      setErr("Sin conexión. Intenta de nuevo.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="card">
      <h3>📋 Consulta el uso de tus tickets</h3>
      <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 14 }}>
        Ingresa el RUT con el que compraste tu Pack Empresa y revisa qué tickets están disponibles, cuáles se usaron
        y en qué patente.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <input
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          placeholder="12.345.678-9"
          style={{ flex: "1 1 220px" }}
        />
        <button className="btn" style={{ marginTop: 0 }} onClick={buscar} disabled={buscando}>
          {buscando ? "Buscando..." : "Consultar"}
        </button>
      </div>
      <div className="err">{err}</div>

      {tickets && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>N°</th>
                <th>Lote</th>
                <th>Estado</th>
                <th>Patente de uso</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">No encontramos tickets para ese RUT</div>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.codigo}>
                    <td className="plate-tag">{t.codigo}</td>
                    <td>
                      {t.numeroLote}/{t.totalLote}
                    </td>
                    <td>{t.nombreLote}</td>
                    <td>
                      <span className={`status-pill ${estadoClase(t.estado)}`}>{t.estado}</span>
                    </td>
                    <td>{t.patenteUso || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function VentaEmpresaInfoTab({ precios }: { precios: PreciosPublicos | null }) {
  const [packAbierto, setPackAbierto] = useState<number | null>(null);

  return (
    <div>
      <div className="card-grid" style={{ marginBottom: 22 }}>
        <div className="card">
          <h3>🚛 Control absoluto de tu flota</h3>
          <p style={{ color: "var(--gray)", fontSize: 14, lineHeight: 1.6 }}>
            Packs de tickets de lavado para tu empresa, sin el vencimiento de 90 días de otros productos. Úsalos en
            los vehículos que definas: déjalos abiertos para cualquier patente, o entréganos las patentes de tu
            flota para las que los contrataste. Ideal para automotoras, rent a car y talleres mecánicos.
          </p>
        </div>
        <div className="card">
          <h3>📊 Reporte de uso</h3>
          <p style={{ color: "var(--gray)", fontSize: 14, lineHeight: 1.6 }}>
            Consulta cuándo y en qué patente se usó cada ticket con el RUT de tu empresa, sin depender de que te
            enviemos el detalle — más abajo tienes el buscador.
          </p>
        </div>
        <div className="card">
          <h3>🧾 Boleta o factura</h3>
          <p style={{ color: "var(--gray)", fontSize: 14, lineHeight: 1.6 }}>
            Precios con IVA incluido. Emitimos boleta o factura a nombre de tu empresa, pagando el pack completo por
            adelantado con Webpay.
          </p>
        </div>
      </div>

      <h3 style={{ marginBottom: 12 }}>Packs de tickets</h3>
      <div className="card-grid" style={{ marginBottom: 22 }}>
        {(precios?.packsEmpresa ?? []).map((p) => (
          <div className="card" key={p.cantidad}>
            <h3>{p.cantidad} Tickets</h3>
            <div className="price-row" style={{ marginBottom: 6 }}>
              <span className="new">{fmtCLP(p.precio)}</span>
            </div>
            <p style={{ color: "var(--gray)", fontSize: 13, marginBottom: 14 }}>
              Cada lavado te queda en {fmtCLP(Math.round(p.precio / p.cantidad))}
            </p>
            <button
              className="btn"
              style={{ marginTop: 0 }}
              onClick={() => setPackAbierto(packAbierto === p.cantidad ? null : p.cantidad)}
            >
              {packAbierto === p.cantidad ? "Cerrar" : "Comprar"}
            </button>
            {packAbierto === p.cantidad && <FormularioCompra cantidad={p.cantidad} precio={p.precio} />}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <h3>📩 ¿Necesitas otra cantidad?</h3>
        <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 16 }}>
          Si necesitas más tickets o una cantidad distinta a los packs de arriba, cuéntanos y te enviamos una
          cotización.
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

      <ConsultaTickets />
    </div>
  );
}
