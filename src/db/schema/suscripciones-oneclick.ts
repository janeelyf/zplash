import { pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";
import { clientes } from "./clientes";


// Tarjeta inscrita en Oneclick Mall para renovación automática mensual. Una
// sola fila por patente (username exigido por Transbank, usamos la patente
// normalizada). tokenInscripcion solo se usa mientras está "pendiente"
// (correlaciona el callback de MallInscription.finish con esta fila).
export const suscripcionesOneclick = pgTable("suscripciones_oneclick", {
  id: text("id").primaryKey(),
  patente: text("patente").notNull(),
  clienteId: text("cliente_id").references(() => clientes.id, { onDelete: "set null" }),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  tokenInscripcion: text("token_inscripcion"),
  tbkUser: text("tbk_user"),
  cardTipo: text("card_tipo"),
  cardUltimosDigitos: text("card_ultimos_digitos"),
  estado: text("estado").notNull().default("pendiente"), // pendiente|activa|suspendida|cancelada
  proximoCobro: timestamptz("proximo_cobro"),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
  actualizadoEn: timestamptz("actualizado_en"),
});
