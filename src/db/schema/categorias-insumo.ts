import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";


// Categoría seleccionable en el formulario de Insumo (ver CategoriaInsumo en
// @/types) — administrable desde Inventario → Categorías, mismo patrón que
// categorias_producto.
export const categoriasInsumo = pgTable("categorias_insumo", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  activa: boolean("activa").notNull().default(true),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
});
