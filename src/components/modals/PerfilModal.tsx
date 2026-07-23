"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import type { PerfilPublico } from "@/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PerfilModal({ data: p }: { data: PerfilPublico | null }) {
  const { data, ui, commit, patchUi } = useApp();
  const nombreRef = useRef<HTMLInputElement>(null);
  const iconoRef = useRef<HTMLInputElement>(null);
  const claveRef = useRef<HTMLInputElement>(null);
  const actorClaveRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cerrar = () => patchUi({ modal: null });

  // Editar un perfil existente solo cambia el nombre (los módulos y la
  // clave se administran desde la misma fila en la pestaña Perfiles, si el
  // actor tiene el módulo "permisos"). Crear uno nuevo pide
  // su clave inicial y, para confirmar que quien lo crea tiene permiso,
  // la contraseña actual de quien está haciendo la acción.
  const guardar = async () => {
    const nombre = nombreRef.current?.value.trim() || "";
    if (!nombre) {
      setErr("El nombre es obligatorio");
      return;
    }
    const dup = data.perfiles.find((x) => x.nombre.toLowerCase() === nombre.toLowerCase() && x.id !== p?.id);
    if (dup) {
      setErr("Ya existe un perfil con ese nombre");
      return;
    }

    const icono = iconoRef.current?.value.trim() || "";

    if (p) {
      const actualizado: PerfilPublico = { ...p, nombre, icono };
      const ok = await commit({ perfiles: data.perfiles.map((x) => (x.id === p.id ? actualizado : x)) });
      if (!ok) {
        setErr("No se pudo guardar (sin conexión). Intenta de nuevo.");
        return;
      }
      cerrar();
      return;
    }

    const clave = claveRef.current?.value.trim() || "";
    const actorClave = actorClaveRef.current?.value || "";
    if (!clave || clave.length < 6) {
      setErr("La contraseña inicial debe tener al menos 6 caracteres");
      return;
    }
    if (!ui.perfilActual || !actorClave) {
      setErr("Ingresa tu contraseña para confirmar");
      return;
    }
    setGuardando(true);
    try {
      const res = await fetch("/api/perfiles/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId: ui.perfilActual.id,
          actorClave,
          nombre,
          clave,
          modulos: [],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErr(json.error || "No se pudo crear el perfil");
        return;
      }
      // El perfil ya quedó creado en el servidor; esto solo refleja el
      // cambio en el estado local para que aparezca sin recargar la página.
      const nuevo: PerfilPublico = { id: json.id, nombre, modulos: [], icono };
      await commit({ perfiles: [...data.perfiles, nuevo] });
      cerrar();
    } catch {
      setErr("No se pudo crear el perfil (sin conexión). Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && cerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{p ? "Editar perfil" : "Nuevo perfil"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="perfil-nombre">Nombre</Label>
            <Input id="perfil-nombre" ref={nombreRef} defaultValue={p?.nombre || ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="perfil-icono">Ícono (emoji, opcional)</Label>
            <Input id="perfil-icono" ref={iconoRef} defaultValue={p?.icono || ""} maxLength={4} placeholder="👤" className="max-w-20" />
          </div>
          {!p && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="perfil-clave">Contraseña inicial</Label>
                <Input id="perfil-clave" ref={claveRef} type="password" maxLength={12} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="perfil-actor-clave">Tu contraseña (para confirmar)</Label>
                <Input id="perfil-actor-clave" ref={actorClaveRef} type="password" maxLength={12} />
              </div>
              <p className="text-left text-sm text-muted-foreground">
                El perfil se crea sin módulos asignados — edítalo desde la pestaña Perfiles para darle acceso.
              </p>
            </>
          )}

          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={cerrar}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
