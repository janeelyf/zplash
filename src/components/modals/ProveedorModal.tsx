"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { fmtTelefono, formatTelefono, formatRut, isValidRut, RUT_FORMATO_MSG, uid } from "@/lib/helpers";
import type { Proveedor } from "@/types";

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
    patchUi({ modal: null });
  };

  return (
    <div className="modal">
      <h3>{p ? "Editar proveedor" : "Nuevo proveedor"}</h3>
      <div className="field">
        <label>Nombre</label>
        <input ref={nombreRef} defaultValue={prov.nombre || ""} autoFocus={!p} />
      </div>
      <div className="field">
        <label>RUT</label>
        <input ref={rutRef} defaultValue={prov.rut || ""} placeholder="12.345.678-9" />
      </div>
      <div className="field">
        <label>Teléfono</label>
        <input
          ref={telefonoRef}
          defaultValue={prov.telefono ? fmtTelefono(prov.telefono) : ""}
          placeholder="+569 -1111 1111"
          onBlur={onTelefonoBlur}
        />
      </div>
      <div className="field">
        <label>Email</label>
        <input ref={emailRef} type="email" defaultValue={prov.email || ""} />
      </div>
      <div className="field">
        <label>Dirección</label>
        <input ref={direccionRef} defaultValue={prov.direccion || ""} />
      </div>
      <div className="field">
        <label>Nombre del Vendedor</label>
        <input ref={contactoRef} defaultValue={prov.contacto || ""} />
      </div>
      <div className="field">
        <label>Mail del Vendedor</label>
        <input ref={emailVendedorRef} type="email" defaultValue={prov.emailVendedor || ""} />
      </div>
      <div className="field">
        <label>Número del Vendedor</label>
        <input
          ref={telefonoVendedorRef}
          defaultValue={prov.telefonoVendedor ? fmtTelefono(prov.telefonoVendedor) : ""}
          placeholder="+569 -1111 1111"
          onBlur={onTelefonoVendedorBlur}
        />
      </div>
      <div className="field">
        <label>Mail Comprobantes de Transferencia</label>
        <input ref={emailComprobantesRef} type="email" defaultValue={prov.emailComprobantes || ""} />
      </div>
      <div className="err">{err}</div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={() => patchUi({ modal: null })}>
          Cancelar
        </button>
        <button className="btn" onClick={guardar}>
          Guardar
        </button>
      </div>
    </div>
  );
}
