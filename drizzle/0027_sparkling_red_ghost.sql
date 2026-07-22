CREATE TABLE "maquinarias" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"tipo" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"creado_por" text,
	CONSTRAINT "maquinarias_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "registros_mantencion" (
	"id" text PRIMARY KEY NOT NULL,
	"maquinaria_id" text NOT NULL,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL,
	"descripcion" text NOT NULL,
	"responsable" text,
	"costo" numeric,
	"vehiculos_desde_ultima" integer DEFAULT 0 NOT NULL,
	"notas" text,
	"creado_por" text
);
--> statement-breakpoint
ALTER TABLE "registros_mantencion" ADD CONSTRAINT "registros_mantencion_maquinaria_id_maquinarias_id_fk" FOREIGN KEY ("maquinaria_id") REFERENCES "public"."maquinarias"("id") ON DELETE cascade ON UPDATE no action;