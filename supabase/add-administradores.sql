-- Credenciales de ADMINISTRACIÓN por persona (Evelyn / Juan).
-- Juan es el gerente (es_gerente = true): puede cambiar la contraseña de
-- cualquiera; Evelyn solo puede cambiar la suya propia (regla en la app).
create table if not exists administradores (
  id text primary key,
  nombre text not null unique,
  clave text not null,
  es_gerente boolean not null default false
);

insert into administradores (id, nombre, clave, es_gerente) values
  ('adm1', 'Evelyn', '1234', false),
  ('adm2', 'Juan', '5678', true)
on conflict (id) do nothing;

alter table administradores enable row level security;

create policy "anon full access" on administradores for all to anon using (true) with check (true);
