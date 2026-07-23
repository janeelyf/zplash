"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { fmtTelefono, formatTelefono, formatRut, isValidRut, RUT_FORMATO_MSG, uid } from "@/lib/helpers";
import type { Proveedor } from "@/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProveedorModal({ data: p }: { data: Proveedor | null }) {
  const { data, commit, patchUi, ui } = useApp();
  const prov = p || ({} as Partial<Proveedor>);

  const nombreRef = useRef<HTMLInputElement>(null);
  const rutRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const direccionRef = useRef<HTMLInputElement>(null);
  const contactoRef = useRef<HTMLInputElement>(null);
  const emailVendedorRef = useRef<HTMLInputElement>(null);
  const telefonoVendedorRef = useRef<HTMLInputElement>(null);
  const emailComprobantesRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");

  const cerrar = () => patchUi({ modal: null });

  const onTelefonoBlur = () => {
    const raw = telefonoRef.current?.value.trim() || "";
    if (!raw || !telefonoRef.current) return;
    telefonoRef.current.value = fmtTelefono(raw);
  };

  const onTelefonoVendedorBlur = () => {
    const raw = telefonoVendedorRef.current?.value.trim() || "";
    if (!raw || !telefonoVendedorRef.current) return;
    telefonoVendedorRef.current.value = fmtTelefono(raw);
  };

  const guardar = async () => {
    const nombre = nombreRef.current?.value.trim() || "";
    if (!nombre) {
      setErr("El nombre es obligatorio");
      return;
    }
    const rutRaw = rutRef.current?.value.trim() || "";
    if (rutRaw && !isValidRut(rutRaw)) {
      setErr(RUT_FORMATO_MSG);
      return;
    }
    const rut = rutRaw ? formatRut(rutRaw) : "";
    const telefonoRaw = telefonoRef.current?.value.trim() || "";
    const telefono = telefonoRaw ? formatTelefono(telefonoRaw) : "";
    const telefonoVendedorRaw = telefonoVendedorRef.current?.value.trim() || "";
    const telefonoVendedor = telefonoVendedorRaw ? formatTelefono(telefonoVendedorRaw) : "";

    let proveedores: Proveedor[];
    if (p) {
      const actualizado: Proveedor = {
        ...(p as Proveedor),
        nombre,
        rut,
        telefono,
        email: emailRef.current?.value.trim() || "",
        direccion: direccionRef.current?.value.trim() || "",
        contacto: contactoRef.current?.value.trim() || "",
        emailVendedor: emailVendedorRef.current?.value.trim() || "",
        telefonoVendedor,
        emailComprobantes: emailComprobantesRef.current?.value.trim() || "",
      };
      proveedores = data.proveedores.map((x) => (x.id === p.id ? actualizado : x));
    } else {
      const nuevo: Proveedor = {
        id: uid(),
        nombre,
        rut,
        telefono,
        email: emailRef.current?.value.trim() || "",
        direccion: direccionRef.current?.value.trim() || "",
        contacto: contactoRef.current?.value.trim() || "",
        emailVendedor: emailVendedorRef.current?.value.trim() || "",
        telefonoVendedor,
        emailComprobantes: emailComprobantesRef.current?.value.trim() || "",
        creadoEn: new Date().toISOString(),
        creadoPor: ui.perfilActual?.nombre || "Administrador",
      };
      proveedores = [...data.proveedores, nuevo];
    }

    const ok = await commit({ proveedores });
    if (!ok) {
      setErr("No se pudo guardar el cambio (sin conexión con el almacenamiento). Verifica tu conexión e inténtalo de nuevo.");
      return;
    }
    cerrar();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && cerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{p ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="prov-nombre">Nombre</Label>
            <Input id="prov-nombre" ref={nombreRef} defaultValue={prov.nombre || ""} autoFocus={!p} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prov-rut">RUT</Label>
            <Input id="prov-rut" ref={rutRef} defaultValue={prov.rut || ""} placeholder="12.345.678-9" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prov-telefono">Teléfono</Label>
            <Input
              id="prov-telefono"
              ref={telefonoRef}
              defaultValue={prov.telefono ? fmtTelefono(prov.telefono) : ""}
              placeholder="+569 -1111 1111"
              onBlur={onTelefonoBlur}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prov-email">Email</Label>
            <Input id="prov-email" ref={emailRef} type="email" defaultValue={prov.email || ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prov-direccion">Dirección</Label>
            <Input id="prov-direccion" ref={direccionRef} defaultValue={prov.direccion || ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prov-contacto">Nombre del Vendedor</Label>
            <Input id="prov-contacto" ref={contactoRef} defaultValue={prov.contacto || ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prov-email-vendedor">Mail del Vendedor</Label>
            <Input id="prov-email-vendedor" ref={emailVendedorRef} type="email" defaultValue={prov.emailVendedor || ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prov-telefono-vendedor">Número del Vendedor</Label>
            <Input
              id="prov-telefono-vendedor"
              ref={telefonoVendedorRef}
              defaultValue={prov.telefonoVendedor ? fmtTelefono(prov.telefonoVendedor) : ""}
              placeholder="+569 -1111 1111"
              onBlur={onTelefonoVendedorBlur}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="prov-email-comprobantes">Mail Comprobantes de Transferencia</Label>
            <Input id="prov-email-comprobantes" ref={emailComprobantesRef} type="email" defaultValue={prov.emailComprobantes || ""} />
          </div>

          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={cerrar}>
            Cancelar
          </Button>
          <Button onClick={guardar}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
