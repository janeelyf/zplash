"use client";

import { useRef } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";

export default function LoginScreen() {
  const { data, ui, patchUi } = useApp();

  if (ui.loginMode === "adminSelect") {
    return (
      <div className="login-screen">
        <div className="brand">
          <Image src="/logo.jpg" alt="ZPlash" width={200} height={76} className="brand-logo" unoptimized />
          <div className="sub">¿Quién eres?</div>
        </div>
        <div className="role-grid">
          {data.administradores.map((a) => (
            <button
              key={a.id}
              className="role-btn"
              style={{ width: 150, padding: "22px 16px" }}
              onClick={() => patchUi({ loginMode: "adminPin", adminSeleccionado: a.nombre, loginErr: "" })}
            >
              <div className="icon">👤</div>
              <div className="label">{a.nombre}</div>
            </button>
          ))}
        </div>
        <button className="btn ghost" onClick={() => patchUi({ loginMode: null })}>
          Volver
        </button>
      </div>
    );
  }
  if (ui.loginMode === "adminPin") {
    return <AdminPinForm />;
  }
  if (ui.loginMode === "operadorSelect" || ui.loginMode === "servSelect") {
    const destino = ui.loginMode === "servSelect" ? "servPin" : "operadorPin";
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
              onClick={() => patchUi({ loginMode: destino, operadorSeleccionado: o.id, loginErr: "" })}
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
  if (ui.loginMode === "operadorPin" || ui.loginMode === "servPin") {
    return <OperadorPinForm destinoView={ui.loginMode === "servPin" ? "servicios" : "operador"} />;
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
        <button className="role-btn" onClick={() => patchUi({ loginMode: "servSelect", loginErr: "" })}>
          <div className="icon">🧽</div>
          <div className="label">Ingreso Servicios Adicionales</div>
          <div className="desc">Detailing, tapiz, motor, chasis y más</div>
        </button>
        <button className="role-btn" onClick={() => patchUi({ loginMode: "adminSelect", loginErr: "" })}>
          <div className="icon">🔑</div>
          <div className="label">ADMINISTRACIÓN</div>
          <div className="desc">Gestionar clientes e historial</div>
        </button>
      </div>
    </div>
  );
}

function AdminPinForm() {
  const { data, ui, patchUi } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const admin = data.administradores.find((a) => a.nombre === ui.adminSeleccionado);

  const submit = () => {
    const val = inputRef.current?.value || "";
    if (admin && val === admin.clave) {
      patchUi({ view: "adminHub", adminActual: admin.nombre, loginMode: null, loginErr: "" });
    } else {
      patchUi({ loginErr: "Contraseña incorrecta" });
    }
  };

  return (
    <div className="login-screen">
      <div className="brand">
        <Image src="/logo.jpg" alt="ZPlash" width={200} height={76} className="brand-logo" unoptimized />
        <div className="sub">Hola, {admin ? admin.nombre : ""}</div>
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
        <button className="btn ghost" onClick={() => patchUi({ loginMode: "adminSelect", loginErr: "" })}>
          Volver
        </button>
      </div>
    </div>
  );
}

function OperadorPinForm({ destinoView }: { destinoView: "operador" | "servicios" }) {
  const { data, ui, patchUi } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const op = data.operadores.find((o) => o.id === ui.operadorSeleccionado);
  const selectMode = destinoView === "servicios" ? "servSelect" : "operadorSelect";

  const submit = () => {
    const val = inputRef.current?.value || "";
    if (op && val === op.clave) {
      patchUi({ view: destinoView, operResult: null, operadorActual: op.nombre, loginMode: null, loginErr: "" });
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
        <button className="btn ghost" onClick={() => patchUi({ loginMode: selectMode, loginErr: "" })}>
          Volver
        </button>
      </div>
    </div>
  );
}
