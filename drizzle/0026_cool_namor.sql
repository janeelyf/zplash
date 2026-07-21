ALTER TABLE "movimientos_inventario" ADD COLUMN "folio" text NOT NULL;--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "destinos_bloqueados" jsonb DEFAULT '[]'::jsonb NOT NULL;