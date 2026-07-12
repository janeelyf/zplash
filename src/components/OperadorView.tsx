"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { PATENTE_FORMATO_MSG, findClient, isValidPatente, normPlate, todayStr } from "@/lib/helpers";
import Topbar from "@/components/Topbar";
import OperadorResult from "@/components/OperadorResult";
import TodayLog from "@/components/TodayLog";
import type { Ingreso } from "@/types";

export default function OperadorView() {
  const { data, ui, commit, patchUi } = useApp();
  const hoy = todayStr();
  const ingresosHoy = data.ingresos.filter((i) => new Date(i.fecha).toDateString() === hoy).length;
  const plateInputRef = useRef<HTMLInputElement>(null);
  const fotoPatenteRef = useRef<HTMLInputElement>(null);
  const codigoCuponRef = useRef<HTMLInputElement>(null);
  const patenteCuponRef = useRef<HTMLInputElement>(null);
  const [cuponErr, setCuponErr] = useState<{ msg: string; ok: boolean } | null>(null);
  const [plateErr, setPlateErr] = useState("");
  const [escaneando, setEscaneando] = useState(false);

  const clearPlate = () => {
    if (plateInputRef.current) plateInputRef.current.value = "";
  };

  const doValidate = () => {
    const plate = plateInputRef.current?.value.trim();
    if (!plate) return;
    if (!isValidPatente(plate)) {
      setPlateErr(PATENTE_FORMATO_MSG);
      return;
    }
    setPlateErr("");
    const c = findClient(data.clientes, plate);
    patchUi({ operResult: c ? { found: true, cliente: c } : { found: false, plate } });
  };

  // Atajo, no reemplazo: si la lectura falla o no encuentra nada, el
  // operador sigue escribiendo la patente a mano con normalidad. El
  // resultado se deja en el input para que lo revise/corrija antes de
  // tocar "Validar" — el reconocimiento nunca es 100% confiable.
  const escanearPatente = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPlateErr("");
    setEscaneando(true);
    try {
      const formData = new FormData();
      formData.append("imagen", file);
      const res = await fetch("/api/reconocer-patente", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.patente) {
        setPlateErr("No se pudo leer la patente en la foto. Escríbela a mano.");
        return;
      }
      if (plateInputRef.current) {
        plateInputRef.current.value = json.patente;
        plateInputRef.current.focus();
      }
    } catch {
      setPlateErr("No se pudo leer la patente (sin conexión). Escríbela a mano.");
    } finally {
      setEscaneando(false);
    }
  };

  const canjearCupon = async () => {
    const codigo = (codigoCuponRef.current?.value.trim() || "").toUpperCase();
    const patente = normPlate(patenteCuponRef.current?.value || "");
    if (!codigo || !patente) {
      setCuponErr({ msg: "Ingresa el código del cupón y la patente", ok: false });
      return;
    }
    if (!isValidPatente(patente)) {
      setCuponErr({ msg: PATENTE_FORMATO_MSG, ok: false });
      return;
    }
    const cupon = data.cupones.find((c) => c.codigo === codigo);
    if (!cupon) {
      setCuponErr({ msg: "Código no encontrado", ok: false });
      return;
    }
    if (cupon.usado) {
      setCuponErr({ msg: "Este cupón ya fue usado", ok: false });
      return;
    }
    if (new Date(cupon.fechaCaducidad) < new Date()) {
      setCuponErr({ msg: "Este cupón está caducado", ok: false });
      return;
    }

    const ahora = new Date().toISOString();
    const cuponActualizado = {
      ...cupon,
      usado: true,
      patenteUso: patente,
      fechaUso: ahora,
      operadorUso: ui.perfilActual?.nombre || "",
    };
    const nombreIngreso = `Cupón · ${cupon.nombreLote} (${cupon.numeroLote}/${cupon.totalLote})`;
    const ingreso: Ingreso = {
      id: "i" + Date.now(),
      clienteId: "",
      patente,
      nombre: nombreIngreso,
      fecha: ahora,
      planEstadoAlIngreso: "ok",
      creadoPor: ui.perfilActual?.nombre || "",
      viaCupon: true,
      cuponCodigo: cupon.codigo,
    };

    // El monto del lote ya se registro completo en el cierre de caja al
    // generar los cupones, asi que canjear uno no vuelve a cobrar nada.
    const ok = await commit({
      cupones: data.cupones.map((x) => (x.id === cupon.id ? cuponActualizado : x)),
      ingresos: [ingreso, ...data.ingresos],
    });
    if (!ok) {
      setCuponErr({ msg: "No se pudo registrar el canje (sin conexión). Intenta de nuevo.", ok: false });
      return;
    }
    setCuponErr({ msg: `Cupón canjeado para ${patente} (${cupon.nombreLote})`, ok: true });
    if (codigoCuponRef.current) codigoCuponRef.current.value = "";
    if (patenteCuponRef.current) patenteCuponRef.current.value = "";
  };

  return (
    <>
      <Topbar
        mode={`Operador · ${ui.perfilActual?.nombre || ""}`}
        onLogout={() => patchUi({ view: "login", operResult: null, perfilActual: null, perfilSeleccionadoId: null, loginMode: null })}
        onBack={() => patchUi({ view: "hub", operResult: null })}
      />
      <div className="content">
        <div className="stat-card" style={{ width: "fit-content", margin: "0 auto 20px", textAlign: "center" }}>
          <div className="num">{ingresosHoy}</div>
          <div className="lbl">Autos ingresados hoy</div>
        </div>
        <div className="scan-panel">
          <h2>Validar patente</h2>
          <div className="hint">Ingresa la patente del vehículo para registrar el ingreso</div>
          <input
            ref={plateInputRef}
            className="plate-input"
            placeholder="AB1234"
            maxLength={8}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") doValidate();
            }}
          />
          <br />
          <input
            ref={fotoPatenteRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={escanearPatente}
          />
          <button
            className="btn ghost"
            style={{ marginTop: 10 }}
            disabled={escaneando}
            onClick={() => fotoPatenteRef.current?.click()}
          >
            {escaneando ? "Leyendo patente..." : "📷 Escanear patente"}
          </button>
          <br />
          {plateErr && <div className="err">{plateErr}</div>}
          <button className="btn" onClick={doValidate}>
            Validar
          </button>
          <br />
          <button
            className="btn ghost"
            style={{ marginTop: 10 }}
            onClick={() => patchUi({ modal: { type: "client", data: null, contexto: "operador" } })}
          >
            + Agregar vehículo nuevo
          </button>
        </div>
        <OperadorResult clearPlate={clearPlate} />
        <div className="scan-panel" style={{ marginTop: 24 }}>
          <h2>Canjear cupón</h2>
          <div className="hint">Ingresa el código del cupón (Venta Empresa) y la patente del vehículo que lo usa</div>
          <div className="field" style={{ maxWidth: 340, margin: "0 auto 10px" }}>
            <input
              ref={codigoCuponRef}
              className="plate-input"
              style={{ fontSize: 20, letterSpacing: "0.1em" }}
              placeholder="CÓDIGO"
              maxLength={8}
            />
          </div>
          <div className="field" style={{ maxWidth: 340, margin: "0 auto 10px" }}>
            <input
              ref={patenteCuponRef}
              className="plate-input"
              placeholder="Patente AB1234"
              maxLength={8}
              onKeyDown={(e) => {
                if (e.key === "Enter") canjearCupon();
              }}
            />
          </div>
          {cuponErr && (
            <div className="err" style={{ color: cuponErr.ok ? "var(--green)" : undefined }}>
              {cuponErr.msg}
            </div>
          )}
          <button className="btn" onClick={canjearCupon}>
            Canjear cupón
          </button>
        </div>
        <div className="today-log">
          <h3>Ingresos de hoy</h3>
          <TodayLog />
        </div>
      </div>
    </>
  );
}
