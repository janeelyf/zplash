import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cliente con la service role key: se salta RLS por diseño. SUPABASE_SERVICE_ROLE_KEY
// (sin el prefijo NEXT_PUBLIC_) nunca llega al bundle del navegador, así que
// esto solo debe importarse desde rutas server-side (src/app/api/**/route.ts)
// — jamás desde un componente de cliente ("use client").
//
// Se construye perezosamente (no al importar el módulo) para que el build
// no falle solo por no tener la env var seteada en un entorno donde estas
// rutas no se van a invocar todavía.
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno");
    }
    client = createClient(url, key);
  }
  return client;
}
