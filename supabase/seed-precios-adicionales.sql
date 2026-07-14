-- Carga los precios de "Servicios Adicionales" del flyer (14-07-2026) en la
-- tabla `precios`, keyed por servicios.id igual que hoy (ver precioServicio
-- en helpers.ts). Si la tabla `precios` ya tiene una fila (aunque sea en 0)
-- para alguno de estos ids, loadAll() usa esa fila entera y nunca cae a
-- PRECIOS_DEFAULT (ver dataAccess.ts), así que hay que sembrar esta tabla
-- directamente además de actualizar PRECIOS_DEFAULT. on conflict actualiza el
-- valor por si ya existía la fila con otro monto.

insert into precios (plan, normal, promo) values
  ('tapiz', 39990, 0),
  ('alfombra', 19990, 0),
  ('techo', 19990, 0),
  ('motor', 29990, 0),
  ('chasis-grafitado', 59990, 0)
on conflict (plan) do update set normal = excluded.normal, promo = excluded.promo;
