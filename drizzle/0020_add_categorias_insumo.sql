CREATE TABLE "categorias_insumo" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categorias_insumo_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
ALTER TABLE "insumos" ADD COLUMN "categoria_id" text;--> statement-breakpoint
ALTER TABLE "insumos" ADD CONSTRAINT "insumos_categoria_id_categorias_insumo_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_insumo"("id") ON DELETE set null ON UPDATE no action;