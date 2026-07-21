import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";

export const categoriasGasto = pgTable("categorias_gasto", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  grupo: text("grupo").notNull(),
  activa: boolean("activa").notNull().default(true),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
});
