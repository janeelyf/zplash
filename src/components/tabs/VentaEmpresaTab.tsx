"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { fmtCLP, generarCodigoCupon } from "@/lib/helpers";
import type { Cupon } from "@/types";

function estadoCupon(c: Cupon): { label: string; cls: "ok" | "warn" | "bad" } {
  if (c.usado) return { label: "Usado", cls: "ok" };
  if (new Date(c.fechaCaducidad) < new Date()) return { label: "Caducado", cls: "bad" };
  return { label: "Disponible", cls: "warn" };
}

export default function VentaEmpresaTab() {
  const { data, commit } = useApp();
  const nombreRef = useRef<HTMLInputElement>(null);
  const cantidadRef = useRef<HTMLInputElement>(null);
  const valorRef = useRef<HTMLInputElement>(null);
  const caducidadRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<{ msg: string; ok: boolean } | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const generar = async () => {
    const nombreLote = nombreRef.current?.value.trim() || "";
    const cantidad = Number(cantidadRef.current?.value || 0);
    const valor = Number(valorRef.current?.value || 0);
    const fechaCaducidad = caducidadRef.current?.value || "";
    if (!nombreLote || !cantidad || cantidad < 1 || !fechaCaducidad) {
      setErr({ msg: "Completa nombre, cantidad y fecha de caducidad", ok: false });
      return;
    }
    if (cantidad > 500) {
      setErr({ msg: "Máximo 500 cupones por lote", ok: false });
      return;
    }

    const existentes = new Set(data.cupones.map((c) => c.codigo));
    const nuevos: Cupon[] = [];
    for (let i = 0; i < cantidad; i++) {
      const codigo = generarCodigoCupon(existentes);
      existentes.add(codigo);
      nuevos.push({
        id: "cup" + Date.now() + i + Math.floor(Math.random() * 1000),
        codigo,
        nombreLote,
        valor,
        fechaCaducidad: new Date(fechaCaducidad + "T23:59:59").toISOString(),
        usado: false,
        creadoEn: new Date().toISOString(),
        creadoPor: "Administrador",
      });
    }

    const ok = await commit({ cupones: [...nuevos, ...data.cupones] });
    if (!ok) {
      setErr({ msg: "No se pudieron generar los cupones (sin conexión). Intenta de nuevo.", ok: false });
      return;
    }
    setErr({ msg: `${cantidad} cupones generados para "${nombreLote}"`, ok: true });
    if (nombreRef.current) nombreRef.current.value = "";
    if (cantidadRef.current) cantidadRef.current.value = "";
    if (valorRef.current) valorRef.current.value = "";
    if (caducidadRef.current) caducidadRef.current.value = "";
  };

  const eliminar = (cup: Cupon) => {
    commit({ cupones: data.cupones.filter((x) => x.id !== cup.id) });
  };

  const q = busqueda.toLowerCase().trim();
  const filtrados = data.cupones
    .filter((c) => !q || c.nombreLote.toLowerCase().includes(q) || c.codigo.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());

  const descargar = () => {
    import("xlsx").then((XLSX) => {
      const filas = filtrados.map((c) => {
        const est = estadoCupon(c);
        return {
          Código: c.codigo,
          Lote: c.nombreLote,
          Valor: c.valor > 0 ? c.valor : "Gratis",
          Caducidad: new Date(c.fechaCaducidad).toLocaleDateString("es-CL"),
          Estado: est.label,
          "Patente de uso": c.patenteUso || "",
        };
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(
          filas.length ? filas : [{ Código: "", Lote: "", Valor: "", Caducidad: "", Estado: "", "Patente de uso": "" }]
        ),
        "Cupones"
      );
      XLSX.writeFile(wb, "cupones-venta-empresa.xlsx");
    });
  };

  return (
    <div>
      <div className="modal" style={{ maxWidth: 480, margin: "0 0 24px 0" }}>
        <h3>Generar cupones</h3>
        <div className="hint" style={{ textAlign: "left", color: "var(--gray)", fontSize: 13, marginBottom: 14 }}>
          Genera cupones de ingreso (gratis o a un valor fijo) para vender a empresas. Cada cupón se canjea una sola
          vez desde el perfil operador, ingresando el código y la patente del vehículo que lo usa.
        </div>
        <div className="field">
          <label>Nombre (empresa / lote)</label>
          <input ref={nombreRef} placeholder="Ej: Empresa ABC" />
        </div>
        <div className="field">
          <label>Cantidad de cupones</label>
          <input ref={cantidadRef} type="number" min={1} placeholder="10" />
        </div>
        <div className="field">
          <label>Valor por cupón (0 = gratis)</label>
          <input ref={valorRef} type="number" min={0} placeholder="0" />
        </div>
        <div className="field">
          <label>Fecha de caducidad</label>
          <input ref={caducidadRef} type="date" />
        </div>
        <div className="err" style={{ color: err?.ok ? "var(--green)" : undefined }}>
          {err?.msg || ""}
        </div>
        <button className="btn" onClick={generar}>
          Generar cupones
        </button>
      </div>

      <div className="toolbar">
        <input
          placeholder="Buscar por código o nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button className="btn ghost" onClick={descargar}>
          Descargar (Excel)
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Lote</th>
              <th>Valor</th>
              <th>Caducidad</th>
              <th>Estado</th>
              <th>Patente uso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty">Sin cupones</div>
                </td>
              </tr>
            ) : (
              filtrados.map((c) => {
                const est = estadoCupon(c);
                return (
                  <tr key={c.id}>
                    <td className="plate-tag">{c.codigo}</td>
                    <td>{c.nombreLote}</td>
                    <td>{c.valor > 0 ? fmtCLP(c.valor) : "Gratis"}</td>
                    <td>{new Date(c.fechaCaducidad).toLocaleDateString("es-CL")}</td>
                    <td>
                      <span className={`status-pill ${est.cls}`}>{est.label}</span>
                    </td>
                    <td>{c.patenteUso || "-"}</td>
                    <td className="row-actions">
                      {!c.usado && (
                        <button className="icon-btn" onClick={() => eliminar(c)}>
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
