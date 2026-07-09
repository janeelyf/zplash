"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  LAVADO_UNICO_KEY,
  PLANES,
  SERVICIOS_ADICIONALES,
  precioLavadoUnico,
  precioNormal,
  precioPreferencial,
  precioServicioAdicional,
} from "@/lib/helpers";

export default function ConfigTab() {
  const { data, ui, commit } = useApp();
  const curPinRef = useRef<HTMLInputElement>(null);
  const newPinRef = useRef<HTMLInputElement>(null);
  const nuevaClaveEvelynRef = useRef<HTMLInputElement>(null);
  const [cfgErr, setCfgErr] = useState<{ msg: string; ok: boolean } | null>(null);
  const [claveEvelynMsg, setClaveEvelynMsg] = useState<{ msg: string; ok: boolean } | null>(null);
  const [precioErr, setPrecioErr] = useState<{ msg: string; ok: boolean } | null>(null);
  const normalRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const promoRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const lavadoUnicoRef = useRef<HTMLInputElement>(null);
  const servicioRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const categoriasServicios = Array.from(new Set(SERVICIOS_ADICIONALES.map((s) => s.categoria)));

  const yo = data.administradores.find((a) => a.nombre === ui.adminActual);
  const esGerente = !!yo?.esGerente;

  const savePin = async () => {
    const cur = curPinRef.current?.value || "";
    const nw = newPinRef.current?.value || "";
    if (!yo || cur !== yo.clave) {
      setCfgErr({ msg: "Contraseña actual incorrecta", ok: false });
      return;
    }
    if (!nw || nw.length < 4) {
      setCfgErr({ msg: "La nueva contraseña debe tener al menos 4 caracteres", ok: false });
      return;
    }
    const actualizado = { ...yo, clave: nw };
    await commit({ administradores: data.administradores.map((a) => (a.id === yo.id ? actualizado : a)) });
    setCfgErr({ msg: "Contraseña actualizada correctamente", ok: true });
    if (curPinRef.current) curPinRef.current.value = "";
    if (newPinRef.current) newPinRef.current.value = "";
  };

  const saveClaveEvelyn = async () => {
    const evelyn = data.administradores.find((a) => a.nombre === "Evelyn");
    const nw = nuevaClaveEvelynRef.current?.value || "";
    if (!evelyn) return;
    if (!nw || nw.length < 4) {
      setClaveEvelynMsg({ msg: "La nueva contraseña debe tener al menos 4 caracteres", ok: false });
      return;
    }
    const actualizado = { ...evelyn, clave: nw };
    await commit({ administradores: data.administradores.map((a) => (a.id === evelyn.id ? actualizado : a)) });
    setClaveEvelynMsg({ msg: "Contraseña de Evelyn actualizada correctamente", ok: true });
    if (nuevaClaveEvelynRef.current) nuevaClaveEvelynRef.current.value = "";
  };

  const savePrecios = async () => {
    const precios = { ...data.precios };
    PLANES.forEach((p) => {
      const nInp = normalRefs.current[p];
      const pInp = promoRefs.current[p];
      precios[p] = { normal: Number(nInp?.value) || 0, promo: Number(pInp?.value) || 0 };
    });
    precios[LAVADO_UNICO_KEY] = { normal: Number(lavadoUnicoRef.current?.value) || 0, promo: 0 };
    SERVICIOS_ADICIONALES.forEach((s) => {
      const inp = servicioRefs.current[s.id];
      precios[s.id] = { normal: Number(inp?.value) || 0, promo: 0 };
    });
    await commit({ precios });
    setPrecioErr({ msg: "Precios actualizados correctamente", ok: true });
  };

  return (
    <div>
      <div className="modal" style={{ maxWidth: 420, margin: "0 0 20px 0" }}>
        <h3>Cambiar mi contraseña ({ui.adminActual})</h3>
        <div className="field">
          <label>Contraseña actual</label>
          <input ref={curPinRef} type="password" />
        </div>
        <div className="field">
          <label>Contraseña nueva</label>
          <input ref={newPinRef} type="password" maxLength={12} />
        </div>
        <div className="err" style={{ color: cfgErr?.ok ? "var(--green)" : undefined }}>
          {cfgErr?.msg || ""}
        </div>
        <button className="btn" onClick={savePin}>
          Guardar
        </button>
      </div>
      {esGerente && (
        <div className="modal" style={{ maxWidth: 420, margin: "0 0 20px 0" }}>
          <h3>Cambiar contraseña de Evelyn</h3>
          <div className="hint" style={{ textAlign: "left", color: "var(--gray)", fontSize: 13, marginBottom: 14 }}>
            Como gerente, puedes definir una nueva contraseña para Evelyn sin necesidad de conocer la actual.
          </div>
          <div className="field">
            <label>Contraseña nueva</label>
            <input ref={nuevaClaveEvelynRef} type="password" maxLength={12} />
          </div>
          <div className="err" style={{ color: claveEvelynMsg?.ok ? "var(--green)" : undefined }}>
            {claveEvelynMsg?.msg || ""}
          </div>
          <button className="btn" onClick={saveClaveEvelyn}>
            Guardar
          </button>
        </div>
      )}
      <div className="modal" style={{ maxWidth: 420, margin: 0 }}>
        <h3>Precios y renovación preferencial</h3>
        <div className="hint" style={{ textAlign: "left", color: "var(--gray)", fontSize: 13, marginBottom: 14 }}>
          Estos valores se usan para mostrar la oferta de renovación al operador cuando un plan está por vencer.
        </div>
        {PLANES.map((p) => (
          <div key={p}>
            <div className="field">
              <label>Precio normal — {p}</label>
              <input
                type="number"
                min={0}
                defaultValue={precioNormal(data.precios, p)}
                ref={(el) => {
                  normalRefs.current[p] = el;
                }}
              />
            </div>
            <div className="field">
              <label>Precio promoción de renovación — {p}</label>
              <input
                type="number"
                min={0}
                defaultValue={precioPreferencial(data.precios, p)}
                ref={(el) => {
                  promoRefs.current[p] = el;
                }}
              />
            </div>
          </div>
        ))}

        <h3 style={{ marginTop: 22 }}>Lavado túnel (sin plan)</h3>
        <div className="field">
          <label>Precio lavado único</label>
          <input type="number" min={0} defaultValue={precioLavadoUnico(data.precios)} ref={lavadoUnicoRef} />
        </div>

        <h3 style={{ marginTop: 22 }}>Servicios adicionales</h3>
        {categoriasServicios.map((cat) => (
          <div key={cat}>
            <div
              className="hint"
              style={{ textAlign: "left", marginBottom: 8, textTransform: "uppercase", fontWeight: 700 }}
            >
              {cat}
            </div>
            {SERVICIOS_ADICIONALES.filter((s) => s.categoria === cat).map((s) => (
              <div className="field" key={s.id}>
                <label>{s.nombre}</label>
                <input
                  type="number"
                  min={0}
                  defaultValue={precioServicioAdicional(data.precios, s)}
                  ref={(el) => {
                    servicioRefs.current[s.id] = el;
                  }}
                />
              </div>
            ))}
          </div>
        ))}

        <div className="err" style={{ color: precioErr?.ok ? "var(--green)" : undefined }}>
          {precioErr?.msg || ""}
        </div>
        <button className="btn" onClick={savePrecios}>
          Guardar precios
        </button>
      </div>
    </div>
  );
}
