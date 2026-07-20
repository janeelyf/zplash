CREATE TABLE "cartola_movimientos" (
	"id" text PRIMARY KEY NOT NULL,
	"cuenta" text DEFAULT 'santander_empresa' NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"glosa" text NOT NULL,
	"cargo" numeric DEFAULT 0 NOT NULL,
	"abono" numeric DEFAULT 0 NOT NULL,
	"saldo" numeric,
	"numero_documento" text,
	"sucursal" text,
	"categoria" text,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"movimiento_contable_id" text,
	"notas" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"creado_por" text
);
--> statement-breakpoint
CREATE TABLE "reglas_conciliacion" (
	"id" text PRIMARY KEY NOT NULL,
	"categoria" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cartola_movimientos" ADD CONSTRAINT "cartola_movimientos_movimiento_contable_id_movimientos_contables_id_fk" FOREIGN KEY ("movimiento_contable_id") REFERENCES "public"."movimientos_contables"("id") ON DELETE set null ON UPDATE no action;