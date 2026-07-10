-- Corre esto una sola vez en el SQL Editor: agrega la columna de forma de
-- pago a movimientos_contables (Contabilidad > Ingresos), para registrar si
-- un ingreso pagado fue en efectivo o tarjeta.
alter table movimientos_contables add column if not exists metodo_pago text;
