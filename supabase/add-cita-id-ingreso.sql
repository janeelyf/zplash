-- Agrega ingresos.cita_id -> citas: liga el Ingreso (historial de túnel) a
-- la Cita/Venta que lo originó. Necesario porque el ingreso de un lavado
-- completo/detailing ya no se crea automáticamente al vender en Servicios
-- Adicionales, sino al registrar la patente en el módulo Operador cuando el
-- vehículo llega al túnel (glosa "Limpieza Completa", ver
-- registrarIngresoDetailing en lib/actions.ts) — ese registro no genera una
-- venta nueva, la venta ya existe.
--
-- Aplicado a mano contra el pooler de Supabase (igual que los demás
-- archivos de esta carpeta, ver nota en add-fecha-entrega.sql sobre por qué
-- "npm run db:migrate" no sirve acá).

alter table ingresos add column if not exists cita_id text references citas(id) on delete set null;
