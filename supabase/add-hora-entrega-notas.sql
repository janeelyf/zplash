-- Corre esto una sola vez en el SQL Editor: agrega hora de entrega y notas
-- a la tabla ventas, usadas por el registro de Servicios Adicionales.
alter table ventas add column if not exists hora_entrega text;
alter table ventas add column if not exists notas text;
