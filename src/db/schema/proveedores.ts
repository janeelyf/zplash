import { pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";


// Proveedor de productos de inventario, distinto de `empresas` (esa es para
// facturación de compra/venta) — catálogo simple referenciado desde
// `productos.proveedor_id` como proveedor preferente.
export const proveedores = pgTable("proveedores", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  rut: text("rut"),
  telefono: text("telefono"),
  email: text("email"),
  direccion: text("direccion"),
  contacto: text("contacto"),
  emailVendedor: text("email_vendedor"),
  telefonoVendedor: text("telefono_vendedor"),
  emailComprobantes: text("email_comprobantes"),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
  creadoPor: text("creado_por"),
});
