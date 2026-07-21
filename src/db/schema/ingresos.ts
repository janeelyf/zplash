import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";
import { clientes } from "./clientes";
import { cupones } from "./cupones";
import { citas } from "./citas";

export const ingresos = pgTable("ingresos", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id").references(() => clientes.id, { onDelete: "cascade" }),
  patente: text("patente").notNull(),
  nombre: text("nombre").notNull(),
  fecha: timestamptz("fecha").notNull().defaultNow(),
  planEstadoAlIngreso: text("plan_estado_al_ingreso").notNull(),
  creadoPor: text("creado_por"),
  esGarantia: boolean("es_garantia").notNull().default(false),
  viaCupon: boolean("via_cupon").notNull().default(false),
  cuponCodigo: text("cupon_codigo").references(() => cupones.codigo, { onDelete: "set null" }),
  glosa: text("glosa"),
  citaId: text("cita_id").references(() => citas.id, { onDelete: "set null" }),
});
