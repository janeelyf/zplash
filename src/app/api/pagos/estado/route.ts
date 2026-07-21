import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { clientes } from "@/db/schema";
import { isValidPatente, normPlate, planStatus } from "@/lib/helpers";
import { clienteIp, rateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

const LIMITE_REQUESTS = 30;
const VENTANA_MS = 5 * 60 * 1000;

// Endpoint público (sin sesión) para que un cliente consulte el estado de su
// plan antes de pagar en /pagar. Devuelve solo lo no sensible — nunca email,
// teléfono ni rut — porque cualquiera puede llamarlo con cualquier patente.
export async function GET(request: NextRequest) {
  try {
    if (rateLimited(`pagos-estado:${clienteIp(request)}`, LIMITE_REQUESTS, VENTANA_MS)) {
      return NextResponse.json({ error: "Demasiados intentos, espera unos minutos" }, { status: 429 });
    }

    const patente = normPlate(request.nextUrl.searchParams.get("patente"));
    if (!isValidPatente(patente)) {
      return NextResponse.json({ error: "Patente inválida" }, { status: 400 });
    }

    ;
    const [cliente] = await db.select().from(clientes).where(eq(clientes.patente, patente)).limit(1);
    if (!cliente) {
      return NextResponse.json({ encontrado: false });
    }

    return NextResponse.json({
      encontrado: true,
      nombre: cliente.nombre,
      plan: cliente.plan,
      vencimiento: cliente.vencimiento,
      estado: planStatus(cliente),
    });
  } catch (error) {
    console.error("Error en /api/pagos/estado", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
