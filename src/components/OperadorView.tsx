"use client";

import { useRef } from "react";
import { useApp } from "@/context/AppContext";
import { findClient } from "@/lib/helpers";
import Topbar from "@/components/Topbar";
import OperadorResult from "@/components/OperadorResult";
import TodayLog from "@/components/TodayLog";

export default function OperadorView() {
  const { data, ui, patchUi } = useApp();
  const plateInputRef = useRef<HTMLInputElement>(null);

  const clearPlate = () => {
    if (plateInputRef.current) plateInputRef.current.value = "";
  };

  const doValidate = () => {
    const plate = plateInputRef.current?.value.trim();
    if (!plate) return;
    const c = findClient(data.clientes, plate);
    patchUi({ operResult: c ? { found: true, cliente: c } : { found: false, plate } });
  };

  return (
    <>
      <Topbar
        mode={`Operador · ${ui.operadorActual || ""}`}
        onLogout={() => patchUi({ view: "login", operResult: null, operadorActual: null, loginMode: null })}
      />
      <div className="content">
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
        <div className="today-log">
          <h3>Ingresos de hoy</h3>
          <TodayLog />
        </div>
      </div>
    </>
  );
}
