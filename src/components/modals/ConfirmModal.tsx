"use client";

import { useApp } from "@/context/AppContext";

export default function ConfirmModal({
  mensaje,
  onConfirm,
  confirmLabel = "Eliminar",
  danger = true,
}: {
  mensaje: string;
  onConfirm: () => void;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const { patchUi } = useApp();

  return (
    <div className="modal" style={{ maxWidth: 400 }}>
      <h3>Confirmar</h3>
      <div style={{ color: "var(--white)", fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>
        {mensaje || "¿Confirmas esta acción?"}
      </div>
      <div className="modal-actions">
        <button className="btn ghost" onClick={() => patchUi({ modal: null })}>
          Cancelar
        </button>
        <button
          className={danger ? "btn danger" : "btn"}
          onClick={() => {
            onConfirm();
            patchUi({ modal: null });
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
