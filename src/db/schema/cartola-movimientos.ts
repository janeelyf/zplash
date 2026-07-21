import { numeric, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";
import { movimientosContables } from "./movimientos-contables";


// Línea individual importada de una cartola bancaria (hoy solo Santander
// Empresa, vía PDF de "Cartolas históricas" de Office Banking — ver
// @/lib/cartolaParser). `movimientoContableId` liga esta línea a un
// movimiento ya registrado en la app cuando el usuario confirma el vínculo
// manualmente (ver ConciliacionBancariaTab); nunca se linkea solo.
export const cartolaMovimientos = pgTable("cartola_movimientos", {
  id: text("id").primaryKey(),
  cuenta: text("cuenta").notNull().default("santander_empresa"),
  fecha: timestamptz("fecha").notNull(),
  glosa: text("glosa").notNull(),
  cargo: numeric("cargo", { mode: "number" }).notNull().default(0),
  abono: numeric("abono", { mode: "number" }).notNull().default(0),
  saldo: numeric("saldo", { mode: "number" }),
  numeroDocumento: text("numero_documento"),
  sucursal: text("sucursal"),
  // Etiqueta libre (ej. "Ingreso Tarjeta POS (GETNET)"), asignada por una
  // regla de @/lib/db#reglasConciliacion o a mano en la UI. Taxonomía propia,
  // sin relación con `movimientosContables.categoria` (esa sigue el EERR).
  categoria: text("categoria"),
  estado: text("estado").notNull().default("pendiente"), // pendiente | conciliado | ignorado
  movimientoContableId: text("movimiento_contable_id").references(() => movimientosContables.id, { onDelete: "set null" }),
  notas: text("notas"),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
  creadoPor: text("creado_por"),
});
