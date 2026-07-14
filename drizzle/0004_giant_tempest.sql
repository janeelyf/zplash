ALTER TABLE "citas" ALTER COLUMN "estado" SET DEFAULT 'agendado';--> statement-breakpoint
ALTER TABLE "ventas" ADD COLUMN "cita_id" text;--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cita_id_citas_id_fk" FOREIGN KEY ("cita_id") REFERENCES "public"."citas"("id") ON DELETE set null ON UPDATE no action;