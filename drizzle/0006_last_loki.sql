ALTER TABLE "citas" DROP CONSTRAINT "citas_cliente_id_clientes_id_fk";
--> statement-breakpoint
ALTER TABLE "ingresos" DROP CONSTRAINT "ingresos_cliente_id_clientes_id_fk";
--> statement-breakpoint
ALTER TABLE "ventas" DROP CONSTRAINT "ventas_cliente_id_clientes_id_fk";
--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "horario_operador_semana_inicio" text DEFAULT '08:25' NOT NULL;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "horario_operador_semana_fin" text DEFAULT '20:15' NOT NULL;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "horario_operador_finde_inicio" text DEFAULT '09:55' NOT NULL;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "horario_operador_finde_fin" text DEFAULT '19:15' NOT NULL;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "festivos" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "ingresos" ADD COLUMN "cita_id" text;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_cita_id_citas_id_fk" FOREIGN KEY ("cita_id") REFERENCES "public"."citas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;