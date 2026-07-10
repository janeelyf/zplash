-- Corre esto una sola vez en el SQL Editor: agrega la columna glosa a la
-- tabla ingresos que ya existe. Permite etiquetar un ingreso con un texto
-- propio (p. ej. "Limpieza Completa" cuando el vehículo pasa por el túnel
-- como parte de un lavado completo/detailing registrado en Servicios
-- Adicionales) en vez de derivar la etiqueta solo de es_garantia/via_cupon.
alter table ingresos add column if not exists glosa text;
