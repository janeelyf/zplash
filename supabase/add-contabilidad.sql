-- Corre esto una sola vez en el SQL Editor: agrega la tabla del modulo
-- de Contabilidad (ingresos, egresos, cuentas por cobrar y por pagar).
create table if not exists movimientos_contables (
  id text primary key,
  tipo text not null,
  fecha timestamptz not null default now(),
  descripcion text not null,
  categoria text,
  contraparte text,
  monto numeric not null default 0,
  estado text not null default 'pendiente',
  notas text,
  creado_en timestamptz not null default now(),
  creado_por text
);
create index if not exists movimientos_contables_fecha_idx on movimientos_contables (fecha desc);
create index if not exists movimientos_contables_tipo_idx on movimientos_contables (tipo);

alter table movimientos_contables enable row level security;
create policy "anon full access" on movimientos_contables for all to anon using (true) with check (true);
