-- La tabla citas real tenía 3 columnas de un diseño anterior (una cita con
-- un solo servicio) que ya no existen en schema.ts desde que se adoptó la
-- tabla puente cita_servicios (varios servicios por cita): servicio_id,
-- servicio_nombre (NOT NULL, sin default) y precio. El código actual nunca
-- las llena, así que cada INSERT/UPSERT a citas violaba la restricción
-- NOT NULL de servicio_nombre y fallaba — y como ventas.cita_id referencia
-- citas(id), el INSERT de ventas fallaba en cascada por la FK cuando la
-- cita asociada nunca llegó a crearse. Bloqueaba el registro de CUALQUIER
-- servicio adicional. Tabla confirmada vacía (0 filas) antes de aplicar,
-- sin riesgo de pérdida de datos.

alter table citas drop column if exists servicio_id;
alter table citas drop column if exists servicio_nombre;
alter table citas drop column if exists precio;
