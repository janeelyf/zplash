export function uid(): string {
  return "c" + Date.now() + Math.floor(Math.random() * 1000);
}

/** Mismo esquema de id usado para ingresos en toda la app ("i" + timestamp), envuelto en una función para no llamar Date.now() directo desde un componente (ver react-hooks/purity). */
export function uidIngreso(): string {
  return "i" + Date.now();
}

/** Mismo esquema de id usado para ventas en toda la app ("v" + timestamp), envuelto en una función por el mismo motivo que uidIngreso(). */
export function uidVenta(): string {
  return "v" + Date.now();
}

/** Mismo esquema de id usado para movimientos contables ("mc" + timestamp + random), envuelto en una función por el mismo motivo que uidIngreso() — necesario acá porque ConciliacionBancariaTab crea el movimiento dentro del cuerpo del componente, no en un módulo aparte como MovimientoContableTab. */
export function uidMovimientoContable(): string {
  return "mc" + Date.now() + Math.floor(Math.random() * 1000);
}

/** Código de 6 dígitos numéricos, asignado por el sistema (no editable) al
 * crear un Producto — identificador corto de inventario, distinto del SKU
 * (que es el nombre de fantasía usado en la web/vending). Reintenta contra
 * `existentes` para no colisionar con un código ya asignado. */
export function generarCodigoProducto(existentes: string[]): string {
  const usados = new Set(existentes);
  let codigo: string;
  do {
    codigo = String(Math.floor(100000 + Math.random() * 900000));
  } while (usados.has(codigo));
  return codigo;
}
