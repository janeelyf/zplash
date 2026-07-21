import { numeric, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";

export const movimientosContables = pgTable("movimientos_contables", {
  id: text("id").primaryKey(),
  tipo: text("tipo").notNull(),
  fecha: timestamptz("fecha").notNull().defaultNow(),
  descripcion: text("descripcion").notNull(),
  categoria: text("categoria"),
  contraparte: text("contraparte"),
  rutProveedor: text("rut_proveedor"),
  numeroFactura: text("numero_factura"),
  tipoDocumento: text("tipo_documento"),
  documentoUrl: text("documento_url"),
  documentoNombre: text("documento_nombre"),
  monto: numeric("monto", { mode: "number" }).notNull().default(0),
  estado: text("estado").notNull().default("pendiente"),
  metodoPago: text("metodo_pago"),
  notas: text("notas"),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
  creadoPor: text("creado_por"),
  fechaPago: timestamptz("fecha_pago"),
  // Solo presente en filas generadas automáticamente desde una Venta (ver
  // movimientoContableDesdeVenta en @/lib/helpers). Sin FK estricta a
  // ventas.id para no bloquear el insert si algún día se borra la venta.
  ventaId: text("venta_id"),
});
