import type { AuditoriaEntrada, TablaAuditada } from "@/types";

// Compara contra el objeto/id previo por referencia: cada acción de la app
// construye objetos NUEVOS solo para las filas que cambiaron y reutiliza la
// misma referencia para las filas que no tocó, así que esto detecta con
// precisión qué filas hay que insertar/actualizar/eliminar en Supabase, sin
// tener que reescribir la tabla completa en cada guardado.
export function diffPorId<T extends { id: string }>(previos: T[], siguientes: T[]) {
  const prevById = new Map(previos.map((x) => [x.id, x]));
  const nextIds = new Set(siguientes.map((x) => x.id));
  const cambiados = siguientes.filter((x) => prevById.get(x.id) !== x);
  const eliminados = previos.filter((x) => !nextIds.has(x.id)).map((x) => x.id);
  return { cambiados, eliminados };
}

// Arma las entradas de auditoría para una tabla a partir del mismo diff que
// ya se usa para decidir qué escribir en Supabase (ver diffPorId): una fila
// en `cambiados` es "insert" si no existía antes, "update" si sí; una fila
// en `eliminados` es "delete". No se llama a esto para perfiles/precios/
// categoriasGasto/config: quedan fuera del alcance de la auditoría a
// propósito (bajo riesgo/volumen).
export function auditEntries<T extends { id: string }>(
  tabla: TablaAuditada,
  previos: T[],
  cambiados: T[],
  eliminados: string[],
  usuario: string | null
): AuditoriaEntrada[] {
  const prevById = new Map(previos.map((x) => [x.id, x]));
  const entradas: AuditoriaEntrada[] = cambiados.map((row) => {
    const anterior = prevById.get(row.id);
    return {
      tabla,
      registroId: row.id,
      accion: anterior ? "update" : "insert",
      datosAnteriores: anterior ?? null,
      datosNuevos: row,
      usuario,
    };
  });
  for (const id of eliminados) {
    entradas.push({
      tabla,
      registroId: id,
      accion: "delete",
      datosAnteriores: prevById.get(id) ?? null,
      datosNuevos: null,
      usuario,
    });
  }
  return entradas;
}

/** Lo que cada commitX() le debe a commit() en AppContext.tsx: las promesas
 * de las Server Actions ya disparadas (para esperarlas todas con
 * Promise.all) y las entradas de auditoría a insertar si el guardado ok. */
export interface CommitResult {
  ops: Promise<boolean>[];
  auditoria: AuditoriaEntrada[];
}

export const SIN_CAMBIOS: CommitResult = { ops: [], auditoria: [] };
