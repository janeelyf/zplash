"use client";

import { useApp } from "@/context/AppContext";
import OperadorFoundResult from "@/components/OperadorFoundResult";
import OperadorNotFoundResult from "@/components/OperadorNotFoundResult";

export default function OperadorResult({ clearPlate }: { clearPlate: () => void }) {
  const { ui } = useApp();
  const r = ui.operResult;
  if (!r) return null;
  if (r.found) return <OperadorFoundResult cliente={r.cliente} clearPlate={clearPlate} />;
  return <OperadorNotFoundResult plate={r.plate} clearPlate={clearPlate} />;
}
