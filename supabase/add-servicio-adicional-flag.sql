-- Corre esto una sola vez en el SQL Editor: agrega la marca que identifica
-- las ventas creadas desde el registro de Servicios Adicionales (incluye
-- servicios de la lista y servicios personalizados con monto libre).
alter table ventas add column if not exists es_servicio_adicional boolean not null default false;
