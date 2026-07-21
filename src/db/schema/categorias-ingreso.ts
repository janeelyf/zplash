import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";


// Canal seleccionable en el formulario de Ingresos (ver CategoriaIngreso en
// @/types) — sin "grupo": a diferencia de categorias_gasto, no está atada a
// la estructura fija del EERR.
export const categoriasIngreso = pgTable("categorias_ingreso", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  activa: boolean("activa").notNull().default(true),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
});
