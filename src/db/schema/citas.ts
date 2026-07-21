import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";
import { clientes } from "./clientes";


// Cita agendada desde el Registro de Servicio Adicional. duracionMinutos es
// la suma de los servicios ligados en `cita_servicios` (ver esa tabla) —
// snapshot al momento de agendar, así que si luego cambia la duración del
// catálogo la cita ya creada no se recalcula sola. La cita NO genera
// automáticamente una Venta/Ingreso: eso sigue siendo el mismo registro que
// ya hace ServiciosAdicionalesView al guardar.
export const citas = pgTable("citas", {
  id: text("id").primaryKey(),
  clienteId: text("cliente_id").references(() => clientes.id, { onDelete: "cascade" }),
  patente: text("patente").notNull(),
  nombre: text("nombre").notNull(),
  telefono: text("telefono"),
  fechaHora: timestamptz("fecha_hora").notNull(),
  duracionMinutos: integer("duracion_minutos").notNull(),
  estado: text("estado").notNull().default("agendado"),
  notas: text("notas"),
  origen: text("origen").notNull().default("interno"),
  creadoPor: text("creado_por"),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
});
