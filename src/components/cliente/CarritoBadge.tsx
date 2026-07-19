"use client";

import { useCarrito } from "@/hooks/useCarrito";

export default function CarritoBadge() {
  const { items } = useCarrito();

  return (
    <a href="/carrito" className="carrito-link" aria-label="Ver carrito">
      🛒
      {items.length > 0 && <span className="carrito-count">{items.length}</span>}
    </a>
  );
}
