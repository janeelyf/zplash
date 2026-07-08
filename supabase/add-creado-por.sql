-- Corre esto una sola vez en el SQL Editor: agrega quien creo cada cliente
-- (operador, "Administrador" o "Carga masiva (Excel)") a la tabla clientes.
alter table clientes add column if not exists creado_por text;
