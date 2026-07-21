CREATE TABLE "destinos_inventario" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"es_bodega" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "destinos_inventario_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "movimientos_inventario" (
	"id" text PRIMARY KEY NOT NULL,
	"producto_id" text NOT NULL,
	"origen_id" text NOT NULL,
	"destino_id" text NOT NULL,
	"cantidad" integer NOT NULL,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL,
	"notas" text,
	"creado_por" text
);
--> statement-breakpoint
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_origen_id_destinos_inventario_id_fk" FOREIGN KEY ("origen_id") REFERENCES "public"."destinos_inventario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_destino_id_destinos_inventario_id_fk" FOREIGN KEY ("destino_id") REFERENCES "public"."destinos_inventario"("id") ON DELETE restrict ON UPDATE no action;