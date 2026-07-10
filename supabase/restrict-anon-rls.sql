-- Corre esto una sola vez en el SQL Editor: retira las políticas "anon full
-- access" que dejaban las tablas de datos abiertas de lectura/escritura al
-- rol anon. El navegador nunca las usa vía PostgREST (todo pasa por Server
-- Actions con DATABASE_URL, que se salta RLS), así que esto no afecta el
-- funcionamiento de la app. Deja las tablas con RLS habilitada y sin
-- políticas para anon, es decir, acceso denegado por defecto. No toca la
-- política de Storage (bucket comprobantes-gastos), que sigue siendo
-- necesaria.
drop policy if exists "anon full access" on empresas;
drop policy if exists "anon full access" on clientes;
drop policy if exists "anon full access" on ingresos;
drop policy if exists "anon full access" on ventas;
drop policy if exists "anon full access" on perfiles;
drop policy if exists "anon full access" on precios;
drop policy if exists "anon full access" on config;
drop policy if exists "anon full access" on cupones;
drop policy if exists "anon full access" on movimientos_contables;
drop policy if exists "anon full access" on categorias_gasto;
