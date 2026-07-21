import { integer, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";
import { suscripcionesOneclick } from "./suscripciones-oneclick";
import { ventas } from "./ventas";


// Cada intento de cobro mensual (automático vía cron, primer cobro tras
// inscribir, o manual desde ClienteInfoModal) contra una suscripción activa.
// A propósito NO hay unique(suscripcionId, cicloYm): un ciclo puede tener
// varias filas "rechazada" (reintentos), pero cobrarSuscripcion() en
// @/lib/pagos revisa antes de cobrar que no exista ya una "aprobada" para
// ese ciclo, para no cobrar dos veces un mismo mes.
export const cobrosOneclick = pgTable("cobros_oneclick", {
  id: text("id").primaryKey(), // buyOrder: se usa como parent y child buy_order
  suscripcionId: text("suscripcion_id")
    .notNull()
    .references(() => suscripcionesOneclick.id, { onDelete: "cascade" }),
  cicloYm: text("ciclo_ym").notNull(), // "YYYY-MM"
  monto: numeric("monto", { mode: "number" }).notNull(),
  estado: text("estado").notNull(), // aprobada|rechazada
  responseCode: integer("response_code"),
  authorizationCode: text("authorization_code"),
  ventaId: text("venta_id").references(() => ventas.id, { onDelete: "set null" }),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
});
