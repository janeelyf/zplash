import { bigserial, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";


// Log de auditoría: quién modificó qué fila y cuándo, para las tablas que
// mueven dinero o datos de clientes (clientes/ingresos/ventas/empresas/
// cupones/movimientos_contables/citas). Se escribe a nivel de aplicación (ver
// commit() en AppContext.tsx), no con triggers: esta app no usa Supabase
// Auth/RLS, toda la escritura pasa por una sola conexión server-side
// (DATABASE_URL) que no sabe qué perfil está logueado a nivel de DB. Por eso
// NO captura ediciones manuales hechas directo en el SQL Editor de Supabase.
export const auditoria = pgTable("auditoria", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  tabla: text("tabla").notNull(),
  registroId: text("registro_id").notNull(),
  accion: text("accion").notNull(),
  datosAnteriores: jsonb("datos_anteriores"),
  datosNuevos: jsonb("datos_nuevos"),
  usuario: text("usuario"),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
});
