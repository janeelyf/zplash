export interface VehiculoSesion {
  patente: string;
  plan: string;
  estado: { label: string; cls: "ok" | "warn" | "bad" };
  vencimiento: string | null;
}

export interface SesionCliente {
  paso: "encontrado" | "no-encontrado";
  email: string;
  vehiculos: VehiculoSesion[];
}

const STORAGE_KEY = "zplash_sesion_cliente";
export const SESION_EVENT = "zplash-sesion-cambio";

// Igual que en carrito.ts: cachea lo leído de localStorage para que
// useSyncExternalStore reciba la misma referencia mientras no cambie.
let cache: SesionCliente | null = null;
let cargado = false;

function leerDeStorage(): SesionCliente | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function leerSesion(): SesionCliente | null {
  if (typeof window === "undefined") return null;
  if (!cargado) {
    cache = leerDeStorage();
    cargado = true;
  }
  return cache;
}

export function invalidarCacheSesion(): void {
  cargado = false;
}

function guardarSesion(sesion: SesionCliente | null): void {
  cache = sesion;
  cargado = true;
  if (typeof window !== "undefined") {
    if (sesion) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
    else window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(SESION_EVENT));
  }
}

export function iniciarSesion(sesion: SesionCliente): void {
  guardarSesion(sesion);
}

export function cerrarSesion(): void {
  guardarSesion(null);
}
