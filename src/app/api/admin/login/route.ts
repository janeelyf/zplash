import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { nombre?: unknown; clave?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const nombre = body.nombre;
  const clave = body.clave;
  if ((nombre !== "Evelyn" && nombre !== "Juan") || typeof clave !== "string" || !clave) {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("administradores")
    .select("clave, es_gerente")
    .eq("nombre", nombre)
    .maybeSingle();

  if (error) {
    console.error("Error consultando administradores", error);
    return NextResponse.json({ ok: false, error: "Error de servidor" }, { status: 500 });
  }
  if (!data || data.clave !== clave) {
    return NextResponse.json({ ok: false, error: "Contraseña incorrecta" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, esGerente: !!data.es_gerente });
}
