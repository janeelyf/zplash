import { NextResponse } from "next/server";
import { getPreciosPublicos } from "@/lib/preciosPublicos";

export const runtime = "nodejs";

// Público: /pagar necesita mostrar el mismo precio que después se cobra
// server-side en /api/pagos/webpay/crear (que vuelve a leer `precios` en
// ese momento) — así nunca se le muestra al cliente un monto distinto al
// que realmente se le va a cobrar.
export async function GET() {
  try {
    return NextResponse.json(await getPreciosPublicos());
  } catch (error) {
    console.error("Error en /api/pagos/precios", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
