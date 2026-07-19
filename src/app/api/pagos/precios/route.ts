import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { precios, servicios } from "@/db/schema";
import {
  PACKS_EMPRESA,
  PLANES,
  precioLavadoUnico,
  precioNormal,
  precioPackEmpresa,
  precioPlanOneclick,
  precioServicio,
  precioZonaAspirado,
  SERVICIOS_DEFAULT,
} from "@/lib/helpers";

export const runtime = "nodejs";

// Público: /pagar necesita mostrar el mismo precio que después se cobra
// server-side en /api/pagos/webpay/crear (que vuelve a leer `precios` en
// ese momento) — así nunca se le muestra al cliente un monto distinto al
// que realmente se le va a cobrar.
export async function GET() {
  try {
    const db = getDb();
    const [filas, filasServicios] = await Promise.all([
      db.select().from(precios),
      db.select().from(servicios).where(eq(servicios.activo, true)),
    ]);
    const preciosMap = Object.fromEntries(filas.map((p) => [p.plan, { normal: p.normal, promo: p.promo }]));
    const catalogo = filasServicios.length ? filasServicios : SERVICIOS_DEFAULT.filter((s) => s.activo);

    return NextResponse.json({
      plan: { nombre: PLANES[0], precio: precioNormal(preciosMap, PLANES[0]) },
      planOneclick: { nombre: PLANES[0], precio: precioPlanOneclick(preciosMap) },
      lavadoUnico: { nombre: "Lavado único", precio: precioLavadoUnico(preciosMap) },
      zonaAspirado: { nombre: "Uso Zona Aspirado Autoservicio", precio: precioZonaAspirado(preciosMap) },
      servicios: catalogo.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        categoria: s.categoria,
        precio: precioServicio(preciosMap, s.id),
      })),
      packsEmpresa: PACKS_EMPRESA.map((p) => ({
        cantidad: p.cantidad,
        nombre: p.key,
        precio: precioPackEmpresa(preciosMap, p.cantidad),
      })),
    });
  } catch (error) {
    console.error("Error en /api/pagos/precios", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
