import { boolean, integer, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./shared";

// Máquina/equipo del túnel de lavado (ej. cepillos, secadores, bomba de
// agua) — catálogo administrable desde Libro de Mantención → Máquinas, mismo
// patrón que destinos_inventario.
export const maquinarias = pgTable("maquinarias", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  tipo: text("tipo"),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
  creadoPor: text("creado_por"),
});

// Registro de una mantención realizada a una maquinaria. `vehiculos_desde_ultima`
// se calcula al guardar (ver vehiculosDesdeUltimaMantencion en
// @/lib/helpers/mantencion) contando los ingresos entre la mantención
// anterior de esta misma máquina y la fecha de este registro — queda
// guardado como snapshot histórico en vez de recalcularse siempre, para que
// un registro viejo no cambie de valor si se agrega una mantención anterior
// a él más tarde.
export const registrosMantencion = pgTable("registros_mantencion", {
  id: text("id").primaryKey(),
  maquinariaId: text("maquinaria_id")
    .notNull()
    .references(() => maquinarias.id, { onDelete: "cascade" }),
  fecha: timestamptz("fecha").notNull().defaultNow(),
  descripcion: text("descripcion").notNull(),
  responsable: text("responsable"),
  costo: numeric("costo", { mode: "number" }),
  vehiculosDesdeUltima: integer("vehiculos_desde_ultima").notNull().default(0),
  notas: text("notas"),
  creadoPor: text("creado_por"),
});
