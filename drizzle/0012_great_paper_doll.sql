CREATE TABLE "categorias_ingreso" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categorias_ingreso_nombre_unique" UNIQUE("nombre")
);
