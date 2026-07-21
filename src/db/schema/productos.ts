import { boolean, integer, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./columns";
import { categoriasProducto } from "./categorias-producto";
import { proveedores } from "./proveedores";


// Ítem de inventario. `codigo` es un identificador corto de 6 dígitos que
// asigna el sistema al crear el producto (ver generarCodigoProducto en
// helpers.ts) — no lo edita el usuario, a diferencia de `sku`, que es el
// nombre de fantasía con el que el producto se vende en la web/vending.
// `empaque_minimo` es la cantidad por caja/paquete del proveedor: las OC de
// reposición que se generen cuando el stock caiga bajo `stock_min` deben
// pedirse en múltiplos de este valor. `stock` es un valor editable a mano
// (sin historial de movimientos ni integración automática con Ventas
// todavía); stock_min/stock_max son la regla de reposición usada para
// alertar en InventarioTab cuando el stock actual cae bajo el mínimo.
export const productos = pgTable("productos", {
  id: text("id").primaryKey(),
  codigo: text("codigo").notNull().unique(),
  sku: text("sku").notNull().unique(),
  detalle: text("detalle").notNull(),
  categoriaId: text("categoria_id").references(() => categoriasProducto.id, { onDelete: "set null" }),
  valorCompra: numeric("valor_compra", { mode: "number" }).notNull().default(0),
  valorVenta: numeric("valor_venta", { mode: "number" }).notNull().default(0),
  stock: integer("stock").notNull().default(0),
  stockMin: integer("stock_min").notNull().default(0),
  stockMax: integer("stock_max").notNull().default(0),
  empaqueMinimo: integer("empaque_minimo").notNull().default(1),
  proveedorId: text("proveedor_id").references(() => proveedores.id, { onDelete: "set null" }),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
  creadoPor: text("creado_por"),
});
