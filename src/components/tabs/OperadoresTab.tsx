"use client";

import { useApp } from "@/context/AppContext";
import type { Operador } from "@/types";

export default function OperadoresTab() {
  const { data, commit, patchUi } = useApp();

  const eliminar = (op: Operador) => {
    patchUi({
      modal: {
        type: "confirm",
        mensaje: `¿Eliminar a ${op.nombre}? Esta acción no se puede deshacer.`,
        onConfirm: () => {
          commit({ operadores: data.operadores.filter((o) => o.id !== op.id) });
        },
      },
    });
  };

  return (
    <div>
      <div className="toolbar">
        <button className="btn" onClick={() => patchUi({ modal: { type: "operador", data: null } })}>
          + Nuevo operador
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Contraseña</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.operadores.length === 0 ? (
            <tr>
              <td colSpan={3}>
                <div className="empty">No hay operadores registrados</div>
              </td>
            </tr>
          ) : (
            data.operadores.map((o) => (
              <tr key={o.id}>
                <td>{o.nombre}</td>
                <td
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color: "var(--gold)",
                  }}
                >
                  {o.clave}
                </td>
                <td className="row-actions">
                  <button className="icon-btn" onClick={() => patchUi({ modal: { type: "operador", data: o } })}>
                    Editar
                  </button>
                  <button className="icon-btn" onClick={() => eliminar(o)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
