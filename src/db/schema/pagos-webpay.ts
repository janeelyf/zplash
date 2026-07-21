import { integer, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";
import { ventas } from "./ventas";


// Ciclo de vida de una transacción Webpay Plus iniciada desde /pagar. A
// diferencia del webhook de WooCommerce (que solo sincroniza pedidos que un
// tercero ya cobró), acá ZPlash es quien habla directo con Transbank: no se
// debe crear una fila en `ventas` hasta que Transaction.commit() confirme el
// pago (response_code === 0) en /api/pagos/webpay/retorno.
export const pagosWebpay = pgTable("pagos_webpay", {
  buyOrder: text("buy_order").primaryKey(), // máx 26 caracteres (límite Transbank)
  sessionId: text("session_id").notNull(),
  patente: text("patente").notNull(),
  // "plan_nuevo" | "renovacion" | "servicio" | "lavado_unico" si la compra
  // tenía un solo ítem (se sigue llenando igual que antes, por legibilidad);
  // "carrito" si tenía 2+ ítems — ver desglose en `pagosWebpayItems`.
  tipo: text("tipo").notNull(),
  servicioId: text("servicio_id"), // solo si tipo = "servicio" y la compra tenía un solo ítem
  monto: numeric("monto", { mode: "number" }).notNull(), // monto total cobrado a Transbank (suma de todos los ítems)
  estado: text("estado").notNull().default("iniciada"), // iniciada|aprobada|rechazada|anulada
  token: text("token"),
  authorizationCode: text("authorization_code"),
  responseCode: integer("response_code"),
  // Siempre null desde que existe `pagosWebpayItems`: la venta asociada a
  // cada ítem se registra en `pagosWebpayItems.ventaId`, no acá, para no
  // tener dos fuentes de verdad cuando una compra tiene varios ítems.
  ventaId: text("venta_id").references(() => ventas.id, { onDelete: "set null" }),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
  actualizadoEn: timestamptz("actualizado_en"),
});
