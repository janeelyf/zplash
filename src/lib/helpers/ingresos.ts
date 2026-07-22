import type { Cliente, Ingreso } from "@/types";
import { inicioPeriodoPlan } from "./clientes";
import { fmtCLP, PRECIO_LAVADO_UNICO } from "./precios";
import { ahoraEnSantiago, fmtHora, todayStr } from "./fechas";

/** Si el cliente ya registró un ingreso hoy (para limitar a 1 pasada diaria por plan vigente). */
export function yaIngresoHoy(ingresos: Ingreso[], clienteId: string): boolean {
  const hoy = todayStr();
  return ingresos.some((i) => i.clienteId === clienteId && new Date(i.fecha).toDateString() === hoy);
}

export function ultimoIngresoCliente(ingresos: Ingreso[], clienteId: string): Ingreso | undefined {
  return ingresos
    .filter((i) => i.clienteId === clienteId)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
}

const HORAS_MIN_ENTRE_INGRESOS_PLAN = 24.5;
const HORAS_VENTANA_GARANTIA = 1;

export type EstadoReingresoPlan = "libre" | "garantia" | "bloqueado";

/**
 * Un vehículo con plan solo puede pasar 1 vez cada 24:30 horas. La garantía (repasar
 * el mismo lavado sin cobrar de nuevo) solo se puede hacer efectiva hasta 1 hora
 * después del ingreso anterior; pasada esa hora y hasta que se cumplan las 24:30
 * horas, el reingreso queda bloqueado (ni garantía ni pasada nueva, salvo pagando
 * un lavado único — ver `precioLavadoUnico`).
 */
export function estadoReingresoPlan(ingresos: Ingreso[], clienteId: string, ahora: Date = new Date()): EstadoReingresoPlan {
  const ultimo = ultimoIngresoCliente(ingresos, clienteId);
  if (!ultimo) return "libre";
  const msDesdeUltimo = ahora.getTime() - new Date(ultimo.fecha).getTime();
  if (msDesdeUltimo >= HORAS_MIN_ENTRE_INGRESOS_PLAN * 3600 * 1000) return "libre";
  if (msDesdeUltimo <= HORAS_VENTANA_GARANTIA * 3600 * 1000) return "garantia";
  return "bloqueado";
}

/** Hora a partir de la cual el vehículo vuelve a poder pasar (último ingreso + 24:30). */
export function proximoIngresoPermitido(ingresos: Ingreso[], clienteId: string): Date | undefined {
  const ultimo = ultimoIngresoCliente(ingresos, clienteId);
  if (!ultimo) return undefined;
  return new Date(new Date(ultimo.fecha).getTime() + HORAS_MIN_ENTRE_INGRESOS_PLAN * 3600 * 1000);
}

export function mensajeBloqueoReingreso(ingresos: Ingreso[], clienteId: string): string {
  const proximo = proximoIngresoPermitido(ingresos, clienteId);
  const hora = proximo ? fmtHora(proximo.toISOString()) : "";
  return `VEHICULO HIZO USO DEL SERVICIO TUNEL HACE MENOS DE 24 HORAS. PUEDE REINGRESAR A PARTIR DE LAS ${hora} HRS.`;
}

/**
 * Cantidad de ingresos del cliente dentro del período de plan vigente (30
 * días anclados a fechaContratacion, ver inicioPeriodoPlan) — no mes
 * calendario ni el total histórico acumulado en `cliente.visitas`.
 */
export function visitasPeriodoPlan(
  ingresos: Ingreso[],
  cliente: Pick<Cliente, "id" | "fechaContratacion">,
  ahora: Date = ahoraEnSantiago()
): number {
  const inicio = inicioPeriodoPlan(cliente.fechaContratacion, ahora);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 30);
  return ingresos.filter((i) => i.clienteId === cliente.id && new Date(i.fecha) >= inicio && new Date(i.fecha) < fin).length;
}

/**
 * Cantidad de ingresos del cliente durante su último período de plan pagado,
 * es decir los 30 días que terminan en `vencimiento` — a diferencia de
 * visitasPeriodoPlan (que usa `ahora` para ubicar el período vigente), acá el
 * cliente ya está vencido y el período relevante es el último que sí pagó,
 * no uno posterior sin pago. Eje "veces" de la promoción de reactivación de
 * plan vencido (ver precioReactivacionVencido en @/lib/helpers/precios).
 */
export function visitasUltimoPeriodoVencido(ingresos: Ingreso[], cliente: Pick<Cliente, "id" | "vencimiento">): number {
  if (!cliente.vencimiento) return 0;
  const fin = new Date(cliente.vencimiento);
  const inicio = new Date(fin);
  inicio.setDate(inicio.getDate() - 30);
  return ingresos.filter((i) => i.clienteId === cliente.id && new Date(i.fecha) >= inicio && new Date(i.fecha) < fin).length;
}

export function tipoIngreso(i: Ingreso): { label: string; cls: "ok" | "warn" | "bad" } {
  if (i.glosa) return { label: i.glosa, cls: "ok" };
  if (i.viaCupon) return { label: "Cupón", cls: "warn" };
  if (i.esGarantia) return { label: "Garantía", cls: "warn" };
  if (i.planEstadoAlIngreso === "bad") return { label: fmtCLP(PRECIO_LAVADO_UNICO), cls: "bad" };
  return { label: "Ingreso por plan", cls: "ok" };
}
