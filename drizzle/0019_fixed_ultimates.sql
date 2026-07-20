CREATE TABLE "insumos" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"categoria" text DEFAULT 'otro' NOT NULL,
	"valor_compra" numeric DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"stock_min" integer DEFAULT 0 NOT NULL,
	"stock_max" integer DEFAULT 0 NOT NULL,
	"proveedor_id" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"creado_por" text
);
--> statement-breakpoint
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE set null ON UPDATE no action;