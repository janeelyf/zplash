"use client";

import { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { fmtTelefono } from "@/lib/helpers";
import type { Proveedor } from "@/types";

export default function ProveedoresTab() {
  const { data, ui, patchUi, commit } = useApp();

  const q = (ui.search || "").trim().toLowerCase();
  const filtrados = useMemo(() => {
    return data.proveedores
      .filter((p) => !q || p.nombre.toLowerCase().includes(q) || (p.rut || "").toLowerCase().includes(q))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [data.proveedores, q]);

  const eliminar = (p: Proveedor) => {
    const enUso = data.productos.some((prod) => prod.proveedorId === p.id);
    patchUi({
      modal: {
        type: "confirm",
        mensaje: enUso
          ? `¿Eliminar a ${p.nombre}? Los productos que lo tienen asignado quedarán sin proveedor.`
          : `¿Eliminar a ${p.nombre}? Esta acción no se puede deshacer.`,
        onConfirm: () => {
          commit({ proveedores: data.proveedores.filter((x) => x.id !== p.id) });
        },
      },
    });
  };

  return (
    <div>
      <div className="toolbar">
        <input placeholder="Buscar por nombre o RUT..." value={ui.search || ""} onChange={(e) => patchUi({ search: e.target.value })} />
        <button className="btn" onClick={() => patchUi({ modal: { type: "proveedor", data: null } })}>
          + Nuevo proveedor
        </button>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Dirección</th>
              <th>Contacto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty">No hay proveedores que coincidan</div>
                </td>
              </tr>
            ) : (
              filtrados.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.rut || "-"}</td>
                  <td>{p.telefono ? fmtTelefono(p.telefono) : "-"}</td>
                  <td>{p.email || "-"}</td>
                  <td>{p.direccion || "-"}</td>
                  <td>{p.contacto || "-"}</td>
                  <td className="row-actions">
                    <button className="icon-btn" onClick={() => patchUi({ modal: { type: "proveedor", data: p } })}>
                      Editar
                    </button>
                    <button className="icon-btn" onClick={() => eliminar(p)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
