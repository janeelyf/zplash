-- Corre esto una sola vez en el SQL Editor: agrega el ícono/emoji opcional
-- que se muestra junto al nombre del perfil en la pantalla de login
-- (¿Quién eres?).
alter table perfiles add column if not exists icono text;
