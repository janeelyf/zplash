/** Datos de la cuenta bancaria de la empresa, mostrados al cliente cuando el operador elige "Transferencia bancaria" como forma de pago. */
// Las ventas/movimientos generados automáticamente por Webpay, WooCommerce u
// Oneclick (ver src/app/api/pagos/webpay/retorno/route.ts,
// src/app/api/webhooks/woocommerce/route.ts y aplicarPagoOneclick en
// src/lib/pagos.ts) siempre quedan con creadoPor = "Automático (...)" y
// metodoPago "tarjeta": son cobros web procesados por Transbank. Cualquier
// otro pago con tarjeta se cobra en el local con el POS GETNET.
export function esTarjetaWeb(creadoPor?: string | null): boolean {
  return (creadoPor || "").startsWith("Automático");
}

export const DATOS_TRANSFERENCIA = [
  { label: "Nombre", valor: "SERVICIOS E INVERSIONES LAS AGUILAS SPA" },
  { label: "RUT", valor: "76.969.928-7" },
  { label: "Cuenta Corriente Banco Santander", valor: "0-000-9448956-3" },
  { label: "Mail", valor: "TB@ZPLASH.CL" },
];
