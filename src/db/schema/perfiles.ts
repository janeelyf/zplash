import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { timestamptz } from "./shared";

// Reemplaza a las antiguas tablas `operadores` y `administradores` (ver
// supabase/migrar-perfiles.sql): un solo perfil por persona, con la clave
// y la lista de módulos a los que tiene acceso. Incluye "clave": solo se
// consulta desde código server-side de /api/perfiles/* (ver PerfilPublico
// en @/types para la forma pública, sin clave, que sí llega al cliente).
export const perfiles = pgTable("perfiles", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  clave: text("clave").notNull(),
  // Se incrementa cada vez que cambia `clave` (ver /api/perfiles/cambiar-clave)
  // y viaja dentro del payload firmado de la cookie de sesión (@/lib/session).
  // Así, cambiar la contraseña invalida cualquier sesión ya emitida con la
  // versión anterior, aunque falten horas para que expire por sí sola.
  claveVersion: integer("clave_version").notNull().default(1),
  modulos: jsonb("modulos").$type<string[]>().notNull().default([]),
  icono: text("icono"),
  creadoEn: timestamptz("creado_en").notNull().defaultNow(),
});
