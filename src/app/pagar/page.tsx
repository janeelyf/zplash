"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fmtCLP, fmtFecha, isValidEmail, isValidPatente, normPlate } from "@/lib/helpers";
import { redirigirAWebpay } from "@/lib/webpayClient";
import GoogleIcon from "@/components/GoogleIcon";
import CarritoBadge from "@/components/cliente/CarritoBadge";

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
  lavadoUnico: { nombre: string; precio: number };
  zonaAspirado: { nombre: string; precio: number };
  servicios: { id: string; nombre: string; categoria?: string; precio: number }[];
}

type TipoPago = "plan_nuevo" | "renovacion" | "servicio" | "lavado_unico" | "aspirado";
type AccionPlan = { tipo: "plan_nuevo" | "renovacion"; label: string };
type PasoMetodo = "elegir" | "google-conectando" | "google-preview";

function PagarPage() {
  const params = useSearchParams();
  const item = params.get("item");
  const soloPagoUnico = item === "plan" && params.get("auto") !== "1";
  const inputRef = useRef<HTMLInputElement>(null);
  const [patente, setPatente] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [err, setErr] = useState("");
  const [resultado, setResultado] = useState<EstadoPlan | null>(null);
  const [precios, setPrecios] = useState<PreciosResp | null>(null);
  const [pagando, setPagando] = useState<string | null>(null);
  const [mostrarAuto, setMostrarAuto] = useState(params.get("auto") === "1");
  const [email, setEmail] = useState("");
  const [inscribiendo, setInscribiendo] = useState(false);
  const [accionPlan, setAccionPlan] = useState<AccionPlan | null>(null);
  const [pasoMetodo, setPasoMetodo] = useState<PasoMetodo | null>(null);

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

  async function pagar(tipo: TipoPago, servicioId?: string, key?: string) {
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
        body: JSON.stringify({ patente: p, items: [{ tipo, servicioId }] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "No se pudo iniciar el pago");
        setPagando(null);
        return;
      }
      redirigirAWebpay(data.url, data.token);
    } catch {
      setErr("Sin conexión. Intenta de nuevo.");
      setPagando(null);
    }
  }

  function elegirMetodo(tipo: "plan_nuevo" | "renovacion", label: string) {
    setAccionPlan({ tipo, label });
    setPasoMetodo("elegir");
  }

  function cancelarMetodo() {
    setAccionPlan(null);
    setPasoMetodo(null);
  }

  function conectarGoogle() {
    setPasoMetodo("google-conectando");
    setTimeout(() => setPasoMetodo("google-preview"), 600);
  }

  function confirmarPago() {
    if (!accionPlan) return;
    const tipo = accionPlan.tipo;
    setAccionPlan(null);
    setPasoMetodo(null);
    pagar(tipo);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <a href="/cliente" className="landing-back" style={{ marginBottom: 0 }}>
          ← Volver a Inicio
        </a>
        <CarritoBadge />
      </div>

      {item === "plan" && (
        <div className="card" style={{ marginBottom: 18 }}>
          <p style={{ color: "var(--gray)", fontSize: 13.5 }}>Vas a contratar:</p>
          <h3>🚗 Plan Ilimitado Mensual</h3>
        </div>
      )}

      {item === "lavado_unico" && precios && (
        <div className="card" style={{ marginBottom: 18 }}>
          <p style={{ color: "var(--gray)", fontSize: 13.5, marginBottom: 6 }}>Vas a pagar:</p>
          <h3 style={{ marginBottom: 10 }}>🚿 Lavado Full Tunnel</h3>
          <div className="price-row" style={{ marginBottom: 14 }}>
            <span className="new">{fmtCLP(precios.lavadoUnico.precio)}</span>
          </div>
          <input
            className="plate-input"
            value={patente}
            onChange={(e) => setPatente(e.target.value.toUpperCase())}
            placeholder="AB1234"
            maxLength={6}
            style={{ marginBottom: 10 }}
          />
          <div className="err">{err}</div>
          <button className="btn" onClick={() => pagar("lavado_unico")} disabled={pagando !== null}>
            {pagando === "lavado_unico" ? "Redirigiendo..." : "Pagar ahora"}
          </button>
        </div>
      )}

      {item === "aspirado" && precios && (
        <div className="card" style={{ marginBottom: 18 }}>
          <p style={{ color: "var(--gray)", fontSize: 13.5, marginBottom: 6 }}>Vas a pagar:</p>
          <h3 style={{ marginBottom: 10 }}>🧹 Uso Zona Aspirado Autoservicio</h3>
          <div className="price-row" style={{ marginBottom: 14 }}>
            <span className="new">{fmtCLP(precios.zonaAspirado.precio)}</span>
          </div>
          <input
            className="plate-input"
            value={patente}
            onChange={(e) => setPatente(e.target.value.toUpperCase())}
            placeholder="AB1234"
            maxLength={6}
            style={{ marginBottom: 10 }}
          />
          <div className="err">{err}</div>
          <button className="btn" onClick={() => pagar("aspirado")} disabled={pagando !== null}>
            {pagando === "aspirado" ? "Redirigiendo..." : "Pagar ahora"}
          </button>
        </div>
      )}

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
              {!mostrarAuto && (
                <button
                  className="btn"
                  style={{ marginTop: 16 }}
                  onClick={() => elegirMetodo("renovacion", "Renovar plan")}
                  disabled={pagando !== null || accionPlan !== null}
                >
                  {pagando === "renovacion" ? "Redirigiendo..." : `Renovar plan${precios ? ` — ${fmtCLP(precios.plan.precio)}` : ""}`}
                </button>
              )}
            </>
          ) : (
            <>
              <p>No encontramos un cliente con esa patente.</p>
              {!mostrarAuto && (
                <button
                  className="btn"
                  style={{ marginTop: 12 }}
                  onClick={() => elegirMetodo("plan_nuevo", "Contratar plan")}
                  disabled={pagando !== null || accionPlan !== null}
                >
                  {pagando === "plan_nuevo" ? "Redirigiendo..." : `Contratar plan${precios ? ` — ${fmtCLP(precios.plan.precio)}` : ""}`}
                </button>
              )}
            </>
          )}

          {accionPlan && (
            <div className="card" style={{ marginTop: 16 }}>
              {pasoMetodo === "elegir" && (
                <>
                  <p style={{ marginBottom: 12 }}>¿Cómo quieres pagar tu {accionPlan.label.toLowerCase()}?</p>
                  <button className="btn" onClick={confirmarPago} disabled={pagando !== null}>
                    Pagar como Invitado
                  </button>
                  <button
                    type="button"
                    className="google-btn"
                    style={{ marginTop: 10, width: "100%" }}
                    onClick={conectarGoogle}
                    disabled={pagando !== null}
                  >
                    <GoogleIcon />
                    Inicio de sesión con Google
                  </button>
                  <button type="button" className="btn ghost" style={{ marginTop: 10 }} onClick={cancelarMetodo}>
                    Cancelar
                  </button>
                </>
              )}
              {(pasoMetodo === "google-conectando" || pasoMetodo === "google-preview") && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <GoogleIcon />
                    <span>{pasoMetodo === "google-conectando" ? "Conectando con Google..." : "Vista previa"}</span>
                  </div>
                  {pasoMetodo === "google-preview" && (
                    <>
                      <p style={{ color: "var(--gray)", fontSize: 13, marginBottom: 12 }}>
                        El inicio de sesión con Google todavía no está conectado. Cuando esté disponible, tu patente
                        quedará registrada a la cuenta de Google con la que inicies sesión, para que puedas ver tus
                        pagos y renovaciones desde Mi Cuenta.
                      </p>
                      <button className="btn" onClick={confirmarPago} disabled={pagando !== null}>
                        Continuar como Invitado por ahora
                      </button>
                      <button type="button" className="btn ghost" style={{ marginTop: 10 }} onClick={cancelarMetodo}>
                        Cancelar
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {!soloPagoUnico &&
            (!mostrarAuto ? (
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
            ))}
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

export default function PagarPageWrapper() {
  return (
    <Suspense>
      <PagarPage />
    </Suspense>
  );
}
