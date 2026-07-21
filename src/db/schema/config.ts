import { boolean, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";


// Tabla "singleton" (una sola fila, id siempre true) para configuración global.
// horario_operador_*: bloqueo horario del módulo Operador (ver
// ConfigGlobal/dentroDeHorarioOperador) — fuera de este rango, un perfil sin
// acceso a Configuración no puede registrar el ingreso de un vehículo.
// festivos: fechas YYYY-MM-DD que usan el horario de fin de semana.
export const config = pgTable("config", {
  id: boolean("id").primaryKey().default(true),
  pinAdmin: text("pin_admin").notNull().default("1234"),
  horarioOperadorSemanaInicio: text("horario_operador_semana_inicio").notNull().default("08:25"),
  horarioOperadorSemanaFin: text("horario_operador_semana_fin").notNull().default("20:15"),
  horarioOperadorFindeInicio: text("horario_operador_finde_inicio").notNull().default("09:55"),
  horarioOperadorFindeFin: text("horario_operador_finde_fin").notNull().default("19:15"),
  festivos: jsonb("festivos").$type<string[]>().notNull().default([]),
  // Días de vigencia de los tickets de un Pack Empresa (ver PACKS_EMPRESA en
  // helpers.ts) desde su fecha de compra/generación — editable en Web
  // Settings, a propósito NO amarrado a los 90 días fijos de otros productos.
  vigenciaDiasPackEmpresa: integer("vigencia_dias_pack_empresa").notNull().default(365),
  // Escala de precio de renovación preferencial por visitas para clientes
  // Local, keyed por plan (ver TramoRenovacionLocal/precioRenovacionLocal en
  // @/types y @/lib/helpers).
  tramosRenovacionLocal: jsonb("tramos_renovacion_local")
    .$type<Record<string, { id: string; visitasMin: number; visitasMax: number | null; precio: number }[]>>()
    .notNull()
    .default({}),
});
