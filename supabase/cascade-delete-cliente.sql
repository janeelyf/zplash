-- Al eliminar un Cliente desde Gerencia (ClientesTab), las FK de
-- ingresos/ventas/citas hacia clientes usaban ON DELETE SET NULL: el
-- registro no se borraba, solo perdía el vínculo, y como nombre/patente
-- quedan denormalizados en esas tablas seguían apareciendo (y
-- contabilizándose) íntegros en Estadísticas e Historial de Ingresos como
-- si el cliente nunca se hubiera eliminado. Cambiado a ON DELETE CASCADE:
-- borrar un Cliente ahora borra en cadena sus ingresos, ventas y citas.
--
-- Aplicado a mano contra el pooler de Supabase (igual que los demás
-- archivos de esta carpeta, ver nota en add-fecha-entrega.sql sobre por qué
-- "npm run db:migrate" no sirve acá).

alter table ingresos drop constraint if exists ingresos_cliente_id_fkey;
alter table ingresos add constraint ingresos_cliente_id_fkey
  foreign key (cliente_id) references clientes(id) on delete cascade;

alter table ventas drop constraint if exists ventas_cliente_id_fkey;
alter table ventas add constraint ventas_cliente_id_fkey
  foreign key (cliente_id) references clientes(id) on delete cascade;

alter table citas drop constraint if exists citas_cliente_id_fkey;
-- citas se creó originalmente vía drizzle-kit (antes del desync de
-- db:migrate), así que además de/en vez de "citas_cliente_id_fkey" puede
-- tener la FK con el nombre que genera drizzle por defecto. Si no se quita,
-- queda una FK vieja en SET NULL corriendo en paralelo a la nueva en
-- CASCADE, y como los triggers de FK se disparan en orden alfabético de
-- nombre, "_clientes_id_fk" (con 'c') gana la carrera contra "_fkey" (con
-- 'f') y la fila solo se desvincula en vez de borrarse.
alter table citas drop constraint if exists citas_cliente_id_clientes_id_fk;
alter table citas add constraint citas_cliente_id_fkey
  foreign key (cliente_id) references clientes(id) on delete cascade;

-- Limpieza única de huérfanos ya existentes: ingresos/ventas cuyo cliente
-- ya fue borrado antes de este cambio (cliente_id quedó en NULL por el
-- SET NULL anterior). Se excluyen los flujos "sin cliente" intencionales
-- (Sin registro / Cupón · .../ Venta Empresa · ...), que nunca tuvieron
-- cliente asociado y no deben tocarse. Verificado antes de correr esto:
-- 8 ingresos + 10 ventas huérfanas reales, 0 citas huérfanas.
delete from ingresos
  where cliente_id is null
  and nombre <> 'Sin registro'
  and nombre not like 'Cupón ·%'
  and nombre not like 'Venta Empresa ·%';

delete from ventas
  where cliente_id is null
  and nombre <> 'Sin registro'
  and nombre not like 'Cupón ·%'
  and nombre not like 'Venta Empresa ·%';
