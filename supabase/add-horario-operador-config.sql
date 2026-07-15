-- Agrega a "config" las columnas del horario de bloqueo del módulo Operador
-- y sus festivos (ver ConfigGlobal/dentroDeHorarioOperador en @/lib/helpers,
-- y HorarioOperador en ConfigTab.tsx): fuera de este horario, un perfil sin
-- acceso a Configuración no puede registrar el ingreso de un vehículo.
-- Quedó fuera del merge original de "Rehacer Agenda..." — schema.ts y
-- schema.sql se actualizaron pero faltó este script para bases ya existentes.
--
-- Aplicado a mano contra el pooler de Supabase (igual que los demás
-- archivos de esta carpeta, ver nota en add-fecha-entrega.sql sobre por qué
-- "npm run db:migrate" no sirve acá).

alter table config add column if not exists horario_operador_semana_inicio text not null default '08:25';
alter table config add column if not exists horario_operador_semana_fin text not null default '20:15';
alter table config add column if not exists horario_operador_finde_inicio text not null default '09:55';
alter table config add column if not exists horario_operador_finde_fin text not null default '19:15';
alter table config add column if not exists festivos jsonb not null default '[]'::jsonb;
