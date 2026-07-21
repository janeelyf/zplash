-- Custom SQL migration file, put your code below! --
UPDATE "categorias_insumo" SET "nombre" = UPPER("nombre");
--> statement-breakpoint
UPDATE "categorias_producto" SET "nombre" = UPPER("nombre");
