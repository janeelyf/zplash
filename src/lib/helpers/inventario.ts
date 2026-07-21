import type { DestinoInventario, MovimientoInventario, Producto } from "@/types";

/** Cantidad de `producto` disponible en cada destino (Bodega + vending), a
 * partir de los traspasos registrados en `movimientos`. No hay una columna de
 * "cantidad actual por destino" guardada: cada traspaso suma al destino y
 * resta al origen, y Bodega (el destino con `esBodega`) además arranca con
 * `producto.stock` completo — así el total repartido entre todos los
 * destinos siempre cuadra con el stock general del producto, sin importar
 * cuántos traspasos haya entre destinos que no sean Bodega. */
export function stockPorDestino(
  producto: Pick<Producto, "id" | "stock">,
  destinos: DestinoInventario[],
  movimientos: MovimientoInventario[]
): Map<string, number> {
  const porDestino = new Map<string, number>();
  for (const d of destinos) porDestino.set(d.id, d.esBodega ? producto.stock : 0);
  for (const m of movimientos) {
    if (m.productoId !== producto.id) continue;
    porDestino.set(m.origenId, (porDestino.get(m.origenId) ?? 0) - m.cantidad);
    porDestino.set(m.destinoId, (porDestino.get(m.destinoId) ?? 0) + m.cantidad);
  }
  return porDestino;
}

/** true si `producto` puede estar en `destinoId` — false si está en su lista
 * de destinos bloqueados (ver Producto.destinosBloqueados en @/types, ej. un
 * paño no debería poder cargarse en la máquina "Vending Café"). Sin lista
 * (undefined/vacía) = permitido en todos los destinos. */
export function productoPermitidoEnDestino(producto: Pick<Producto, "destinosBloqueados">, destinoId: string): boolean {
  return !producto.destinosBloqueados?.includes(destinoId);
}
