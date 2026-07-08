"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import Topbar from "@/components/Topbar";
import { SERVICIOS_ADICIONALES, findClient, fmtCLP, normPlate, todayStr } from "@/lib/helpers";
import type { Cliente, PagoInfo, Venta } from "@/types";

const ERROR_GUARDADO = "No se pudo guardar el servicio (sin conexión con el almacenamiento). Verifica tu conexión e inténtalo de nuevo.";
const NOMBRES_SERVICIOS = new Set(SERVICIOS_ADICIONALES.map((s) => s.nombre));
const CATEGORIA_DETAILING = "Lavado Completo Detailing";
const AJUSTES = [5000, 10000] as const;

export default function ServiciosAdicionalesView() {
  const { data, ui, commit, patchUi } = useApp();
  const patenteRef = useRef<HTMLInputElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const vehiculoRef = useRef<HTMLInputElement>(null);
  const razonSocialRef = useRef<HTMLInputElement>(null);
  const rutRef = useRef<HTMLInputElement>(null);
  const direccionRef = useRef<HTMLInputElement>(null);
  const giroRef = useRef<HTMLInputElement>(null);
  const horaEntregaRef = useRef<HTMLInputElement>(null);
  const notasRef = useRef<HTMLTextAreaElement>(null);

  const [patenteBuscada, setPatenteBuscada] = useState<string | null>(null);
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [ajuste, setAjuste] = useState<0 | 5000 | 10000>(0);
  const [tipoDoc, setTipoDoc] = useState<"Boleta" | "Factura">("Boleta");
  const [err, setErr] = useState("");

  const clienteExistente = patenteBuscada ? findClient(data.clientes, patenteBuscada) || null : null;

  const categorias = Array.from(new Set(SERVICIOS_ADICIONALES.map((s) => s.categoria)));
  const servicio = SERVICIOS_ADICIONALES.find((s) => s.id === servicioId) || null;
  const aplicaAjuste = servicio?.categoria === CATEGORIA_DETAILING;
  const precioFinal = servicio ? servicio.precio + (aplicaAjuste ? ajuste : 0) : 0;

  const buscarPatente = () => {
    const patente = normPlate(patenteRef.current?.value || "");
    if (!patente) {
      setErr("Ingresa una patente");
      return;
    }
    setErr("");
    const cliente = findClient(data.clientes, patente);
    setPatenteBuscada(patente);
    setTipoDoc(cliente?.tipoDocumento === "Factura" ? "Factura" : "Boleta");
    setServicioId(null);
    setAjuste(0);
  };

  const cambiarPatente = () => {
    setPatenteBuscada(null);
    setServicioId(null);
    setAjuste(0);
    setErr("");
  };

  const registrar = () => {
    if (!patenteBuscada) return;
    if (!servicio) {
      setErr("Selecciona un servicio");
      return;
    }
    const nombre = (nombreRef.current?.value.trim() || "").toUpperCase();
    if (!nombre) {
      setErr("El nombre es obligatorio");
      return;
    }
    const telefono = telefonoRef.current?.value.trim() || "";
    const email = emailRef.current?.value.trim() || "";
    const vehiculo = vehiculoRef.current?.value.trim() || "";
    const razonSocial = tipoDoc === "Factura" ? razonSocialRef.current?.value.trim() || "" : "";
    const rut = tipoDoc === "Factura" ? rutRef.current?.value.trim() || "" : "";
    const direccion = tipoDoc === "Factura" ? direccionRef.current?.value.trim() || "" : "";
    const giro = tipoDoc === "Factura" ? giroRef.current?.value.trim() || "" : "";
    const horaEntrega = horaEntregaRef.current?.value || "";
    const notas = notasRef.current?.value.trim() || "";

    setErr("");
    const patente = patenteBuscada;
    const existente = clienteExistente;
    const montoFinal = precioFinal;

    patchUi({
      modal: {
        type: "pago",
        monto: montoFinal,
        descripcion: `${servicio.nombre} para ${nombre} (${patente})`,
        onConfirm: async (pago: PagoInfo) => {
          let clientes = data.clientes;
          let clienteId: string;

          if (existente) {
            const actualizado: Cliente = {
              ...existente,
              nombre,
              telefono: telefono || existente.telefono,
              email: email || existente.email,
              vehiculo: vehiculo || existente.vehiculo,
              tipoDocumento: tipoDoc,
              razonSocial: tipoDoc === "Factura" ? razonSocial : existente.razonSocial,
              rut: tipoDoc === "Factura" ? rut : existente.rut,
              direccion: tipoDoc === "Factura" ? direccion : existente.direccion,
              giro: tipoDoc === "Factura" ? giro : existente.giro,
            };
            clientes = data.clientes.map((c) => (c.id === existente.id ? actualizado : c));
            clienteId = existente.id;
          } else {
            const nuevo: Cliente = {
              id: "c" + Date.now() + Math.floor(Math.random() * 1000),
              nombre,
              patente,
              telefono,
              email,
              vehiculo,
              tipoDocumento: tipoDoc,
              razonSocial,
              rut,
              direccion,
              giro,
              vencimiento: null,
              fechaContratacion: null,
              origen: "LOCAL",
              visitas: 0,
              creadoEn: new Date().toISOString(),
            };
            clientes = [...data.clientes, nuevo];
            clienteId = nuevo.id;
          }

          const venta: Venta = {
            id: "v" + Date.now(),
            clienteId,
            patente,
            nombre,
            plan: "",
            precio: montoFinal,
            tipo: servicio.nombre,
            fecha: new Date().toISOString(),
            operador: ui.operadorActual || "",
            metodoPago: pago.metodo,
            voucher: pago.voucher,
            horaEntrega: horaEntrega || undefined,
            notas: notas || undefined,
          };

          const ok = await commit({ clientes, ventas: [venta, ...data.ventas] });
          if (!ok) {
            setErr(ERROR_GUARDADO);
            return;
          }
          if (patenteRef.current) patenteRef.current.value = "";
          setPatenteBuscada(null);
          setServicioId(null);
          setAjuste(0);
          setTipoDoc("Boleta");
        },
      },
    });
  };

  const hoy = todayStr();
  const hoyList = data.ventas.filter((v) => NOMBRES_SERVICIOS.has(v.tipo) && new Date(v.fecha).toDateString() === hoy);

  return (
    <>
      <Topbar
        mode={`Servicios Adicionales · ${ui.operadorActual || ""}`}
        onLogout={() => patchUi({ view: "login", operadorActual: null, loginMode: null })}
      />
      <div className="content">
        <div className="scan-panel" style={{ textAlign: "left" }}>
          <h2 style={{ textAlign: "center" }}>Registrar servicio adicional</h2>

          {patenteBuscada === null ? (
            <>
              <div className="field">
                <label>Patente</label>
                <input
                  ref={patenteRef}
                  style={{ textTransform: "uppercase" }}
                  placeholder="AB1234"
                  maxLength={8}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") buscarPatente();
                  }}
                />
              </div>
              <div className="err">{err}</div>
              <button className="btn" onClick={buscarPatente}>
                Buscar
              </button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <span className="plate-tag" style={{ fontSize: 18 }}>
                  {patenteBuscada}
                </span>
                {clienteExistente ? (
                  <span className="status-pill ok">Cliente existente</span>
                ) : (
                  <span className="status-pill warn">Cliente nuevo</span>
                )}
                <button className="btn ghost" style={{ marginTop: 0, marginLeft: "auto" }} onClick={cambiarPatente}>
                  Cambiar patente
                </button>
              </div>

              {categorias.map((cat) => (
                <div key={cat} style={{ marginBottom: 18 }}>
                  <div
                    className="hint"
                    style={{ textAlign: "left", marginBottom: 8, textTransform: "uppercase", fontWeight: 700 }}
                  >
                    {cat}
                  </div>
                  <div className="service-grid">
                    {SERVICIOS_ADICIONALES.filter((s) => s.categoria === cat).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`service-btn${servicioId === s.id ? " selected" : ""}`}
                        onClick={() => {
                          setServicioId(s.id);
                          setErr("");
                          if (s.categoria !== CATEGORIA_DETAILING) setAjuste(0);
                        }}
                      >
                        <div className="nombre">{s.nombre}</div>
                        <div className="precio">{fmtCLP(s.precio)}</div>
                      </button>
                    ))}
                  </div>
                  {cat === CATEGORIA_DETAILING && (
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      {AJUSTES.map((a) => (
                        <button
                          key={a}
                          type="button"
                          className={ajuste === a ? "btn" : "btn ghost"}
                          style={{ marginTop: 0 }}
                          onClick={() => setAjuste(ajuste === a ? 0 : a)}
                        >
                          + {fmtCLP(a)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {servicio && (
                <div
                  style={{
                    padding: "10px 12px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    marginBottom: 18,
                    fontSize: 14,
                  }}
                >
                  {servicio.nombre}
                  {aplicaAjuste && ajuste > 0 ? ` (${fmtCLP(servicio.precio)} + ${fmtCLP(ajuste)})` : ""} —{" "}
                  <strong style={{ color: "var(--gold)" }}>{fmtCLP(precioFinal)}</strong>
                </div>
              )}

              <div key={patenteBuscada}>
                <div className="field">
                  <label>Nombre</label>
                  <input ref={nombreRef} defaultValue={clienteExistente?.nombre || ""} placeholder="Nombre completo" />
                </div>
                <div className="field">
                  <label>Teléfono</label>
                  <input ref={telefonoRef} defaultValue={clienteExistente?.telefono || "+569"} />
                </div>
                <div className="field">
                  <label>Correo electrónico</label>
                  <input
                    ref={emailRef}
                    type="email"
                    defaultValue={clienteExistente?.email || ""}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="field">
                  <label>Vehículo (Marca y Modelo)</label>
                  <input ref={vehiculoRef} defaultValue={clienteExistente?.vehiculo || ""} placeholder="Ej: Toyota Yaris" />
                </div>
                <div className="field">
                  <label>Tipo de documento</label>
                  <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value as "Boleta" | "Factura")}>
                    <option value="Boleta">Boleta</option>
                    <option value="Factura">Factura</option>
                  </select>
                </div>
                {tipoDoc === "Factura" && (
                  <div>
                    <div className="field">
                      <label>Razón Social</label>
                      <input ref={razonSocialRef} defaultValue={clienteExistente?.razonSocial || ""} />
                    </div>
                    <div className="field">
                      <label>RUT</label>
                      <input ref={rutRef} defaultValue={clienteExistente?.rut || ""} placeholder="12.345.678-9" />
                    </div>
                    <div className="field">
                      <label>Dirección</label>
                      <input ref={direccionRef} defaultValue={clienteExistente?.direccion || ""} />
                    </div>
                    <div className="field">
                      <label>Giro</label>
                      <input ref={giroRef} defaultValue={clienteExistente?.giro || ""} />
                    </div>
                  </div>
                )}
                <div className="field">
                  <label>Hora de entrega</label>
                  <input ref={horaEntregaRef} type="time" />
                </div>
                <div className="field">
                  <label>Notas / Observaciones</label>
                  <textarea ref={notasRef} rows={3} placeholder="Observaciones de quien recibe el vehículo..." />
                </div>
              </div>

              <div className="err">{err}</div>
              <button className="btn" onClick={registrar}>
                Registrar servicio
              </button>
            </>
          )}
        </div>

        <div className="today-log">
          <h3>Servicios registrados hoy</h3>
          {hoyList.length === 0 ? (
            <div className="empty">Aún no hay servicios registrados hoy</div>
          ) : (
            hoyList.map((v) => (
              <div className="log-row" key={v.id} title={v.notas || undefined}>
                <span className="plate">{v.patente}</span>
                <span>
                  {v.nombre} — {v.tipo}
                </span>
                {v.horaEntrega && <span>Entrega {v.horaEntrega}</span>}
                <span>{fmtCLP(v.precio)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
