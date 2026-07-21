// Refleja supabase/schema.sql (documentación del DDL). Desde la adopción de
// drizzle-kit (ver supabase/adopt-drizzle-migrations.sql), los cambios de
// esquema se hacen acá y se generan/aplican con "npm run db:generate" +
// "npm run db:migrate" — ya no a mano en el SQL Editor de Supabase.

import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";

export const clientes = pgTable("clientes", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  patente: text("patente").notNull().unique(),
  telefono: text("telefono"),
  email: text("email"),
  vehiculo: text("vehiculo"),
  plan: text("plan"),
  tipoDocumento: text("tipo_documento"),
  razonSocial: text("razon_social"),
  rut: text("rut"),
  direccion: text("direccion"),
  giro: text("giro"),
  vencimiento: timestamptz("vencimiento"),
  fechaContratacion: timestamptz("fecha_contratacion"),
  origen: text("origen").notNull().default("LOCAL"),
  visitas: integer("visitas").notNull().default(0),
  ultimaVisita: timestamptz("ultima_visita"),
  ultimaRenovacion: timestamptz("ultima_renovacion"),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
  creadoPor: text("creado_por"),
});
