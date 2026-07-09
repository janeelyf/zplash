-- Adjuntar un documento (boleta/factura escaneada) a un egreso/gasto.
alter table movimientos_contables add column if not exists documento_url text;
alter table movimientos_contables add column if not exists documento_nombre text;

-- Bucket de Storage donde se guardan los archivos adjuntos.
insert into storage.buckets (id, name, public)
values ('comprobantes-gastos', 'comprobantes-gastos', true)
on conflict (id) do nothing;

create policy "anon full access comprobantes-gastos" on storage.objects
  for all to anon
  using (bucket_id = 'comprobantes-gastos')
  with check (bucket_id = 'comprobantes-gastos');
