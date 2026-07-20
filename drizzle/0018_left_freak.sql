CREATE TABLE "categorias_producto" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categorias_producto_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "codigo" text;
--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "empaque_minimo" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "productos" RENAME COLUMN "nombre" TO "detalle";
--> statement-breakpoint
ALTER TABLE "productos" RENAME COLUMN "categoria" TO "categoria_id";
--> statement-breakpoint
UPDATE "productos" SET "codigo" = lpad(floor(random() * 900000 + 100000)::text, 6, '0') WHERE "codigo" IS NULL;
--> statement-breakpoint
ALTER TABLE "productos" ALTER COLUMN "codigo" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_codigo_unique" UNIQUE("codigo");
--> statement-breakpoint
UPDATE "productos" SET "categoria_id" = NULL;
--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_categorias_producto_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_producto"("id") ON DELETE set null ON UPDATE no action;
