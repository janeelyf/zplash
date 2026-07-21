import { deleteClientes, upsertClientes } from "@/lib/db";
import type { Cliente } from "@/types";
import { auditEntries, diffPorId, SIN_CAMBIOS, type CommitResult } from "./shared";

export function commitClientes(previous: Cliente[], siguientes: Cliente[] | undefined, usuario: string | null): CommitResult {
  if (!siguientes) return SIN_CAMBIOS;
  const { cambiados, eliminados } = diffPorId(previous, siguientes);
  const ops: Promise<boolean>[] = [];
  if (cambiados.length) ops.push(upsertClientes(cambiados));
  if (eliminados.length) ops.push(deleteClientes(eliminados));
  return { ops, auditoria: auditEntries("clientes", previous, cambiados, eliminados, usuario) };
}
