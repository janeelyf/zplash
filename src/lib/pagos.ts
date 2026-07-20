import "server-only";
import { TransactionDetail } from "transbank-sdk";
import { and, eq, sql } from "drizzle-orm";
import { getDb, type DbOrTx } from "@/db";
import {
  clientes,
  cobrosOneclick,
  config,
  cupones,
  empresas,
  movimientosContables,
  pagosWebpayItems,
  precios,
  suscripcionesOneclick,
  ventas,
} from "@/db/schema";
import { movimientoToRow } from "@/lib/dataAccess";
import { PLAN_ONECLICK_KEY, PLANES, generarCodigoCupon, mesActualKey, movimientoContableDesdeVenta, precioPlanOneclick, uid } from "@/lib/helpers";
import { oneclickChildCommerceCode, oneclickTransaction } from "@/lib/transbank";
import type { Precios } from "@/types";

function addDaysISO(iso: string, dias: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

/** Próximo ciclo mensual a partir de una fecha base, saltando meses ya
 * vencidos (ej. si el cron no corrió por 2 meses) hasta caer en el futuro. */
function proximoCicloISO(base: string | null): string {
  const hoy = new Date();
  let d = base ? new Date(base) : new Date(hoy);
  if (isNaN(d.getTime())) d = new Date(hoy);
  while (d <= hoy) {
    d.setDate(d.getDate() + 30);
  }
  return d.toISOString();
}

interface AplicarPagoParams {
  patente: string;
  monto: number;
  ventaId: string;
  metodoPago: string;
  creadoPor: string;
  esServicioAdicional: boolean;
  // Si es servicio adicional no se toca plan/vencimiento del cliente; si no,
  // se extiende (o inicia) el ciclo de 30 días como cualquier renovación web.
  tipoVentaNuevo: string;
  tipoVentaExistente: string;
}

/**
 * Buscar/crear cliente por patente + insertar venta, para un pago que un
 * proveedor externo (Transbank) ya confirmó como aprobado. Compartido entre
 * webpay/retorno y los dos flujos de Oneclick — mismo patrón que ya usaba el
 * webhook de WooCommerce, factorizado acá porque ya son tres sitios
 * repitiendo la misma lógica.
 *
 * Recibe `db` (una conexión normal o una transacción/savepoint del llamador,
 * ver DbOrTx en @/db) en vez de abrir la suya propia: la extensión del
 * vencimiento del cliente y el insert de la venta son dos escrituras
 * separadas, así que si el llamador no las envuelve en una transacción, una
 * falla a mitad de camino puede dejar al cliente con el plan extendido sin
 * que exista la venta que lo respalda (y un reintento del mismo pago lo
 * extendería de nuevo, gratis). Los tres llamadores (webpay/retorno,
 * cobrarSuscripcion x2) ahora pasan su propia transacción.
 */
export async function aplicarPagoAprobado(p: AplicarPagoParams, db: DbOrTx = getDb()): Promise<{ clienteId: string }> {
  const [existente] = await db.select().from(clientes).where(eq(clientes.patente, p.patente)).limit(1);

  let clienteId: string;
  if (p.esServicioAdicional) {
    if (existente) {
      clienteId = existente.id;
    } else {
      clienteId = uid();
      await db.insert(clientes).values({
        id: clienteId,
        nombre: "Cliente Web",
        patente: p.patente,
        origen: "WEB",
        visitas: 0,
        creadoEn: new Date().toISOString(),
        creadoPor: p.creadoPor,
      });
    }
  } else if (existente) {
    const vencActual = existente.vencimiento ? new Date(existente.vencimiento) : null;
    const base = vencActual && vencActual > new Date() ? vencActual.toISOString() : new Date().toISOString();
    clienteId = existente.id;
    await db
      .update(clientes)
      .set({ vencimiento: addDaysISO(base, 30), plan: existente.plan || PLANES[0], origen: "WEB" })
      .where(eq(clientes.id, clienteId));
  } else {
    clienteId = uid();
    await db.insert(clientes).values({
      id: clienteId,
      nombre: "Cliente Web",
      patente: p.patente,
      plan: PLANES[0],
      vencimiento: addDaysISO(new Date().toISOString(), 30),
      fechaContratacion: new Date().toISOString(),
      origen: "WEB",
      visitas: 0,
      creadoEn: new Date().toISOString(),
      creadoPor: p.creadoPor,
    });
  }

  const tipo = existente ? p.tipoVentaExistente : p.tipoVentaNuevo;
  const nombre = existente?.nombre || "Cliente Web";
  await db.insert(ventas).values({
    id: p.ventaId,
    clienteId,
    patente: p.patente,
    nombre,
    plan: p.esServicioAdicional ? "" : PLANES[0],
    precio: p.monto,
    tipo,
    metodoPago: p.metodoPago,
    esServicioAdicional: p.esServicioAdicional,
    creadoPor: p.creadoPor,
  });

  // Genera/actualiza el movimiento contable de ingreso ligado a esta venta
  // en la misma transacción — ver movimientoContableDesdeVenta en helpers.ts.
  const movimientoRow = movimientoToRow(
    movimientoContableDesdeVenta({
      id: p.ventaId,
      tipo,
      precio: p.monto,
      fecha: new Date().toISOString(),
      patente: p.patente,
      nombre,
      metodoPago: p.metodoPago,
      creadoPor: p.creadoPor,
    })
  );
  await db
    .insert(movimientosContables)
    .values(movimientoRow)
    .onConflictDoUpdate({ target: movimientosContables.id, set: movimientoRow });

  return { clienteId };
}

type PagoWebpayItemRow = typeof pagosWebpayItems.$inferSelect;

/**
 * Aplica un pago aprobado de un Pack Empresa (10/20/30/40 tickets, ver
 * PACKS_EMPRESA en @/lib/helpers): a diferencia de aplicarPagoAprobado, no
 * CREA fila en `clientes` (no hay una sola patente de auto asociada —
 * `clientes.patente` es UNIQUE, así que varias compras de empresa con
 * patente "" chocarían) ni extiende ningún plan. En vez de eso genera el
 * lote de cupones tipo "vale" (mismo esquema que VentaEmpresaTab.generar()
 * en el panel admin), la Venta con los datos de facturación del checkout, y
 * da de alta la Empresa si el RUT es nuevo (mismo patrón "el RUT manda" que
 * ya usa VentaEmpresaTab). Si el email del checkout coincide con un cliente
 * ya existente, sí se enlaza `ventas.clienteId` a ese cliente (sin crear uno
 * nuevo) para que la compra aparezca en Mi Cuenta.
 */
export async function aplicarPagoPackEmpresa(
  p: { item: PagoWebpayItemRow; ventaId: string; creadoPor: string },
  db: DbOrTx = getDb()
): Promise<void> {
  const { item } = p;
  const cantidad = item.cantidadCupones || 0;
  if (cantidad <= 0) {
    throw new Error(`pagosWebpayItems ${item.id} sin cantidadCupones válida`);
  }

  const [configRow] = await db.select({ vigenciaDiasPackEmpresa: config.vigenciaDiasPackEmpresa }).from(config).limit(1);
  const vigenciaDias = configRow?.vigenciaDiasPackEmpresa || 365;
  const fechaCaducidad = new Date(Date.now() + vigenciaDias * 86400000).toISOString();

  const existentesRows = await db.select({ codigo: cupones.codigo }).from(cupones);
  const existentes = new Set(existentesRows.map((r) => r.codigo));
  const valorPorCupon = Math.round(item.monto / cantidad);
  const ahora = new Date().toISOString();
  // El cliente manda si le puso nombre a su lote (ej. "Lavados rentacar
  // SALFA Mayo"); si no, cae a razonSocial y por último al genérico de
  // siempre.
  const nombreLote = item.nombreLote || item.razonSocial || "Pack Empresa Web";

  let clienteId: string | null = null;
  if (item.email) {
    const [clienteExistente] = await db
      .select({ id: clientes.id })
      .from(clientes)
      .where(sql`lower(${clientes.email}) = ${item.email.toLowerCase()}`)
      .limit(1);
    clienteId = clienteExistente?.id || null;
  }

  const nuevosCupones = Array.from({ length: cantidad }, (_, i) => {
    const codigo = generarCodigoCupon(existentes);
    existentes.add(codigo);
    return {
      id: `${item.id}-${i}`,
      codigo,
      nombreLote,
      valor: valorPorCupon,
      numeroLote: i + 1,
      totalLote: cantidad,
      fechaCaducidad,
      usado: false,
      creadoEn: ahora,
      creadoPor: p.creadoPor,
      tipo: "vale" as const,
      rut: item.rut || null,
      patentesAutorizadas: item.patentesAutorizadas?.length ? item.patentesAutorizadas : null,
      email: item.email || null,
    };
  });
  await db.insert(cupones).values(nuevosCupones);

  const nombreVenta = `Venta Empresa Web · ${item.nombreLote || item.razonSocial || "Cliente"}`;
  const tipoVenta = `${item.nombre} (Web)`;
  await db.insert(ventas).values({
    id: p.ventaId,
    clienteId,
    patente: "",
    nombre: nombreVenta,
    plan: "",
    precio: item.monto,
    tipo: tipoVenta,
    metodoPago: "tarjeta",
    estadoPago: "pagado",
    cantidadItems: cantidad,
    tipoDocumento: item.tipoDocumento,
    razonSocial: item.razonSocial,
    rut: item.rut,
    direccion: item.direccion,
    giro: item.giro,
    email: item.email,
    creadoPor: p.creadoPor,
  });

  // Genera/actualiza el movimiento contable de ingreso ligado a esta venta
  // en la misma transacción — ver movimientoContableDesdeVenta en helpers.ts.
  const movimientoRow = movimientoToRow(
    movimientoContableDesdeVenta({
      id: p.ventaId,
      tipo: tipoVenta,
      precio: item.monto,
      fecha: new Date().toISOString(),
      patente: "",
      nombre: nombreVenta,
      metodoPago: "tarjeta",
      estadoPago: "pagado",
      creadoPor: p.creadoPor,
    })
  );
  await db
    .insert(movimientosContables)
    .values(movimientoRow)
    .onConflictDoUpdate({ target: movimientosContables.id, set: movimientoRow });

  // El RUT manda (mismo criterio que VentaEmpresaTab.generar() en el panel
  // admin): si es Factura y ese RUT no pertenece a ninguna empresa ya
  // registrada, se crea una nueva en Empresas.
  if (item.tipoDocumento === "Factura" && item.rut) {
    const [existente] = await db.select({ id: empresas.id }).from(empresas).where(eq(empresas.rut, item.rut)).limit(1);
    if (!existente) {
      await db.insert(empresas).values({
        id: uid(),
        razonSocial: item.razonSocial || "",
        rut: item.rut,
        giro: item.giro || null,
        direccion: item.direccion || null,
        creadoEn: ahora,
        creadoPor: p.creadoPor,
      });
    }
  }
}

type SuscripcionOneclick = typeof suscripcionesOneclick.$inferSelect;

/**
 * Cobra un ciclo de una suscripción Oneclick activa: usado tanto por el cron
 * diario (/api/pagos/oneclick/cobrar) como por el reintento manual desde
 * ClienteInfoModal y por el primer cobro inmediato tras inscribir la
 * tarjeta — misma función, sin distinguir quién la llamó.
 *
 * Siempre avanza `proximoCobro` (aprobado o no): no hay reintento automático
 * por diseño, el cliente queda vencido si falla y un operador decide si
 * reintenta a mano.
 */
export async function cobrarSuscripcion(suscripcion: SuscripcionOneclick): Promise<{ estado: "aprobada" | "rechazada" }> {
  const tbkUser = suscripcion.tbkUser;
  if (!tbkUser) {
    throw new Error("Suscripción sin tbkUser, no se puede cobrar");
  }

  // Todo el ciclo (chequeo de "¿ya se cobró?", el cargo a Transbank y las
  // escrituras posteriores) corre dentro de una sola transacción con un
  // advisory lock por suscripción: el cron diario, un reintento manual desde
  // ClienteInfoModal y el primer cobro inmediato tras inscribir la tarjeta
  // pueden dispararse casi al mismo tiempo para la misma suscripción, y sin
  // este lock los tres podían pasar el chequeo "¿ya aprobado?" antes de que
  // cualquiera terminara de escribir su resultado, cobrando dos veces la
  // misma tarjeta. pg_advisory_xact_lock se libera solo al terminar la
  // transacción (commit o rollback), así que una segunda llamada concurrente
  // espera acá a que la primera termine de verdad antes de mirar el estado.
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${suscripcion.id}))`);

    const [filaPrecio] = await tx.select().from(precios).where(eq(precios.plan, PLAN_ONECLICK_KEY)).limit(1);
    const preciosMap: Precios = filaPrecio ? { [PLAN_ONECLICK_KEY]: { normal: filaPrecio.normal, promo: filaPrecio.promo } } : {};
    const monto = precioPlanOneclick(preciosMap);

    const buyOrder = "oc" + Date.now().toString(36) + Math.floor(Math.random() * 36).toString(36);
    const cicloYm = mesActualKey();
    const commerceCode = oneclickChildCommerceCode();

    // No bloquea reintentos tras un rechazo (pueden existir varias filas
    // "rechazada" el mismo ciclo) — solo evita cobrar dos veces si este ciclo
    // ya tiene una fila "aprobada". Gracias al lock de arriba, para cuando
    // una segunda llamada llega hasta acá la primera ya terminó del todo (no
    // solo insertó su fila de reserva), así que este chequeo ve el resultado
    // real del intento anterior.
    const [yaAprobado] = await tx
      .select({ id: cobrosOneclick.id })
      .from(cobrosOneclick)
      .where(and(eq(cobrosOneclick.suscripcionId, suscripcion.id), eq(cobrosOneclick.cicloYm, cicloYm), eq(cobrosOneclick.estado, "aprobada")))
      .limit(1);
    if (yaAprobado) {
      throw new Error("Este ciclo ya fue cobrado");
    }

    await tx.insert(cobrosOneclick).values({ id: buyOrder, suscripcionId: suscripcion.id, cicloYm, monto, estado: "rechazada" });

    let estado: "aprobada" | "rechazada" = "rechazada";
    let responseCode: number | null = null;
    let authorizationCode: string | null = null;
    let ventaId: string | null = null;

    try {
      const resultado = await oneclickTransaction().authorize(suscripcion.username, tbkUser, buyOrder, [
        new TransactionDetail(monto, commerceCode, buyOrder),
      ]);
      // A diferencia de Webpay Plus, el resultado no trae response_code/
      // authorization_code en la raíz: vienen por cada transacción hija dentro
      // de `details[]` (acá siempre hay una sola, la de ZPlash).
      const detalle = resultado.details?.[0];
      responseCode = detalle?.response_code ?? null;
      authorizationCode = detalle?.authorization_code || null;

      if (detalle?.response_code === 0) {
        estado = "aprobada";
        ventaId = "oc-" + buyOrder;
        try {
          // Savepoint aparte: si esto falla, Transbank ya cobró la tarjeta,
          // así que NO puede perderse el registro de que el ciclo quedó
          // "aprobada" (eso volvería a cobrar el mismo mes en el próximo
          // intento) — solo se revierte la extensión de vencimiento/venta a
          // medio aplicar, y se deja ventaId en null para que quede marcado
          // para revisión manual en vez de simular una venta que no cuadra.
          await tx.transaction(async (tx2) => {
            await aplicarPagoAprobado(
              {
                patente: suscripcion.patente,
                monto,
                ventaId: ventaId as string,
                metodoPago: "tarjeta",
                creadoPor: "Automático (Oneclick)",
                esServicioAdicional: false,
                tipoVentaNuevo: "Renovación automática (Oneclick)",
                tipoVentaExistente: "Renovación automática (Oneclick)",
              },
              tx2
            );
          });
        } catch (errorAplicar) {
          console.error(
            "Pago Oneclick aprobado por Transbank pero no se pudo aplicar en la base (cliente sin extender/venta) — requiere revisión manual",
            suscripcion.id,
            buyOrder,
            errorAplicar
          );
          ventaId = null;
        }
      }
    } catch (error) {
      console.error("Error autorizando cobro Oneclick", suscripcion.id, error);
      estado = "rechazada";
    }

    await tx
      .update(cobrosOneclick)
      .set({ estado, responseCode, authorizationCode, ventaId })
      .where(eq(cobrosOneclick.id, buyOrder));

    await tx
      .update(suscripcionesOneclick)
      .set({ proximoCobro: proximoCicloISO(suscripcion.proximoCobro), actualizadoEn: new Date().toISOString() })
      .where(eq(suscripcionesOneclick.id, suscripcion.id));

    return { estado };
  });
}
