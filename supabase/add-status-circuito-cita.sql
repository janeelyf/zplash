-- Agrega citas.cita_id -> ventas y expande el enum de citas.estado (guardado
-- como text, sin CHECK) para reflejar el circuito interno del vehículo:
-- agendado -> recibido -> en_limpieza -> listo_entrega -> retirado, con
-- cancelada/no_asistio como salidas fuera de ese camino feliz.
--
-- Aplicado a mano contra el pooler de Supabase (ver nota en
-- add-fecha-entrega.sql sobre por qué "npm run db:migrate" no sirve acá).

alter table ventas add column if not exists cita_id text references citas(id) on delete set null;

alter table citas alter column estado set default 'agendado';

-- Migra los valores antiguos de citas ya guardadas al nuevo vocabulario.
update citas set estado = 'agendado' where estado in ('pendiente', 'confirmada');
update citas set estado = 'listo_entrega' where estado = 'completada';
-- cancelada y no_asistio ya existían con el mismo nombre: sin cambios.
