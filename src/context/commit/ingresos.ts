import { insertIngresos } from "@/lib/db";
import type { Ingreso } from "@/types";
import { auditEntries, SIN_CAMBIOS, type CommitResult } from "./shared";

// El historial de ingresos es de solo alta: nunca se actualiza ni se borra
// una fila ya guardada (a diferencia de clientes/ventas), así que acá basta
// con las filas cuyo id todavía no existía en `previous`, sin necesitar el
// diffPorId completo.
export function commitIngresos(previous: Ingreso[], siguientes: Ingreso[] | undefined, usuario: string | null): CommitResult {
  if (!siguientes) return SIN_CAMBIOS;
  const prevIds = new Set(previous.map((i) => i.id));
  const nuevos = siguientes.filter((i) => !prevIds.has(i.id));
  const ops: Promise<boolean>[] = [];
  if (nuevos.length) ops.push(insertIngresos(nuevos));
  return { ops, auditoria: auditEntries("ingresos", previous, nuevos, [], usuario) };
}
