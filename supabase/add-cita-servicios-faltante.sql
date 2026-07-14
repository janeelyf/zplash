-- La tabla cita_servicios está documentada en schema.sql y en la migración
-- drizzle/0002_fancy_scarecrow.sql, pero nunca quedó creada en la base real
-- (citas, horarios_agenda, servicios y bloqueos_agenda sí existían). Cada
-- carga de la app fallaba en loadAll() al intentar leerla — bloqueaba toda
-- la app, no solo la Agenda. Aplicado a mano por el mismo motivo que el
-- resto de esta carpeta (ver add-fecha-entrega.sql).

create table if not exists cita_servicios (
  id text primary key,
  cita_id text not null references citas(id) on delete cascade,
  servicio_id text not null references servicios(id) on delete cascade
);

alter table cita_servicios enable row level security;
