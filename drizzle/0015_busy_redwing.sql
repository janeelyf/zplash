CREATE TABLE "productos" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"nombre" text NOT NULL,
	"categoria" text,
	"valor_compra" numeric DEFAULT 0 NOT NULL,
	"valor_venta" numeric DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"stock_min" integer DEFAULT 0 NOT NULL,
	"stock_max" integer DEFAULT 0 NOT NULL,
	"proveedor_id" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"creado_por" text,
	CONSTRAINT "productos_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "proveedores" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"rut" text,
	"telefono" text,
	"email" text,
	"direccion" text,
	"contacto" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"creado_por" text
);
--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE set null ON UPDATE no action;