-- La tabla servicios estaba completamente vacía en la base real. loadAll()
-- (ver dataAccess.ts) cae automáticamente a SERVICIOS_DEFAULT (helpers.ts)
-- cuando la tabla viene vacía, así que la UI siempre mostró un catálogo
-- normal — pero esos IDs nunca existieron de verdad en `servicios`, y
-- cita_servicios.servicio_id tiene FK a servicios(id). Resultado: cualquier
-- intento de agendar un servicio (Registrar Servicios Adicionales) fallaba
-- al vincular el servicio elegido con la cita. Sembrado con los mismos 9
-- registros que ya definía SERVICIOS_DEFAULT, on conflict do nothing.

insert into servicios (id, categoria, nombre, duracion_minutos, activo) values
  ('detailing-pequeno', 'Lavado Completo Detailing', 'Auto Pequeño', 30, true),
  ('detailing-mediano', 'Lavado Completo Detailing', 'Mediano / SUV / Pick-up', 30, true),
  ('detailing-xl', 'Lavado Completo Detailing', 'Auto XL', 30, true),
  ('tapiz', 'Servicios Adicionales', 'Limpieza de Tapiz (2 Corridas de Asientos)', 30, true),
  ('alfombra', 'Servicios Adicionales', 'Limpieza de Alfombra', 30, true),
  ('techo', 'Servicios Adicionales', 'Limpieza de Techo', 30, true),
  ('motor', 'Servicios Adicionales', 'Lavado de Motor', 30, true),
  ('chasis', 'Servicios Adicionales', 'Lavado de Chasis', 30, true),
  ('chasis-grafitado', 'Servicios Adicionales', 'Lavado de Chasis + Grafitado', 30, true)
on conflict (id) do nothing;
