-- Canal editable para Ingresos: antes las categorías vivían hardcodeadas en
-- MovimientoContableTab.tsx (CATEGORIAS_INGRESO = ["Servicios de Lavado /
-- Túnel", "Otros"]). Ahora viven en esta tabla y son editables desde
-- Configuración → Categorías de ingreso (canal), sin depender de un deploy.
--
-- A diferencia de categorias_gasto, no tiene "grupo": el EERR hoy no
-- desglosa los ingresos de explotación por canal, solo los suma (ver
-- EERRTab.tsx).
--
-- Sin policy "anon full access": el navegador nunca usa PostgREST, todo pasa
-- por Server Actions con DATABASE_URL (que se salta RLS) — ver
-- supabase/restrict-anon-rls.sql. RLS habilitada y sin políticas para anon
-- es acceso denegado por defecto, mismo criterio que el resto de las tablas.

create table if not exists categorias_ingreso (
  id text primary key,
  nombre text not null unique,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

insert into categorias_ingreso (id, nombre) values
  ('ci-tunel', 'Servicios de Lavado / Túnel'),
  ('ci-otros', 'Otros')
on conflict (id) do nothing;

alter table categorias_ingreso enable row level security;

notify pgrst, 'reload schema';
