import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";


// Categoría seleccionable en el formulario de Producto (ver CategoriaProducto
// en @/types) — administrable desde Inventario → Categorías, mismo patrón que
// categorias_ingreso (sin "grupo": el inventario no tiene una estructura fija
// equivalente al EERR).
export const categoriasProducto = pgTable("categorias_producto", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  activa: boolean("activa").notNull().default(true),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
});
