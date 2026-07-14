"use client";

import { useState } from "react";
import { fmtCLP, fmtFecha } from "@/lib/helpers";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"
      />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

// Diseño asume que la cuenta de Google se vincula a un cliente por
// coincidencia de email (clientes.email) — no todos los clientes tienen
// email cargado hoy (es un campo opcional), así que la maqueta también
// cubre el caso en que la cuenta de Google no calza con ningún registro.
const EMAIL_ENCONTRADO = "juan.perez@gmail.com";
const EMAIL_NO_ENCONTRADO = "otro.correo@gmail.com";
const WHATSAPP_URL = "https://wa.me/56939059611?text=" + encodeURIComponent("Hola, quiero vincular mi correo a mi cuenta ZPlash");

const VEHICULOS_DEMO = [
  { patente: "AB1234", plan: "Plan Ilimitado Mensual", estado: { label: "Vigente", cls: "ok" as const }, vencimiento: "2026-08-02" },
  { patente: "CD5678", plan: "Sin plan", estado: { label: "Vencido", cls: "bad" as const }, vencimiento: null },
];

const COMPRAS_DEMO = [
  { fecha: "2026-07-10T10:15:00", tipo: "Renovación de plan", monto: 19990 },
  { fecha: "2026-06-28T16:40:00", tipo: "Limpieza de Tapiz", monto: 15000 },
  { fecha: "2026-06-10T09:05:00", tipo: "Lavado único", monto: 9990 },
];

type Paso = "login" | "conectando" | "encontrado" | "no-encontrado";

function CuentaBar({ email, onLogout }: { email: string; onLogout: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="demo-badge">Vista previa</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GoogleIcon />
          <span style={{ fontSize: 13 }}>{email}</span>
        </div>
      </div>
      <button type="button" className="logout-btn" onClick={onLogout}>
        Cerrar sesión
      </button>
    </div>
  );
}

export default function MiCuentaTab() {
  const [paso, setPaso] = useState<Paso>("login");

  const conectar = (destino: "encontrado" | "no-encontrado") => {
    setPaso("conectando");
    setTimeout(() => setPaso(destino), 600);
  };

  if (paso === "login" || paso === "conectando") {
    return (
      <div className="card" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
        <h3>Mi Cuenta</h3>
        <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 20 }}>
          Inicia sesión con tu cuenta de Google para ver tus compras y vehículos registrados. Buscamos tus datos
          por el correo asociado a esa cuenta.
        </p>
        <button type="button" className="google-btn" onClick={() => conectar("encontrado")} disabled={paso === "conectando"}>
          <GoogleIcon />
          {paso === "conectando" ? "Conectando con Google..." : "Iniciar sesión con Google"}
        </button>
        <p style={{ color: "var(--gray)", fontSize: 11.5, marginTop: 16 }}>
          El inicio de sesión con Google todavía no está conectado — este botón muestra una vista previa con datos
          de ejemplo.{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              conectar("no-encontrado");
            }}
            style={{ color: "var(--gold)" }}
          >
            Ver ejemplo si el correo no está registrado
          </a>
          .
        </p>
      </div>
    );
  }

  if (paso === "no-encontrado") {
    return (
      <div>
        <CuentaBar email={EMAIL_NO_ENCONTRADO} onLogout={() => setPaso("login")} />
        <div className="card" style={{ maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
          <h3>No encontramos tus datos</h3>
          <p style={{ color: "var(--gray)", fontSize: 14, marginBottom: 18 }}>
            No tenemos ningún vehículo registrado con el correo <strong>{EMAIL_NO_ENCONTRADO}</strong>. Si ya eres
            cliente pero con otro correo o solo con tu teléfono, escríbenos y lo vinculamos.
          </p>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn" style={{ textDecoration: "none", display: "inline-block" }}>
            Vincular mi cuenta por WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CuentaBar email={EMAIL_ENCONTRADO} onLogout={() => setPaso("login")} />

      <h3 style={{ marginBottom: 12 }}>Mis vehículos</h3>
      <div className="card-grid" style={{ marginBottom: 26 }}>
        {VEHICULOS_DEMO.map((v) => (
          <div className="vehicle-card" key={v.patente}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="plate-tag">{v.patente}</span>
              <span className={`status-pill ${v.estado.cls}`}>{v.estado.label}</span>
            </div>
            <div className="plan-nombre">{v.plan}</div>
            {v.vencimiento && (
              <div style={{ color: "var(--gray)", fontSize: 12.5 }}>Vence el {fmtFecha(v.vencimiento)}</div>
            )}
          </div>
        ))}
      </div>

      <h3 style={{ marginBottom: 12 }}>Historial de compras</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Detalle</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {COMPRAS_DEMO.map((c, i) => (
              <tr key={i}>
                <td>{fmtFecha(c.fecha)}</td>
                <td>{c.tipo}</td>
                <td>{fmtCLP(c.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
