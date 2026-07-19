"use client";

import { useState } from "react";
import PriceInput from "@/components/PriceInput";
import { useApp } from "@/context/AppContext";
import { PACKS_EMPRESA, PLANES, PLAN_ONECLICK_KEY, precioNormal, precioPackEmpresa, precioPlanOneclick } from "@/lib/helpers";

export default function WebSettingsTab() {
  const { data, commit } = useApp();
  const [pagoUnicoVal, setPagoUnicoVal] = useState(() => String(precioNormal(data.precios, PLANES[0])));
  const [renovacionAutoVal, setRenovacionAutoVal] = useState(() => String(precioPlanOneclick(data.precios)));
  const [msg, setMsg] = useState<{ texto: string; ok: boolean } | null>(null);

  const [packsVal, setPacksVal] = useState<Record<number, string>>(() =>
    Object.fromEntries(PACKS_EMPRESA.map((p) => [p.cantidad, String(precioPackEmpresa(data.precios, p.cantidad))]))
  );
  const [vigenciaVal, setVigenciaVal] = useState(() => String(data.config.vigenciaDiasPackEmpresa));
  const [msgEmpresa, setMsgEmpresa] = useState<{ texto: string; ok: boolean } | null>(null);

  const guardar = async () => {
    const precios = { ...data.precios };
    precios[PLANES[0]] = { ...precios[PLANES[0]], normal: Number(pagoUnicoVal) || 0 };
    precios[PLAN_ONECLICK_KEY] = { normal: Number(renovacionAutoVal) || 0, promo: 0 };
    const ok = await commit({ precios });
    setMsg({ texto: ok ? "Precios actualizados correctamente" : "No se pudo guardar (sin conexión). Intenta de nuevo.", ok });
  };

  const guardarEmpresa = async () => {
    const precios = { ...data.precios };
    for (const pack of PACKS_EMPRESA) {
      precios[pack.key] = { normal: Number(packsVal[pack.cantidad]) || 0, promo: 0 };
    }
    const vigenciaDiasPackEmpresa = Math.max(1, Number(vigenciaVal) || 0);
    const ok = await commit({ precios, config: { ...data.config, vigenciaDiasPackEmpresa } });
    setMsgEmpresa({
      texto: ok ? "Packs Empresa actualizados correctamente" : "No se pudo guardar (sin conexión). Intenta de nuevo.",
      ok,
    });
  };

  return (
    <div>
      <div className="modal" style={{ maxWidth: 420, margin: "0 0 20px 0" }}>
        <h3>Precios de contratación web ({PLANES[0]})</h3>
        <div className="hint" style={{ textAlign: "left", color: "var(--gray)", fontSize: 13, marginBottom: 14 }}>
          Precios que ve el cliente al contratar o renovar su plan desde la web (/pagar), por cualquier conducto.
        </div>

        <div className="field">
          <label>Pago único — cualquier tarjeta, sin renovación automática</label>
          <PriceInput value={pagoUnicoVal} onChange={setPagoUnicoVal} />
        </div>
        <div className="hint" style={{ textAlign: "left", color: "var(--gray)", fontSize: 12.5, marginBottom: 14 }}>
          Es el mismo precio normal que usa el mostrador para contratos presenciales — cambiarlo acá lo cambia en
          ambos lugares.
        </div>

        <div className="field">
          <label>Renovación automática — solo tarjetas de crédito (Oneclick)</label>
          <PriceInput value={renovacionAutoVal} onChange={setRenovacionAutoVal} />
        </div>

        <div className="err" style={{ color: msg?.ok ? "var(--green)" : undefined }}>{msg?.texto || ""}</div>
        <button className="btn" onClick={guardar}>
          Guardar precios
        </button>
      </div>

      <div className="modal" style={{ maxWidth: 420, margin: 0 }}>
        <h3>Packs Empresa (venta online)</h3>
        <div className="hint" style={{ textAlign: "left", color: "var(--gray)", fontSize: 13, marginBottom: 14 }}>
          Precios (IVA incluido) de los 4 packs de tickets que se venden en la pestaña &quot;Venta a Empresa&quot; del portal
          cliente, y cuántos días de vigencia tienen los tickets desde que se compran — a propósito no está
          amarrado a los 90 días de otros productos.
        </div>

        {PACKS_EMPRESA.map((pack) => (
          <div className="field" key={pack.cantidad}>
            <label>{pack.cantidad} Tickets</label>
            <PriceInput
              value={packsVal[pack.cantidad]}
              onChange={(v) => setPacksVal((prev) => ({ ...prev, [pack.cantidad]: v }))}
            />
          </div>
        ))}

        <div className="field">
          <label>Días de vigencia de los tickets</label>
          <input type="number" min={1} value={vigenciaVal} onChange={(e) => setVigenciaVal(e.target.value)} />
        </div>

        <div className="err" style={{ color: msgEmpresa?.ok ? "var(--green)" : undefined }}>{msgEmpresa?.texto || ""}</div>
        <button className="btn" onClick={guardarEmpresa}>
          Guardar Packs Empresa
        </button>
      </div>
    </div>
  );
}
