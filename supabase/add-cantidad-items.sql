-- Un vehículo = un registro: registrar() en ServiciosAdicionalesView ahora
-- guarda UNA sola Venta por registro aunque se hayan elegido varios
-- servicios (antes creaba una fila por servicio). cantidad_items guarda
-- cuántos servicios se combinaron en esa fila, para no perder la métrica
-- "cantidad de servicios vendidos" en Cierre de Caja (ver
-- serviciosAdicionalesRow.cantidad en CierreTab.tsx). Default 1 para que
-- las filas ya guardadas (una por servicio) sigan representando 1 servicio
-- cada una, sin necesidad de backfill.

alter table ventas add column if not exists cantidad_items integer not null default 1;
