"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { puedeBorrarCategoriaInventario } from "@/lib/helpers";
import type { CategoriaProducto } from "@/types";

export default function CategoriasProductoTab() {
  const { data, ui, patchUi, commit } = useApp();
  const nuevaCategoriaNombreRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<{ msg: string; ok: boolean } | null>(null);
  const puedeBorrar = puedeBorrarCategoriaInventario(ui.perfilActual?.nombre);

  const agregarCategoria = async () => {
    const nombre = (nuevaCategoriaNombreRef.current?.value.trim() || "").toUpperCase();
    if (!nombre) {
      setErr({ msg: "Escribe el nombre de la categoría", ok: false });
      return;
    }
    if (data.categoriasProducto.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) {
      setErr({ msg: "Ya existe una categoría con ese nombre", ok: false });
      return;
    }
    const nueva: CategoriaProducto = { id: "cp" + Date.now() + Math.floor(Math.random() * 1000), nombre, activa: true };
    const ok = await commit({ categoriasProducto: [...data.categoriasProducto, nueva] });
    if (!ok) {
      setErr({ msg: "No se pudo guardar (sin conexión). Intenta de nuevo.", ok: false });
      return;
    }
    setErr({ msg: "Categoría agregada correctamente", ok: true });
    if (nuevaCategoriaNombreRef.current) nuevaCategoriaNombreRef.current.value = "";
  };

  const toggleActiva = (cat: CategoriaProducto) => {
    const actualizada = { ...cat, activa: !cat.activa };
    commit({ categoriasProducto: data.categoriasProducto.map((c) => (c.id === cat.id ? actualizada : c)) });
  };

  const borrarCategoria = (cat: CategoriaProducto) => {
    const enUso = data.productos.filter((p) => p.categoriaId === cat.id).length;
    if (enUso > 0) {
      setErr({ msg: `No se puede borrar: ${enUso} producto(s) usan la categoría "${cat.nombre}".`, ok: false });
      return;
    }
    patchUi({
      modal: {
        type: "confirm",
        mensaje: `¿Borrar la categoría "${cat.nombre}"? Esta acción no se puede deshacer.`,
        confirmLabel: "Borrar",
        onConfirm: async () => {
          const ok = await commit({ categoriasProducto: data.categoriasProducto.filter((c) => c.id !== cat.id) });
          setErr(ok ? { msg: "Categoría borrada", ok: true } : { msg: "No se pudo borrar la categoría", ok: false });
        },
      },
    });
  };

  return (
    <div className="modal" style={{ maxWidth: 520, margin: 0 }}>
      <h3>Categorías de producto</h3>
      <div className="hint" style={{ textAlign: "left", color: "var(--gray)", fontSize: 13, marginBottom: 14 }}>
        Estas son las opciones seleccionables en &quot;Categoría&quot; al crear o editar un producto. Puedes agregar
        categorías nuevas o desactivar una sin borrarla — desactivarla la saca del selector de productos nuevos, pero
        conserva la asignación ya hecha en los productos existentes.
      </div>
      <div className="field">
        <label>Nueva categoría</label>
        <input ref={nuevaCategoriaNombreRef} placeholder="Ej: Insumos de Lavado" />
      </div>
      <div className="err" style={{ color: err?.ok ? "var(--green)" : undefined }}>
        {err?.msg || ""}
      </div>
      <button className="btn" onClick={agregarCategoria}>
        Agregar categoría
      </button>

      <div style={{ marginTop: 22 }}>
        {data.categoriasProducto
          .slice()
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
          .map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid var(--border)",
                opacity: c.activa ? 1 : 0.5,
              }}
            >
              <div style={{ flex: 1 }}>{c.nombre}</div>
              <button className="icon-btn" onClick={() => toggleActiva(c)}>
                {c.activa ? "Desactivar" : "Reactivar"}
              </button>
              {puedeBorrar && (
                <button className="icon-btn" onClick={() => borrarCategoria(c)}>
                  Borrar
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
