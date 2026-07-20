"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import PriceInput from "@/components/PriceInput";
import { uid } from "@/lib/helpers";
import type { Insumo } from "@/types";

export default function InsumoModal({ data: ins }: { data: Insumo | null }) {
  const { data, commit, patchUi, ui } = useApp();
  const it = ins || ({} as Partial<Insumo>);

  const nombreRef = useRef<HTMLInputElement>(null);
  const categoriaRef = useRef<HTMLSelectElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);
  const stockMinRef = useRef<HTMLInputElement>(null);
  const stockMaxRef = useRef<HTMLInputElement>(null);
  const proveedorRef = useRef<HTMLSelectElement>(null);
  const [valorCompra, setValorCompra] = useState(it.valorCompra ? String(it.valorCompra) : "");
  const [activo, setActivo] = useState(it.activo ?? true);
  const [err, setErr] = useState("");

  const proveedoresOrdenados = [...data.proveedores].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const categoriasOrdenadas = [...data.categoriasInsumo]
    .filter((c) => c.activa || c.id === it.categoriaId)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const guardar = async () => {
    const nombre = nombreRef.current?.value.trim() || "";
    if (!nombre) {
      setErr("El nombre es obligatorio");
      return;
    }
    const stockMin = Number(stockMinRef.current?.value) || 0;
    const stockMax = Number(stockMaxRef.current?.value) || 0;
    if (stockMax > 0 && stockMax < stockMin) {
      setErr("El Stock Máximo no puede ser menor que el Stock Mínimo");
      return;
    }

    const campos = {
      nombre,
      categoriaId: categoriaRef.current?.value || undefined,
      valorCompra: Number(valorCompra) || 0,
      stock: Number(stockRef.current?.value) || 0,
      stockMin,
      stockMax,
      proveedorId: proveedorRef.current?.value || "",
      activo,
    };

    let insumos: Insumo[];
    if (ins) {
      const actualizado: Insumo = { ...(ins as Insumo), ...campos };
      insumos = data.insumos.map((x) => (x.id === ins.id ? actualizado : x));
    } else {
      const nuevo: Insumo = {
        id: uid(),
        ...campos,
        creadoEn: new Date().toISOString(),
        creadoPor: ui.perfilActual?.nombre || "Administrador",
      };
      insumos = [...data.insumos, nuevo];
    }

    const ok = await commit({ insumos });
    if (!ok) {
      setErr("No se pudo guardar el cambio (sin conexión con el almacenamiento). Verifica tu conexión e inténtalo de nuevo.");
      return;
    }
    patchUi({ modal: null });
  };

  return (
    <div className="modal">
      <h3>{ins ? "Editar insumo" : "Nuevo insumo"}</h3>
      <div className="field">
        <label>Nombre</label>
        <input ref={nombreRef} defaultValue={it.nombre || ""} autoFocus />
      </div>
      <div className="field">
        <label>Categoría</label>
        <select ref={categoriaRef} defaultValue={it.categoriaId || ""}>
          <option value="">Sin categoría asignada</option>
          {categoriasOrdenadas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Valor de Compra</label>
        <PriceInput value={valorCompra} onChange={setValorCompra} />
      </div>
      <div className="field">
        <label>Stock actual</label>
        <input ref={stockRef} type="number" min={0} defaultValue={it.stock ?? 0} />
      </div>
      <div className="field">
        <label>Stock Mínimo</label>
        <input ref={stockMinRef} type="number" min={0} defaultValue={it.stockMin ?? 0} />
      </div>
      <div className="field">
        <label>Stock Máximo</label>
        <input ref={stockMaxRef} type="number" min={0} placeholder="0 = sin tope" defaultValue={it.stockMax ?? 0} />
      </div>
      <div className="field">
        <label>Proveedor</label>
        <select ref={proveedorRef} defaultValue={it.proveedorId || ""}>
          <option value="">Sin proveedor asignado</option>
          {proveedoresOrdenados.map((prv) => (
            <option key={prv.id} value={prv.id}>
              {prv.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} style={{ width: "auto", marginRight: 8 }} />
          Activo
        </label>
      </div>
      <div className="err">{err}</div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={() => patchUi({ modal: null })}>
          Cancelar
        </button>
        <button className="btn" onClick={guardar}>
          Guardar
        </button>
      </div>
    </div>
  );
}
