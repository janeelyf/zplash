-- Corre esto una sola vez en el SQL Editor de Supabase.
-- Soporte para el módulo Web Settings: banner (imagen) por servicio/SKU.

-- Columna para guardar la URL pública del banner de cada servicio (ver
-- src/db/schema.ts, tabla servicios). Aditivo, no rompe filas existentes.
alter table servicios add column if not exists imagen text;

-- Bucket de Storage donde se suben las imágenes de banner por servicio,
-- subidas desde Web Settings (ver subirBannerServicio en src/lib/dataAccess.ts).
-- Mismo patrón que el bucket comprobantes-gastos: público, con acceso total
-- para el rol anon porque esta app no usa Supabase Auth (ver comentario en
-- supabase/schema.sql sobre RLS y la anon key).
insert into storage.buckets (id, name, public)
values ('banners-servicios', 'banners-servicios', true)
on conflict (id) do nothing;

drop policy if exists "anon full access banners-servicios" on storage.objects;
create policy "anon full access banners-servicios" on storage.objects
  for all to anon
  using (bucket_id = 'banners-servicios')
  with check (bucket_id = 'banners-servicios');
