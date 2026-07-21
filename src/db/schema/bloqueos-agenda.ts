import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";


// Excepciones puntuales al horario habitual: un día completo bloqueado o un
// rango de horas específico dentro de un día.
export const bloqueosAgenda = pgTable("bloqueos_agenda", {
  id: text("id").primaryKey(),
  fecha: text("fecha").notNull(),
  todoElDia: boolean("todo_el_dia").notNull().default(true),
  horaInicio: text("hora_inicio"),
  horaFin: text("hora_fin"),
  motivo: text("motivo"),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
  creadoPor: text("creado_por"),
});
