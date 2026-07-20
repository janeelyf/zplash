-- Corre esto una sola vez en el SQL Editor: permite el nuevo estado
-- "pagado_efectivo" en egresos (Contabilidad > Egresos/Gastos), para gastos
-- pagados directo desde caja en efectivo (no desde la cuenta corriente).
alter table movimientos_contables drop constraint if exists movimientos_contables_estado_check;
alter table movimientos_contables add constraint movimientos_contables_estado_check
  check (
    (tipo = 'egreso' and estado in ('pagado_cc', 'pagado_efectivo', 'x_rendir', 'pendiente_pago'))
    or (tipo <> 'egreso' and estado in ('pagado', 'pendiente'))
  );
