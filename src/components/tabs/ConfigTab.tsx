"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { PLANES, precioNormal, precioPreferencial } from "@/lib/helpers";

export default function ConfigTab() {
  const { data, commit } = useApp();
  const curPinRef = useRef<HTMLInputElement>(null);
  const newPinRef = useRef<HTMLInputElement>(null);
  const [cfgErr, setCfgErr] = useState<{ msg: string; ok: boolean } | null>(null);
  const [precioErr, setPrecioErr] = useState<{ msg: string; ok: boolean } | null>(null);
  const normalRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const promoRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const savePin = async () => {
    const cur = curPinRef.current?.value || "";
    const nw = newPinRef.current?.value || "";
    if (cur !== data.pinAdmin) {
      setCfgErr({ msg: "PIN actual incorrecto", ok: false });
      return;
    }
    if (!nw || nw.length < 4) {
      setCfgErr({ msg: "El nuevo PIN debe tener al menos 4 dígitos", ok: false });
      return;
    }
    await commit({ pinAdmin: nw });
    setCfgErr({ msg: "PIN actualizado correctamente", ok: true });
  };

  const savePrecios = async () => {
    const precios = { ...data.precios };
    PLANES.forEach((p) => {
      const nInp = normalRefs.current[p];
      const pInp = promoRefs.current[p];
      precios[p] = { normal: Number(nInp?.value) || 0, promo: Number(pInp?.value) || 0 };
    });
    await commit({ precios });
    setPrecioErr({ msg: "Precios actualizados correctamente", ok: true });
  };

  return (
    <div>
      <div className="modal" style={{ maxWidth: 420, margin: "0 0 20px 0" }}>
        <h3>Cambiar PIN de administrador</h3>
        <div className="field">
          <label>PIN actual</label>
          <input ref={curPinRef} type="password" />
        </div>
        <div className="field">
          <label>PIN nuevo</label>
          <input ref={newPinRef} type="password" maxLength={6} />
        </div>
        <div className="err" style={{ color: cfgErr?.ok ? "var(--green)" : undefined }}>
          {cfgErr?.msg || ""}
        </div>
        <button className="btn" onClick={savePin}>
          Guardar
        </button>
      </div>
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
