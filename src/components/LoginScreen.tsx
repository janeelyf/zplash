"use client";

import { useRef } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";

export default function LoginScreen() {
  const { data, ui, patchUi } = useApp();

  if (ui.loginMode === "pin") {
    return <AdminPinForm />;
  }
  if (ui.loginMode === "operadorSelect") {
    return (
      <div className="login-screen">
        <div className="brand">
          <Image src="/logo.jpg" alt="ZPlash" width={200} height={76} className="brand-logo" unoptimized />
          <div className="sub">¿Quién eres?</div>
        </div>
        <div className="role-grid">
          {data.operadores.map((o) => (
            <button
              key={o.id}
              className="role-btn"
              style={{ width: 150, padding: "22px 16px" }}
              onClick={() => patchUi({ loginMode: "operadorPin", operadorSeleccionado: o.id, loginErr: "" })}
            >
              <div className="icon">👤</div>
              <div className="label">{o.nombre}</div>
            </button>
          ))}
        </div>
        <button className="btn ghost" onClick={() => patchUi({ loginMode: null })}>
          Volver
        </button>
      </div>
    );
  }
  if (ui.loginMode === "operadorPin") {
    return <OperadorPinForm />;
  }

  return (
    <div className="login-screen">
      <div className="brand">
        <Image src="/logo.jpg" alt="ZPlash" width={200} height={76} className="brand-logo" unoptimized />
        <div className="sub">Control de Acceso</div>
      </div>
      <div className="role-grid">
        <button className="role-btn" onClick={() => patchUi({ loginMode: "operadorSelect", loginErr: "" })}>
          <div className="icon">🚗</div>
          <div className="label">Operador</div>
          <div className="desc">Validar patente y registrar ingreso</div>
        </button>
        <button className="role-btn" onClick={() => patchUi({ loginMode: "pin", loginErr: "" })}>
          <div className="icon">🔑</div>
          <div className="label">Administrador</div>
          <div className="desc">Gestionar clientes e historial</div>
        </button>
      </div>
    </div>
  );
}

function AdminPinForm() {
  const { data, ui, patchUi } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const val = inputRef.current?.value || "";
    if (val === data.pinAdmin) {
      patchUi({ view: "admin", loginMode: null, loginErr: "" });
    } else {
      patchUi({ loginErr: "PIN incorrecto" });
    }
  };

  return (
    <div className="login-screen">
      <div className="brand">
        <Image src="/logo.jpg" alt="ZPlash" width={200} height={76} className="brand-logo" unoptimized />
        <div className="sub">Acceso Administrador</div>
      </div>
      <div className="pin-box">
        <input
          ref={inputRef}
          type="password"
          maxLength={6}
          placeholder="••••"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <div className="err">{ui.loginErr || ""}</div>
        <button className="btn" onClick={submit}>
          Ingresar
        </button>
        <button className="btn ghost" onClick={() => patchUi({ loginMode: null, loginErr: "" })}>
          Volver
        </button>
      </div>
    </div>
  );
}

function OperadorPinForm() {
  const { data, ui, patchUi } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const op = data.operadores.find((o) => o.id === ui.operadorSeleccionado);

  const submit = () => {
    const val = inputRef.current?.value || "";
    if (op && val === op.clave) {
      patchUi({ view: "operador", operResult: null, operadorActual: op.nombre, loginMode: null, loginErr: "" });
    } else {
      patchUi({ loginErr: "Contraseña incorrecta" });
    }
  };

  return (
    <div className="login-screen">
      <div className="brand">
        <Image src="/logo.jpg" alt="ZPlash" width={200} height={76} className="brand-logo" unoptimized />
        <div className="sub">Hola, {op ? op.nombre : ""}</div>
      </div>
      <div className="pin-box">
        <input
          ref={inputRef}
          type="password"
          maxLength={12}
          placeholder="Contraseña"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <div className="err">{ui.loginErr || ""}</div>
        <button className="btn" onClick={submit}>
          Ingresar
        </button>
        <button className="btn ghost" onClick={() => patchUi({ loginMode: "operadorSelect", loginErr: "" })}>
          Volver
        </button>
      </div>
    </div>
  );
}
