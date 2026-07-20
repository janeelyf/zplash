"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  SESION_EVENT,
  cerrarSesion,
  iniciarSesion,
  invalidarCacheSesion,
  leerSesion,
  type SesionCliente,
} from "@/lib/sesionCliente";

function subscribe(callback: () => void) {
  const onStorage = () => {
    invalidarCacheSesion();
    callback();
  };
  window.addEventListener(SESION_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SESION_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

function getServerSnapshot(): SesionCliente | null {
  return null;
}

export function useSesionCliente() {
  const sesion = useSyncExternalStore(subscribe, leerSesion, getServerSnapshot);

  const iniciar = useCallback((s: SesionCliente) => {
    iniciarSesion(s);
  }, []);
  const cerrar = useCallback(() => {
    cerrarSesion();
  }, []);

  return { sesion, iniciar, cerrar };
}
