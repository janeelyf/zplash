CREATE TABLE "pagos_webpay_items" (
	"id" text PRIMARY KEY NOT NULL,
	"buy_order" text NOT NULL,
	"tipo" text NOT NULL,
	"servicio_id" text,
	"nombre" text NOT NULL,
	"monto" numeric NOT NULL,
	"venta_id" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pagos_webpay_items" ADD CONSTRAINT "pagos_webpay_items_buy_order_pagos_webpay_buy_order_fk" FOREIGN KEY ("buy_order") REFERENCES "public"."pagos_webpay"("buy_order") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos_webpay_items" ADD CONSTRAINT "pagos_webpay_items_venta_id_ventas_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."ventas"("id") ON DELETE set null ON UPDATE no action;