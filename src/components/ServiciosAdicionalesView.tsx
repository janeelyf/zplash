"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import Topbar from "@/components/Topbar";
import { SERVICIOS_ADICIONALES, findClient, fmtCLP, normPlate, todayStr } from "@/lib/helpers";
import type { PagoInfo, Venta } from "@/types";

const ERROR_GUARDADO = "No se pudo guardar el servicio (sin conexión con el almacenamiento). Verifica tu conexión e inténtalo de nuevo.";
const NOMBRES_SERVICIOS = new Set(SERVICIOS_ADICIONALES.map((s) => s.nombre));

export default function ServiciosAdicionalesView() {
  const { data, ui, commit, patchUi } = useApp();
  const patenteRef = useRef<HTMLInputElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);
  const [servicioId, setServicioId] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const categorias = Array.from(new Set(SERVICIOS_ADICIONALES.map((s) => s.categoria)));

  const registrar = () => {
    const servicio = SERVICIOS_ADICIONALES.find((s) => s.id === servicioId);
    if (!servicio) {
      setErr("Selecciona un servicio");
      return;
    }
    const patente = normPlate(patenteRef.current?.value || "");
    const nombre = (nombreRef.current?.value.trim() || "").toUpperCase();
    if (!patente || !nombre) {
      setErr("Patente y nombre son obligatorios");
      return;
    }
    setErr("");
    const clienteExistente = findClient(data.clientes, patente);

    patchUi({
      modal: {
        type: "pago",
        monto: servicio.precio,
        descripcion: `${servicio.nombre} para ${nombre} (${patente})`,
        onConfirm: async (pago: PagoInfo) => {
          const venta: Venta = {
            id: "v" + Date.now(),
            clienteId: clienteExistente?.id || "",
            patente,
            nombre,
            plan: "",
            precio: servicio.precio,
            tipo: servicio.nombre,
            fecha: new Date().toISOString(),
            operador: ui.operadorActual || "",
            metodoPago: pago.metodo,
            voucher: pago.voucher,
          };
          const ok = await commit({ ventas: [venta, ...data.ventas] });
          if (!ok) {
            setErr(ERROR_GUARDADO);
            return;
          }
          if (patenteRef.current) patenteRef.current.value = "";
          if (nombreRef.current) nombreRef.current.value = "";
          setServicioId(null);
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
                    }}
                  >
                    <div className="nombre">{s.nombre}</div>
                    <div className="precio">{fmtCLP(s.precio)}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="field">
            <label>Patente</label>
            <input ref={patenteRef} style={{ textTransform: "uppercase" }} placeholder="AB1234" maxLength={8} />
          </div>
          <div className="field">
            <label>Nombre del cliente</label>
            <input ref={nombreRef} placeholder="Nombre completo" />
          </div>
          <div className="err">{err}</div>
          <button className="btn" onClick={registrar}>
            Registrar servicio
          </button>
        </div>
        <div className="today-log">
          <h3>Servicios registrados hoy</h3>
          {hoyList.length === 0 ? (
            <div className="empty">Aún no hay servicios registrados hoy</div>
          ) : (
            hoyList.map((v) => (
              <div className="log-row" key={v.id}>
                <span className="plate">{v.patente}</span>
                <span>
                  {v.nombre} — {v.tipo}
                </span>
                <span>{fmtCLP(v.precio)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
