import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { precios } from "@/db/schema";
import { PLANES, SERVICIOS_ADICIONALES, precioNormal, precioPlanOneclick, precioServicioAdicional } from "@/lib/helpers";

export const runtime = "nodejs";

// Público: /pagar necesita mostrar el mismo precio que después se cobra
// server-side en /api/pagos/webpay/crear (que vuelve a leer `precios` en
// ese momento) — así nunca se le muestra al cliente un monto distinto al
// que realmente se le va a cobrar.
export async function GET() {
  try {
    const db = getDb();
    const filas = await db.select().from(precios);
    const preciosMap = Object.fromEntries(filas.map((p) => [p.plan, { normal: p.normal, promo: p.promo }]));

    return NextResponse.json({
      plan: { nombre: PLANES[0], precio: precioNormal(preciosMap, PLANES[0]) },
      planOneclick: { nombre: PLANES[0], precio: precioPlanOneclick(preciosMap) },
      servicios: SERVICIOS_ADICIONALES.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        categoria: s.categoria,
        precio: precioServicioAdicional(preciosMap, s),
      })),
    });
  } catch (error) {
    console.error("Error en /api/pagos/precios", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
