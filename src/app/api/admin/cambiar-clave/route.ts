import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// Sin sesiones reales, la única prueba de identidad que el servidor puede
// verificar es la contraseña actual del actor — por eso se exige siempre,
// incluso cuando Juan (gerente) cambia la contraseña de Evelyn.
export async function POST(request: NextRequest) {
  let body: { actor?: unknown; actorClaveActual?: unknown; objetivo?: unknown; claveNueva?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const { actor, actorClaveActual, objetivo, claveNueva } = body;
  const nombresValidos = (v: unknown): v is "Evelyn" | "Juan" => v === "Evelyn" || v === "Juan";

  if (!nombresValidos(actor) || !nombresValidos(objetivo) || typeof actorClaveActual !== "string" || typeof claveNueva !== "string") {
    return NextResponse.json({ ok: false, error: "Datos inválidos" }, { status: 400 });
  }
  if (claveNueva.length < 4) {
    return NextResponse.json({ ok: false, error: "La nueva contraseña debe tener al menos 4 caracteres" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: actorRow, error: actorError } = await supabaseAdmin
    .from("administradores")
    .select("clave, es_gerente")
    .eq("nombre", actor)
    .maybeSingle();

  if (actorError) {
    console.error("Error consultando administradores", actorError);
    return NextResponse.json({ ok: false, error: "Error de servidor" }, { status: 500 });
  }
  if (!actorRow || actorRow.clave !== actorClaveActual) {
    return NextResponse.json({ ok: false, error: "Tu contraseña actual es incorrecta" }, { status: 401 });
  }
  if (objetivo !== actor && !actorRow.es_gerente) {
    return NextResponse.json({ ok: false, error: "Solo el gerente puede cambiar la contraseña de otra persona" }, { status: 403 });
  }

  const { error: updateError } = await supabaseAdmin.from("administradores").update({ clave: claveNueva }).eq("nombre", objetivo);
  if (updateError) {
    console.error("Error actualizando contraseña de administrador", updateError);
    return NextResponse.json({ ok: false, error: "Error de servidor" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
