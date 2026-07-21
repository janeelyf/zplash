import { pgTable, text } from "drizzle-orm/pg-core";
import { citas } from "./citas";
import { servicios } from "./servicios";


// Servicios ligados a una cita (equivalente a cita_procedimientos en
// ConsultaPro): una cita puede incluir varios servicios del catálogo a la
// vez (ej. Lavado Detailing + Limpieza de Tapiz), en vez de guardar los
// nombres concatenados en un string. onDelete cascade en servicioId sigue el
// mismo criterio que ConsultaPro: los servicios del catálogo casi nunca se
// borran de verdad (se desactivan con `activo`), así que perder el vínculo
// histórico si alguna vez se borra un servicio es un caso aceptado.
export const citaServicios = pgTable("cita_servicios", {
  id: text("id").primaryKey(),
  citaId: text("cita_id")
    .notNull()
    .references(() => citas.id, { onDelete: "cascade" }),
  servicioId: text("servicio_id")
    .notNull()
    .references(() => servicios.id, { onDelete: "cascade" }),
});
