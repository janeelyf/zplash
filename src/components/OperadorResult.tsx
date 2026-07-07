"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { registrarIngreso, renovarPlan } from "@/lib/actions";
import {
  PLANES,
  PRECIO_LAVADO_UNICO,
  fmtCLP,
  normPlate,
  planStatus,
  precioNormal,
  precioPreferencial,
  uid,
  vencimientoPorDefectoISO,
} from "@/lib/helpers";
import type { Cliente, Venta } from "@/types";

export default function OperadorResult({ clearPlate }: { clearPlate: () => void }) {
  const { ui } = useApp();
  const r = ui.operResult;
  if (!r) return null;
  if (r.found) return <FoundResult cliente={r.cliente} clearPlate={clearPlate} />;
  return <NotFoundResult plate={r.plate} clearPlate={clearPlate} />;
}

const ERROR_GUARDADO = "No se pudo guardar el cambio (sin conexión con el almacenamiento). Verifica tu conexión e inténtalo de nuevo.";

function FoundResult({ cliente, clearPlate }: { cliente: Cliente; clearPlate: () => void }) {
  const { data, ui, commit, patchUi } = useApp();
  const nombreRef = useRef<HTMLInputElement>(null);
  const vehiculoRef = useRef<HTMLInputElement>(null);
  const vencRef = useRef<HTMLInputElement>(null);
  const [guardarErr, setGuardarErr] = useState("");

  const c = cliente;
  const st = planStatus(c);
  const pNormal = precioNormal(data.precios, c.plan || "");
  const pPromo = precioPreferencial(data.precios, c.plan || "");
  const showOffer = st.cls === "warn" && pNormal > 0;
  const ahorro = pNormal - pPromo;
  const planVigente = st.cls !== "bad";

  const updateResult = (updated: Cliente) => patchUi({ operResult: { found: true, cliente: updated } });

  const registrar = async () => {
    const patch = registrarIngreso(data, c, ui.operadorActual);
    const ok = await commit(patch);
    if (!ok) {
      setGuardarErr(ERROR_GUARDADO);
      return;
    }
    clearPlate();
    patchUi({ operResult: null });
  };

  const registrarPagado = async () => {
    const patch = registrarIngreso(data, c, ui.operadorActual);
    const venta: Venta = {
      id: "v" + Date.now(),
      clienteId: c.id,
      patente: c.patente,
      nombre: c.nombre,
      plan: c.plan || "",
      precio: PRECIO_LAVADO_UNICO,
      tipo: "Lavado único",
      fecha: new Date().toISOString(),
      operador: ui.operadorActual || "",
    };
    const ok = await commit({ ...patch, ventas: [venta, ...data.ventas] });
    if (!ok) {
      setGuardarErr(ERROR_GUARDADO);
      return;
    }
    clearPlate();
    patchUi({ operResult: null });
  };

  const guardarNombre = async () => {
    const val = nombreRef.current?.value.trim();
    if (!val) return;
    const updated = { ...c, nombre: val };
    const ok = await commit({ clientes: data.clientes.map((x) => (x.id === c.id ? updated : x)) });
    if (!ok) {
      setGuardarErr(ERROR_GUARDADO);
      return;
    }
    setGuardarErr("");
    updateResult(updated);
  };

  const guardarVehiculo = async () => {
    const val = vehiculoRef.current?.value.trim();
    if (!val) return;
    const updated = { ...c, vehiculo: val };
    const ok = await commit({ clientes: data.clientes.map((x) => (x.id === c.id ? updated : x)) });
    if (!ok) {
      setGuardarErr(ERROR_GUARDADO);
      return;
    }
    setGuardarErr("");
    updateResult(updated);
  };

  const guardarVenc = async () => {
    const val = vencRef.current?.value;
    if (!val) return;
    const plan = c.plan || PLANES[0];
    const updated = { ...c, vencimiento: new Date(val).toISOString(), plan };
    const venta = {
      id: "v" + Date.now(),
      clienteId: c.id,
      patente: c.patente,
      nombre: c.nombre,
      plan,
      precio: precioNormal(data.precios, plan),
      tipo: "Plan nuevo",
      fecha: new Date().toISOString(),
      operador: ui.operadorActual || "",
    };
    const ok = await commit({
      clientes: data.clientes.map((x) => (x.id === c.id ? updated : x)),
      ventas: [venta, ...data.ventas],
    });
    if (!ok) {
      setGuardarErr(ERROR_GUARDADO);
      return;
    }
    setGuardarErr("");
    updateResult(updated);
  };

  const renovar = async () => {
    const patch = renovarPlan(data, c, ui.operadorActual);
    const ok = await commit(patch);
    if (!ok) {
      setGuardarErr(ERROR_GUARDADO);
      return;
    }
    setGuardarErr("");
    const updated = patch.clientes?.find((x) => x.id === c.id);
    if (updated) updateResult(updated);
  };

  const contratarPlan = async () => {
    const plan = c.plan || PLANES[0];
    const updated = { ...c, vencimiento: vencimientoPorDefectoISO(), plan };
    const venta: Venta = {
      id: "v" + Date.now(),
      clienteId: c.id,
      patente: c.patente,
      nombre: c.nombre,
      plan,
      precio: precioNormal(data.precios, plan),
      tipo: "Plan nuevo",
      fecha: new Date().toISOString(),
      operador: ui.operadorActual || "",
    };
    const ok = await commit({
      clientes: data.clientes.map((x) => (x.id === c.id ? updated : x)),
      ventas: [venta, ...data.ventas],
    });
    if (!ok) {
      setGuardarErr(ERROR_GUARDADO);
      return;
    }
    setGuardarErr("");
    updateResult(updated);
  };

  const defaultVenc = vencimientoPorDefectoISO().substring(0, 10);

  return (
    <>
      {showOffer && (
        <div className="offer-card">
          <div className="offer-head">
            <span className="badge">Oferta</span>
            <h4>
              Plan por vencer en{" "}
              {st.diasRestantes! <= 0 ? "hoy" : st.diasRestantes + " día" + (st.diasRestantes === 1 ? "" : "s")}
            </h4>
          </div>
          <div className="msg">
            Ofrécele a {c.nombre} renovar su {c.plan} ahora mismo a precio preferencial.
          </div>
          <div className="price-row">
            <span className="old">{fmtCLP(pNormal)}</span>
            <span className="new">{fmtCLP(pPromo)}</span>
            <span className="save">Ahorra {fmtCLP(ahorro)}</span>
          </div>
          <button
            className="btn secondary"
            onClick={() =>
              patchUi({
                modal: {
                  type: "confirm",
                  mensaje: `¿Confirmas renovar el plan de ${c.nombre} a precio preferencial (${fmtCLP(pPromo)})?`,
                  confirmLabel: "Sí, renovar",
                  danger: false,
                  onConfirm: renovar,
                },
              })
            }
          >
            Renovar plan a precio preferencial
          </button>
        </div>
      )}
      {guardarErr && <div className="err" style={{ marginBottom: 10 }}>{guardarErr}</div>}
      <div className="result-card found">
        <div className="result-head">
          {c.nombre ? (
            <h3>{c.nombre}</h3>
          ) : (
            <div style={{ display: "flex", gap: 6, alignItems: "center", flex: 1, marginRight: 10 }}>
              <input
                ref={nombreRef}
                placeholder="Nombre del cliente"
                style={{
                  flex: 1,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--white)",
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontSize: 15,
                }}
              />
              <button className="icon-btn" style={{ whiteSpace: "nowrap" }} onClick={guardarNombre}>
                Guardar
              </button>
            </div>
          )}
          <span className={`status-pill ${st.cls}`}>{st.label}</span>
        </div>
        <div className="info-grid">
          <div>
            <div className="k">Patente</div>
            <div className="v">{c.patente}</div>
          </div>
          <div>
            <div className="k">Vehículo (Marca y Modelo)</div>
            {c.vehiculo ? (
              <div className="v">{c.vehiculo}</div>
            ) : (
              <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                <input
                  ref={vehiculoRef}
                  placeholder="Ej: Toyota Yaris"
                  style={{
                    flex: 1,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--white)",
                    padding: "6px 8px",
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                />
                <button className="icon-btn" style={{ whiteSpace: "nowrap" }} onClick={guardarVehiculo}>
                  Guardar
                </button>
              </div>
            )}
          </div>
          <div>
            <div className="k">Plan</div>
            <div className="v">{c.plan || "-"}</div>
          </div>
          <div>
            <div className="k">Vence</div>
            {c.vencimiento ? (
              <div className="v">{new Date(c.vencimiento).toLocaleDateString("es-CL")}</div>
            ) : (
              <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                <input
                  ref={vencRef}
                  type="date"
                  defaultValue={defaultVenc}
                  style={{
                    flex: 1,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--white)",
                    padding: "6px 8px",
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                />
                <button className="icon-btn" style={{ whiteSpace: "nowrap" }} onClick={guardarVenc}>
                  Activar
                </button>
              </div>
            )}
          </div>
          <div>
            <div className="k">Visitas totales</div>
            <div className="v">{c.visitas || 0}</div>
          </div>
          <div>
            <div className="k">Teléfono</div>
            <div className="v">{c.telefono || "-"}</div>
          </div>
        </div>
        {planVigente ? (
          <button className="btn" style={{ marginTop: 16 }} onClick={registrar}>
            Registrar ingreso
          </button>
        ) : (
          <>
            <div className="hint" style={{ textAlign: "left", color: "var(--gray)", marginTop: 16 }}>
              Este cliente no tiene un plan vigente. Puede ingresar pagando un lavado único, o contratar un plan
              ahora mismo.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              <button className="btn" style={{ marginTop: 0 }} onClick={registrarPagado}>
                Registrar lavado único pagado ({fmtCLP(PRECIO_LAVADO_UNICO)})
              </button>
              <button className="btn secondary" style={{ marginTop: 0 }} onClick={contratarPlan}>
                Contratar plan
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function NotFoundResult({ plate, clearPlate }: { plate: string; clearPlate: () => void }) {
  const { data, ui, commit, patchUi } = useApp();
  const [tipoDoc, setTipoDoc] = useState("Boleta");
  const qNombreRef = useRef<HTMLInputElement>(null);
  const qTelefonoRef = useRef<HTMLInputElement>(null);
  const qEmailRef = useRef<HTMLInputElement>(null);
  const qVehiculoRef = useRef<HTMLInputElement>(null);
  const qTipoClienteRef = useRef<HTMLSelectElement>(null);
  const qRazonSocialRef = useRef<HTMLInputElement>(null);
  const qRutRef = useRef<HTMLInputElement>(null);
  const qDireccionRef = useRef<HTMLInputElement>(null);
  const qGiroRef = useRef<HTMLInputElement>(null);

  const quickAdd = async () => {
    const nombre = qNombreRef.current?.value.trim() || "Cliente sin nombre";
    const telefono = qTelefonoRef.current?.value.trim() || "";
    const email = qEmailRef.current?.value.trim() || "";
    const vehiculo = qVehiculoRef.current?.value.trim() || "";
    const tipoCliente = qTipoClienteRef.current?.value || "plan";
    const plan = PLANES[0];
    const tipoDocumento = tipoDoc;
    const razonSocial = tipoDocumento === "Factura" ? qRazonSocialRef.current?.value.trim() || "" : "";
    const rut = tipoDocumento === "Factura" ? qRutRef.current?.value.trim() || "" : "";
    const direccion = tipoDocumento === "Factura" ? qDireccionRef.current?.value.trim() || "" : "";
    const giro = tipoDocumento === "Factura" ? qGiroRef.current?.value.trim() || "" : "";
    let vencimiento: string | null = null;
    if (tipoCliente === "plan") {
      const venc = new Date();
      venc.setDate(venc.getDate() + 30);
      vencimiento = venc.toISOString();
    }
    const nuevo: Cliente = {
      id: uid(),
      nombre,
      telefono,
      email,
      vehiculo,
      patente: normPlate(plate),
      plan: tipoCliente === "plan" ? plan : "",
      tipoDocumento,
      razonSocial,
      rut,
      direccion,
      giro,
      vencimiento,
      visitas: 0,
      creadoEn: new Date().toISOString(),
    };
    let ventas = data.ventas;
    if (tipoCliente === "plan") {
      ventas = [
        {
          id: "v" + Date.now(),
          clienteId: nuevo.id,
          patente: nuevo.patente,
          nombre: nuevo.nombre,
          plan: nuevo.plan || "",
          precio: precioNormal(data.precios, plan),
          tipo: "Plan nuevo",
          fecha: new Date().toISOString(),
          operador: ui.operadorActual || "",
        },
        ...ventas,
      ];
    }
    const tempData = { ...data, clientes: [...data.clientes, nuevo], ventas };
    const ingresoPatch = registrarIngreso(tempData, nuevo, ui.operadorActual);
    await commit({ clientes: ingresoPatch.clientes, ventas, ingresos: ingresoPatch.ingresos });
    clearPlate();
    patchUi({ operResult: null });
  };

  return (
    <div className="result-card notfound">
      <div className="result-head">
        <h3>Patente no registrada</h3>
        <span className="status-pill bad">{plate.toUpperCase()}</span>
      </div>
      <div className="hint" style={{ textAlign: "left", color: "var(--gray)", fontSize: 13 }}>
        Registra un cliente rápido para dejarlo ingresado ahora mismo.
      </div>
      <div className="quick-form">
        <div>
          <label>Nombre</label>
          <input ref={qNombreRef} placeholder="Nombre del cliente" />
        </div>
        <div>
          <label>Teléfono</label>
          <input ref={qTelefonoRef} placeholder="+56 9 ..." />
        </div>
        <div>
          <label>Correo electrónico</label>
          <input ref={qEmailRef} type="email" placeholder="correo@ejemplo.com" />
        </div>
        <div>
          <label>Vehículo (Marca y Modelo)</label>
          <input ref={qVehiculoRef} placeholder="Ej: Toyota Yaris" />
        </div>
        <div>
          <label>Tipo de cliente</label>
          <select ref={qTipoClienteRef} defaultValue="plan">
            <option value="plan">Con Plan Ilimitado Mensual</option>
            <option value="unico">Lavado único (sin plan)</option>
          </select>
        </div>
        <div>
          <label>Tipo de documento</label>
          <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
            <option value="Boleta">Boleta</option>
            <option value="Factura">Factura</option>
          </select>
        </div>
        {tipoDoc === "Factura" && (
          <div>
            <div style={{ marginBottom: 10 }}>
              <label>Razón Social</label>
              <input ref={qRazonSocialRef} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>RUT</label>
              <input ref={qRutRef} placeholder="12.345.678-9" />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>Dirección</label>
              <input ref={qDireccionRef} />
            </div>
            <div>
              <label>Giro</label>
              <input ref={qGiroRef} />
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button className="btn" onClick={quickAdd}>
          Registrar y dar ingreso
        </button>
        <button className="btn ghost" onClick={() => patchUi({ operResult: null })}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
