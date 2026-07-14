"use client";

import { useEffect, useRef, useState } from "react";
import { fmtCLP, fmtFecha, isValidEmail, isValidPatente, normPlate } from "@/lib/helpers";

interface EstadoPlan {
  encontrado: boolean;
  nombre?: string;
  plan?: string;
  vencimiento?: string | null;
  estado?: { label: string; cls: "ok" | "warn" | "bad"; diasRestantes?: number };
}

interface PreciosResp {
  plan: { nombre: string; precio: number };
  planOneclick: { nombre: string; precio: number };
  servicios: { id: string; nombre: string; categoria?: string; precio: number }[];
}

export default function PagarPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [patente, setPatente] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [err, setErr] = useState("");
  const [resultado, setResultado] = useState<EstadoPlan | null>(null);
  const [precios, setPrecios] = useState<PreciosResp | null>(null);
  const [pagando, setPagando] = useState<string | null>(null);
  const [mostrarAuto, setMostrarAuto] = useState(false);
  const [email, setEmail] = useState("");
  const [inscribiendo, setInscribiendo] = useState(false);

  useEffect(() => {
    fetch("/api/pagos/precios")
      .then((r) => r.json())
      .then(setPrecios)
      .catch(() => setPrecios(null));
  }, []);

  async function buscar() {
    const p = normPlate(patente);
    if (!isValidPatente(p)) {
      setErr("Patente inválida. Ej: AB1234 o ABCD12.");
      return;
    }
    setErr("");
    setBuscando(true);
    setResultado(null);
    try {
      const res = await fetch(`/api/pagos/estado?patente=${encodeURIComponent(p)}`);
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "No se pudo consultar el estado");
        return;
      }
      setResultado(data);
    } catch {
      setErr("Sin conexión. Intenta de nuevo.");
    } finally {
      setBuscando(false);
    }
  }

  async function pagar(tipo: "plan_nuevo" | "renovacion" | "servicio", servicioId?: string, key?: string) {
    const p = normPlate(patente);
    if (!isValidPatente(p)) {
      setErr("Patente inválida. Ej: AB1234 o ABCD12.");
      return;
    }
    setErr("");
    setPagando(key || tipo);
    try {
      const res = await fetch("/api/pagos/webpay/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patente: p, tipo, servicioId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "No se pudo iniciar el pago");
        setPagando(null);
        return;
      }
      // Webpay Plus exige un POST con token_ws al `url` que devuelve, no un
      // simple redirect GET — se arma un form invisible y se autoenvía.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.url;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "token_ws";
      input.value = data.token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch {
      setErr("Sin conexión. Intenta de nuevo.");
      setPagando(null);
    }
  }

  async function activarAutomatica() {
    const p = normPlate(patente);
    if (!isValidPatente(p)) {
      setErr("Patente inválida. Ej: AB1234 o ABCD12.");
      return;
    }
    if (!isValidEmail(email)) {
      setErr("Email inválido.");
      return;
    }
    setErr("");
    setInscribiendo(true);
    try {
      const res = await fetch("/api/pagos/oneclick/inscribir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patente: p, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "No se pudo iniciar la inscripción");
        setInscribiendo(false);
        return;
      }
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.url;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "TBK_TOKEN";
      input.value = data.token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch {
      setErr("Sin conexión. Intenta de nuevo.");
      setInscribiendo(false);
    }
  }

  return (
    <div className="content" style={{ maxWidth: 640 }}>
      <div className="scan-panel">
        <h2>Pagar en ZPlash</h2>
        <p className="hint">Ingresa tu patente para renovar tu plan o pagar un servicio.</p>
        <input
          ref={inputRef}
          className="plate-input"
          value={patente}
          onChange={(e) => setPatente(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          placeholder="AB1234"
          maxLength={6}
        />
        <div className="err">{err}</div>
        <button className="btn" onClick={buscar} disabled={buscando}>
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {resultado && (
        <div className={`result-card ${resultado.encontrado ? "found" : "notfound"}`}>
          {resultado.encontrado ? (
            <>
              <div className="result-head">
                <strong>{resultado.nombre}</strong>
                {resultado.estado && <span className={`status-pill ${resultado.estado.cls}`}>{resultado.estado.label}</span>}
              </div>
              <div className="info-grid">
                <div>
                  <div className="k">Plan</div>
                  <div className="v">{resultado.plan || "Sin plan"}</div>
                </div>
                {resultado.vencimiento && (
                  <div>
                    <div className="k">Vencimiento</div>
                    <div className="v">{fmtFecha(resultado.vencimiento)}</div>
                  </div>
                )}
              </div>
              <button className="btn" style={{ marginTop: 16 }} onClick={() => pagar("renovacion")} disabled={pagando !== null}>
                {pagando === "renovacion" ? "Redirigiendo..." : `Renovar plan${precios ? ` — ${fmtCLP(precios.plan.precio)}` : ""}`}
              </button>
            </>
          ) : (
            <>
              <p>No encontramos un cliente con esa patente.</p>
              <button className="btn" style={{ marginTop: 12 }} onClick={() => pagar("plan_nuevo")} disabled={pagando !== null}>
                {pagando === "plan_nuevo" ? "Redirigiendo..." : `Contratar plan${precios ? ` — ${fmtCLP(precios.plan.precio)}` : ""}`}
              </button>
            </>
          )}

          {!mostrarAuto ? (
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setMostrarAuto(true)}>
              {precios
                ? `Renovación automática — ${fmtCLP(precios.planOneclick.precio)}/mes (ahorras ${fmtCLP(precios.plan.precio - precios.planOneclick.precio)})`
                : "¿Preferís que se renueve solo cada mes?"}
            </button>
          ) : (
            <div className="field" style={{ marginTop: 14 }}>
              <label>Email (para confirmar la inscripción de tu tarjeta)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.cl" />
              <button className="btn" style={{ marginTop: 10 }} onClick={activarAutomatica} disabled={inscribiendo}>
                {inscribiendo
                  ? "Redirigiendo..."
                  : `Activar renovación automática${precios ? ` — ${fmtCLP(precios.planOneclick.precio)}/mes` : ""}`}
              </button>
            </div>
          )}
        </div>
      )}

      {precios && precios.servicios.length > 0 && (
        <>
          <h3 style={{ margin: "24px 0 12px" }}>Servicios puntuales</h3>
          <div className="service-grid">
            {precios.servicios.map((s) => (
              <button
                key={s.id}
                className="service-btn"
                onClick={() => pagar("servicio", s.id, s.id)}
                disabled={pagando !== null}
              >
                <div className="nombre">{s.nombre}</div>
                <div className="precio">{pagando === s.id ? "Redirigiendo..." : fmtCLP(s.precio)}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
