import { upsertPrecios } from "@/lib/db";
import type { Precios } from "@/types";
import { SIN_CAMBIOS, type CommitResult } from "./shared";

export function commitPrecios(siguientes: Precios | undefined): CommitResult {
  if (!siguientes) return SIN_CAMBIOS;
  return { ops: [upsertPrecios(siguientes)], auditoria: [] };
}
