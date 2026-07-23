"use client";

import { useState } from "react";
import { useCarrito } from "@/hooks/useCarrito";
import type { ItemCarrito } from "@/lib/carrito";

export default function AgregarCarritoButton({ item }: { item: ItemCarrito }) {
  const [agregado, setAgregado] = useState(false);
  const { agregar } = useCarrito();

  return (
    <button
      type="button"
      className="btn ghost"
      style={{ marginTop: 0 }}
      onClick={() => {
        agregar(item);
        setAgregado(true);
      }}
    >
      {agregado ? "Agregado ✓" : "Agregar al carrito"}
    </button>
  );
}
