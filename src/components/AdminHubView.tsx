"use client";

import Image from "next/image";
import { useApp } from "@/context/AppContext";

export default function AdminHubView() {
  const { ui, patchUi } = useApp();

  return (
    <div className="login-screen">
      <div className="brand">
        <Image src="/logo.jpg" alt="ZPlash" width={200} height={76} className="brand-logo" unoptimized />
        <div className="sub">Hola, {ui.adminActual}</div>
      </div>
      <div className="role-grid">
        <button className="role-btn" onClick={() => patchUi({ view: "admin" })}>
          <div className="icon">🗂️</div>
          <div className="label">Administrador de ingresos</div>
          <div className="desc">Clientes, historial, cierre de caja y más</div>
        </button>
        {ui.adminActual === "Juan" && (
          <button className="role-btn" onClick={() => patchUi({ view: "contabilidad" })}>
            <div className="icon">📊</div>
            <div className="label">Contabilidad</div>
            <div className="desc">Ingresos, egresos, cuentas por cobrar y por pagar</div>
          </button>
        )}
      </div>
      <button className="btn ghost" style={{ marginTop: 20 }} onClick={() => patchUi({ view: "login", adminActual: null })}>
        Cerrar sesión
      </button>
    </div>
  );
}
