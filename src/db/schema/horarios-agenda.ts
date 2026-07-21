import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";


// Horario semanal recurrente único para todo el negocio: a diferencia de
// ConsultaPro (horario por profesional), acá no hay "profesional" al que
// asignarle una cita — un lavadero atiende con capacidad de 1 cupo por
// horario. diaSemana: 0=domingo … 6=sábado.
export const horariosAgenda = pgTable("horarios_agenda", {
  id: text("id").primaryKey(),
  diaSemana: integer("dia_semana").notNull(),
  horaInicio: text("hora_inicio").notNull(),
  horaFin: text("hora_fin").notNull(),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
});
