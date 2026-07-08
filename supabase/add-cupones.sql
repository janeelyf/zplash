-- Corre esto una sola vez en el SQL Editor: agrega la tabla de cupones
-- (Venta Empresa) y las columnas nuevas en ingresos para registrar
-- canjes de cupón.
create table if not exists cupones (
  id text primary key,
  codigo text not null unique,
  nombre_lote text not null,
  valor numeric not null default 0,
  fecha_caducidad timestamptz not null,
  usado boolean not null default false,
  patente_uso text,
  fecha_uso timestamptz,
  operador_uso text,
  creado_en timestamptz not null default now(),
  creado_por text
);
create index if not exists cupones_codigo_idx on cupones (codigo);

alter table ingresos add column if not exists via_cupon boolean not null default false;
alter table ingresos add column if not exists cupon_codigo text;

alter table cupones enable row level security;
create policy "anon full access" on cupones for all to anon using (true) with check (true);
