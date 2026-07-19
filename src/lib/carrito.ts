export type TipoItemCarrito = "plan_nuevo" | "servicio" | "lavado_unico" | "aspirado";

export interface ItemCarrito {
  key: string; // "plan" | "lavado_unico" | servicioId
  tipo: TipoItemCarrito;
  servicioId?: string;
  nombre: string;
  precio: number;
}

const STORAGE_KEY = "zplash_carrito";
export const CARRITO_EVENT = "zplash-carrito-cambio";

// Cachea el array leído de localStorage para que useSyncExternalStore reciba
// la misma referencia mientras no cambie — si leerCarrito() devolviera un
// array nuevo (re-parseado) en cada llamada, entraría en loop infinito de
// re-render (getSnapshot debe ser estable entre llamadas sin cambios).
let cache: ItemCarrito[] | null = null;

function leerDeStorage(): ItemCarrito[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function leerCarrito(): ItemCarrito[] {
  if (typeof window === "undefined") return [];
  if (!cache) cache = leerDeStorage();
  return cache;
}

// Fuerza a releer desde localStorage en la próxima llamada a leerCarrito —
// se usa al recibir el evento "storage" (cambios hechos desde otra pestaña).
export function invalidarCacheCarrito(): void {
  cache = null;
}

function guardarCarrito(items: ItemCarrito[]): ItemCarrito[] {
  cache = items;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CARRITO_EVENT));
  }
  return items;
}

export function agregarItemCarrito(item: ItemCarrito): ItemCarrito[] {
  const items = leerCarrito().filter((i) => i.key !== item.key);
  items.push(item);
  return guardarCarrito(items);
}

export function quitarItemCarrito(key: string): ItemCarrito[] {
  return guardarCarrito(leerCarrito().filter((i) => i.key !== key));
}

export function vaciarCarrito(): ItemCarrito[] {
  return guardarCarrito([]);
}

export function totalCarrito(items: ItemCarrito[]): number {
  return items.reduce((sum, i) => sum + i.precio, 0);
}
