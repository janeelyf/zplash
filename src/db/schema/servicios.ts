import { boolean, integer, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";


// Catálogo de servicios (fusiona el antiguo listado hardcodeado
// SERVICIOS_ADICIONALES): lo usa tanto ServiciosAdicionalesView (venta rápida
// en el POS) como la Agenda (duracionMinutos define el largo del cupo, igual
// que `procedimientos` en ConsultaPro). El precio NO vive acá — sigue en la
// tabla `precios` genérica, keyed por servicios.id, igual que hoy.
export const servicios = pgTable("servicios", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  categoria: text("categoria"),
  duracionMinutos: integer("duracion_minutos").notNull().default(30),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
});
