-- Custom SQL migration file, put your code below! --
INSERT INTO "destinos_inventario" ("id", "nombre", "es_bodega", "activo") VALUES
	('di_bodega', 'Bodega', true, true),
	('di_vending_1', 'Vending 1', false, true),
	('di_vending_2', 'Vending 2', false, true),
	('di_vending_snacks', 'Vending Snacks', false, true),
	('di_vending_bebidas', 'Vending Bebidas', false, true),
	('di_vending_cafe', 'Vending Café', false, true)
ON CONFLICT ("id") DO NOTHING;
