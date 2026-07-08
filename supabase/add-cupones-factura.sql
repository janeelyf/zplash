-- Corre esto una sola vez en el SQL Editor: agrega el numero de cupon
-- dentro del lote (ej. 1/10) y los datos de facturacion para la venta
-- del lote de cupones (Venta Empresa).
alter table cupones add column if not exists numero_lote integer not null default 1;
alter table cupones add column if not exists total_lote integer not null default 1;

alter table ventas add column if not exists tipo_documento text;
alter table ventas add column if not exists razon_social text;
alter table ventas add column if not exists rut text;
alter table ventas add column if not exists direccion text;
alter table ventas add column if not exists giro text;
