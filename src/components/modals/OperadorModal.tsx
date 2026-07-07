"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import type { Operador } from "@/types";

export default function OperadorModal({ data: o }: { data: Operador | null }) {
  const { data, commit, patchUi } = useApp();
  const nombreRef = useRef<HTMLInputElement>(null);
  const claveRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");

  const guardar = async () => {
    const nombre = nombreRef.current?.value.trim() || "";
    const clave = claveRef.current?.value.trim() || "";
    if (!nombre || !clave) {
      setErr("Nombre y contraseña son obligatorios");
      return;
    }
    const dup = data.operadores.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase() && x.id !== o?.id);
    if (dup) {
      setErr("Ya existe un operador con ese nombre");
      return;
    }
    let operadores: Operador[];
    if (o) {
      operadores = data.operadores.map((x) => (x.id === o.id ? { ...x, nombre, clave } : x));
    } else {
      operadores = [...data.operadores, { id: "c" + Date.now() + Math.floor(Math.random() * 1000), nombre, clave }];
    }
    await commit({ operadores });
    patchUi({ modal: null });
  };

  return (
    <div className="modal">
      <h3>{o ? "Editar operador" : "Nuevo operador"}</h3>
      <div className="field">
        <label>Nombre</label>
        <input ref={nombreRef} defaultValue={o?.nombre || ""} />
      </div>
      <div className="field">
        <label>Contraseña</label>
        <input ref={claveRef} defaultValue={o?.clave || ""} />
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
