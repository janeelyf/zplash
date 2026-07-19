ALTER TABLE "config" ADD COLUMN "vigencia_dias_pack_empresa" integer DEFAULT 365 NOT NULL;--> statement-breakpoint
ALTER TABLE "cupones" ADD COLUMN "rut" text;--> statement-breakpoint
ALTER TABLE "cupones" ADD COLUMN "patentes_autorizadas" jsonb;--> statement-breakpoint
ALTER TABLE "pagos_webpay_items" ADD COLUMN "tipo_documento" text;--> statement-breakpoint
ALTER TABLE "pagos_webpay_items" ADD COLUMN "razon_social" text;--> statement-breakpoint
ALTER TABLE "pagos_webpay_items" ADD COLUMN "rut" text;--> statement-breakpoint
ALTER TABLE "pagos_webpay_items" ADD COLUMN "direccion" text;--> statement-breakpoint
ALTER TABLE "pagos_webpay_items" ADD COLUMN "giro" text;--> statement-breakpoint
ALTER TABLE "pagos_webpay_items" ADD COLUMN "cantidad_cupones" integer;--> statement-breakpoint
ALTER TABLE "pagos_webpay_items" ADD COLUMN "patentes_autorizadas" jsonb;