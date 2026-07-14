-- Agrega fecha_entrega a ventas, complemento de hora_entrega (ver
-- add-hora-entrega-notas.sql): permite que la fecha de entrega difiera de
-- la fecha de inicio del servicio (ventas.fecha / citas.fecha_hora).
--
-- Aplicado a mano contra el pooler de Supabase (igual que los demás
-- archivos de esta carpeta) porque "npm run db:migrate" falla: el
-- bookkeeping de drizzle.__drizzle_migrations quedó desincronizado con
-- drizzle/0001_kind_giant_man.sql y drizzle/0002_fancy_scarecrow.sql (sus
-- hashes registrados no calzan con el contenido actual de esos archivos),
-- así que drizzle-kit intenta re-ejecutar migraciones ya aplicadas y falla
-- con "relation already exists". Pendiente de reparar por separado.

alter table ventas add column if not exists fecha_entrega text;
