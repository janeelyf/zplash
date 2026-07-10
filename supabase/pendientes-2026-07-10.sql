-- Corre esto una sola vez en el SQL Editor de Supabase: junta las migraciones
-- pendientes de aplicar a la base de datos (tabla "empresas" y columna
-- "icono" de perfiles). Es seguro volver a correrlo (usa IF NOT EXISTS).

-- 1) add-empresas.sql — tabla "empresas" (Administración > Empresas)
create table if not exists empresas (
  id text primary key,
  razon_social text not null,
  rut text not null unique,
  giro text,
  direccion text,
  telefono text,
  contacto_cliente_id text,
  contacto_nombre text,
  creado_en timestamptz not null default now(),
  creado_por text
);

alter table empresas enable row level security;
drop policy if exists "anon full access" on empresas;
create policy "anon full access" on empresas for all to anon using (true) with check (true);

-- 2) add-perfil-icono.sql — ícono/emoji opcional por perfil
alter table perfiles add column if not exists icono text;
