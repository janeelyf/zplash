"use client";

import { useState } from "react";

// Combobox de texto+lista propio en vez de <input list="..."> nativo: el
// datalist del navegador filtra sus sugerencias comparándolas contra el
// texto que ya trae el campo, así que si el valor actual no calza con
// ninguna opción (p.ej. una categoría asignada automáticamente por una
// regla de conciliación) el desplegable no muestra nada — da la impresión
// de que las opciones nuevas "no existen". Este componente siempre lista
// las opciones que calzan con lo tipeado (o todas, si está vacío) al
// abrirse, sin depender del comportamiento nativo del navegador.
export function Buscador({
  value,
  onChange,
  opciones,
  onCommit,
  placeholder = "Escribe para buscar...",
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  opciones: { categoria: string; grupo?: string }[];
  onCommit?: () => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [abierto, setAbierto] = useState(false);
  const q = value.trim().toLowerCase();
  const filtradas = q ? opciones.filter((o) => o.categoria.toLowerCase().includes(q)) : opciones;

  return (
    <div style={{ position: "relative", ...style }}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => {
          setTimeout(() => setAbierto(false), 150);
          onCommit?.();
        }}
        placeholder={placeholder}
        style={{ width: "100%" }}
      />
      {abierto && filtradas.length > 0 && (
        <div
          style={{
            position: "absolute",
            zIndex: 20,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            maxHeight: 220,
            overflowY: "auto",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
          }}
        >
          {filtradas.map((o) => (
            <div
              key={o.categoria}
              onMouseDown={() => {
                onChange(o.categoria);
                setAbierto(false);
              }}
              style={{ padding: "8px 12px", cursor: "pointer" }}
            >
              <div>{o.categoria}</div>
              {o.grupo && <div style={{ fontSize: 11, color: "var(--gray)" }}>{o.grupo}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
