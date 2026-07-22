import type { Ingreso, Maquinaria, RegistroMantencion } from "@/types";

/** Cantidad de Ingreso (vehículos que pasaron por el túnel) entre la última
 * mantención registrada para `maquinaria` (o su `creadoEn` si todavía no
 * tiene ninguna) y `hasta` — se calcula al guardar un RegistroMantencion
 * nuevo (ver RegistrosMantencionTab) para dejar registro de cuánto uso
 * acumuló la máquina desde el mantenimiento anterior, sin necesitar un
 * contador aparte que haya que mantener sincronizado a mano. */
export function vehiculosDesdeUltimaMantencion(
  maquinaria: Pick<Maquinaria, "id" | "creadoEn">,
  registros: RegistroMantencion[],
  ingresos: Pick<Ingreso, "fecha">[],
  hasta: string
): number {
  const anteriores = registros.filter((r) => r.maquinariaId === maquinaria.id && r.fecha < hasta);
  const desde = anteriores.reduce((max, r) => (r.fecha > max ? r.fecha : max), maquinaria.creadoEn);
  return ingresos.filter((i) => i.fecha > desde && i.fecha <= hasta).length;
}
