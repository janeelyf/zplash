import { integer, jsonb, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";
import { pagosWebpay } from "./pagos-webpay";
import { ventas } from "./ventas";


// Desglose por ítem de una transacción Webpay: Transbank solo permite cobrar
// un monto único por buy_order, así que un carrito con varios ítems se cobra
// como una sola transacción (`pagosWebpay.monto` = suma) y acá queda el
// detalle para poder aplicar el efecto de cada ítem por separado en
// /api/pagos/webpay/retorno (extender plan, crear una venta por ítem, etc).
export const pagosWebpayItems = pgTable("pagos_webpay_items", {
  id: text("id").primaryKey(), // `${buyOrder}-${index}`
  buyOrder: text("buy_order")
    .notNull()
    .references(() => pagosWebpay.buyOrder, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(), // "plan_nuevo" | "renovacion" | "servicio" | "lavado_unico" | "pack_empresa"
  servicioId: text("servicio_id"), // solo si tipo = "servicio"
  nombre: text("nombre").notNull(), // snapshot del nombre al momento del cobro
  monto: numeric("monto", { mode: "number" }).notNull(),
  ventaId: text("venta_id").references(() => ventas.id, { onDelete: "set null" }),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
  // Columnas usadas solo cuando tipo = "pack_empresa": llevan el dato de
  // facturación/flota ingresado en el checkout a través del viaje de ida y
  // vuelta a Transbank, hasta que /api/pagos/webpay/retorno los aplica (ver
  // aplicarPagoPackEmpresa en @/lib/pagos).
  tipoDocumento: text("tipo_documento"),
  razonSocial: text("razon_social"),
  rut: text("rut"),
  direccion: text("direccion"),
  giro: text("giro"),
  // Email de quien compró — llega desde el checkout, viaja hasta acá igual
  // que el resto de estos campos, y aplicarPagoPackEmpresa lo copia a los
  // cupones/venta resultantes para poder mostrarlos en Mi Cuenta.
  email: text("email"),
  cantidadCupones: integer("cantidad_cupones"),
  patentesAutorizadas: jsonb("patentes_autorizadas").$type<string[]>(),
  // Nombre de lote que el propio cliente le pone a su compra (ej. "Lavados
  // rentacar SALFA Mayo") para reconocerlo después en Mi Cuenta y en el
  // panel B2B/Tickets/Dsctos — si lo deja vacío, aplicarPagoPackEmpresa cae
  // a razonSocial o "Pack Empresa Web" (mismo fallback de siempre).
  nombreLote: text("nombre_lote"),
});
