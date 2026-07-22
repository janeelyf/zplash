"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import PriceInput from "@/components/PriceInput";
import { generarCodigoProducto, uid } from "@/lib/helpers";
import type { Producto } from "@/types";

export default function ProductoModal({ data: prod }: { data: Producto | null }) {
  const { data, commit, patchUi, ui } = useApp();
  const pr = prod || ({} as Partial<Producto>);

  const skuRef = useRef<HTMLInputElement>(null);
  const detalleRef = useRef<HTMLInputElement>(null);
  const categoriaRef = useRef<HTMLSelectElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);
  const stockMinRef = useRef<HTMLInputElement>(null);
  const stockMaxRef = useRef<HTMLInputElement>(null);
  const empaqueMinimoRef = useRef<HTMLInputElement>(null);
  const proveedorRef = useRef<HTMLSelectElement>(null);
  const [valorCompra, setValorCompra] = useState(pr.valorCompra ? String(pr.valorCompra) : "");
  const [valorVenta, setValorVenta] = useState(pr.valorVenta ? String(pr.valorVenta) : "");
  const [activo, setActivo] = useState(pr.activo ?? true);
  // Bodega nunca puede quedar bloqueada (es el origen implícito de todo
  // Producto.stock — bloquearla dejaría el stock sin ningún destino válido).
  // Se filtra también al cargar por si el producto ya trae datos viejos con
  // Bodega bloqueada por error.
  const idsBodega = new Set(data.destinosInventario.filter((d) => d.esBodega).map((d) => d.id));
  const [destinosBloqueados, setDestinosBloqueados] = useState<string[]>(
    (pr.destinosBloqueados || []).filter((id) => !idsBodega.has(id))
  );
  const [err, setErr] = useState("");
  // El código se asigna una sola vez (al abrir el modal para un producto
  // nuevo) y no se vuelve a recalcular en re-renders, para que no cambie
  // bajo el usuario mientras completa el resto del formulario.
  const [codigo] = useState(() => pr.codigo || generarCodigoProducto(data.productos.map((p) => p.codigo)));

  const proveedoresOrdenados = [...data.proveedores].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const categoriasOrdenadas = [...data.categoriasProducto]
    .filter((c) => c.activa || c.id === pr.categoriaId)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const destinosOrdenados = [...data.destinosInventario]
    .filter((d) => d.activo)
    .sort((a, b) => (b.esBodega ? 1 : 0) - (a.esBodega ? 1 : 0) || a.nombre.localeCompare(b.nombre));

  const toggleDestinoBloqueado = (destinoId: string) => {
    setDestinosBloqueados((prev) => (prev.includes(destinoId) ? prev.filter((id) => id !== destinoId) : [...prev, destinoId]));
  };

  const guardar = async () => {
    const sku = skuRef.current?.value.trim() || "";
    const detalle = detalleRef.current?.value.trim() || "";
    if (!sku || !detalle) {
      setErr("SKU y Detalle son obligatorios");
      return;
    }
    const dup = data.productos.find((x) => x.sku.toLowerCase() === sku.toLowerCase() && x.id !== prod?.id);
    if (dup) {
      setErr("Ya existe un producto con ese SKU");
      return;
    }
    const stockMin = Number(stockMinRef.current?.value) || 0;
    const stockMax = Number(stockMaxRef.current?.value) || 0;
    if (stockMax > 0 && stockMax < stockMin) {
      setErr("El Stock Máximo no puede ser menor que el Stock Mínimo");
      return;
    }
    const empaqueMinimo = Number(empaqueMinimoRef.current?.value) || 1;

    const campos = {
      codigo,
      sku,
      detalle,
      categoriaId: categoriaRef.current?.value || "",
      valorCompra: Number(valorCompra) || 0,
      valorVenta: Number(valorVenta) || 0,
      stock: Number(stockRef.current?.value) || 0,
      stockMin,
      stockMax,
      empaqueMinimo,
      proveedorId: proveedorRef.current?.value || "",
      activo,
      destinosBloqueados,
    };

    let productos: Producto[];
    if (prod) {
      const actualizado: Producto = { ...(prod as Producto), ...campos };
      productos = data.productos.map((x) => (x.id === prod.id ? actualizado : x));
    } else {
      const nuevo: Producto = {
        id: uid(),
        ...campos,
        creadoEn: new Date().toISOString(),
        creadoPor: ui.perfilActual?.nombre || "Administrador",
      };
      productos = [...data.productos, nuevo];
    }

    const ok = await commit({ productos });
    if (!ok) {
      setErr("No se pudo guardar el cambio (sin conexión con el almacenamiento). Verifica tu conexión e inténtalo de nuevo.");
      return;
    }
    patchUi({ modal: null });
  };

  return (
    <div className="modal">
      <h3>{prod ? "Editar producto" : "Nuevo producto"}</h3>
      <div className="field">
        <label>Código</label>
        <input value={codigo} disabled />
      </div>
      <div className="field">
        <label>SKU</label>
        <input ref={skuRef} defaultValue={pr.sku || ""} autoFocus={!prod} placeholder="Nombre de fantasía (web/vending)" />
      </div>
      <div className="field">
        <label>Detalle</label>
        <input ref={detalleRef} defaultValue={pr.detalle || ""} />
      </div>
      <div className="field">
        <label>Categoría</label>
        <select ref={categoriaRef} defaultValue={pr.categoriaId || ""}>
          <option value="">Sin categoría</option>
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
        <label>Valor de Venta</label>
        <PriceInput value={valorVenta} onChange={setValorVenta} />
      </div>
      <div className="field">
        <label>Stock actual</label>
        <input ref={stockRef} type="number" min={0} defaultValue={pr.stock ?? 0} />
      </div>
      <div className="field">
        <label>Stock Mínimo</label>
        <input ref={stockMinRef} type="number" min={0} defaultValue={pr.stockMin ?? 0} />
      </div>
      <div className="field">
        <label>Stock Máximo</label>
        <input ref={stockMaxRef} type="number" min={0} placeholder="0 = sin tope" defaultValue={pr.stockMax ?? 0} />
      </div>
      <div className="field">
        <label>Mínimo de empaque (cantidad por caja)</label>
        <input ref={empaqueMinimoRef} type="number" min={1} defaultValue={pr.empaqueMinimo ?? 1} />
      </div>
      <div className="field">
        <label>Proveedor</label>
        <select ref={proveedorRef} defaultValue={pr.proveedorId || ""}>
          <option value="">Sin proveedor asignado</option>
          {proveedoresOrdenados.map((prv) => (
            <option key={prv.id} value={prv.id}>
              {prv.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Ubicaciones bloqueadas</label>
        <div className="hint" style={{ fontSize: 12, color: "var(--gray)", marginBottom: 6 }}>
          Marca las bodegas/máquinas donde este producto NO puede estar (ej. un paño no debería cargarse en
          &ldquo;Vending Café&rdquo;). Los traspasos hacia esas ubicaciones quedarán bloqueados.
        </div>
        {destinosOrdenados.length === 0 ? (
          <div className="hint" style={{ fontSize: 12, color: "var(--gray)" }}>
            No hay destinos de inventario configurados.
          </div>
        ) : (
          destinosOrdenados.map((d) => (
            <label key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, opacity: d.esBodega ? 0.5 : 1 }}>
              <input
                type="checkbox"
                checked={!d.esBodega && destinosBloqueados.includes(d.id)}
                disabled={d.esBodega}
                onChange={() => toggleDestinoBloqueado(d.id)}
                style={{ width: "auto" }}
              />
              {d.nombre}
              {d.esBodega && <span style={{ fontSize: 11, color: "var(--gray)" }}>(no se puede bloquear: origen del stock)</span>}
            </label>
          ))
        )}
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
