import { pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";


// Reglas "aprendidas" para clasificar automáticamente futuras líneas de
// cartola: si la glosa contiene `id` (case-insensitive), se le asigna
// `categoria` al importar (ver importarCartola en @/lib/actions). `id` es el
// propio patrón (mismo criterio que `precios.plan`) para que enseñar una
// regla nueva sea un upsert simple, sin necesitar una columna unique aparte.
export const reglasConciliacion = pgTable("reglas_conciliacion", {
  id: text("id").primaryKey(),
  categoria: text("categoria").notNull(),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
});
