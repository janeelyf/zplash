-- Custom SQL migration file, put your code below! --
INSERT INTO "categorias_insumo" ("id", "nombre", "activa") VALUES
	('ci_limpieza', 'Limpieza', true),
	('ci_bano_aseo', 'Baño y Aseo', true),
	('ci_oficina', 'Oficina', true),
	('ci_otro', 'Otro', true)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
UPDATE "insumos" SET "categoria_id" = CASE "categoria"
	WHEN 'limpieza' THEN 'ci_limpieza'
	WHEN 'bano_aseo' THEN 'ci_bano_aseo'
	WHEN 'oficina' THEN 'ci_oficina'
	ELSE 'ci_otro'
END
WHERE "categoria_id" IS NULL;
