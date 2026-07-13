import "server-only";
import { IntegrationApiKeys, IntegrationCommerceCodes, Oneclick, WebpayPlus } from "transbank-sdk";

/**
 * En integración se usan los códigos/API key de prueba que trae el propio
 * SDK (sin afiliación real a Transbank): así se puede probar el flujo
 * completo en local. En producción, exige las credenciales reales por env.
 */
export function webpayTransaction(): InstanceType<typeof WebpayPlus.Transaction> {
  const entorno = process.env.TRANSBANK_ENVIRONMENT || "integration";
  if (entorno === "production") {
    const commerceCode = process.env.TRANSBANK_COMMERCE_CODE;
    const apiKey = process.env.TRANSBANK_API_KEY_WEBPAY;
    if (!commerceCode || !apiKey) {
      throw new Error("Faltan TRANSBANK_COMMERCE_CODE / TRANSBANK_API_KEY_WEBPAY en producción");
    }
    return WebpayPlus.Transaction.buildForProduction(commerceCode, apiKey);
  }
  return WebpayPlus.Transaction.buildForIntegration(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY);
}

/**
 * Código de comercio Oneclick Mall a nivel del mall (usado para construir
 * MallInscription/MallTransaction) — distinto del código "hijo"/PST que
 * usa oneclickChildCommerceCode() dentro de cada cobro.
 */
export function oneclickCommerceCode(): string {
  const entorno = process.env.TRANSBANK_ENVIRONMENT || "integration";
  if (entorno === "production") {
    const commerceCode = process.env.TRANSBANK_COMMERCE_CODE_ONECLICK;
    if (!commerceCode) throw new Error("Falta TRANSBANK_COMMERCE_CODE_ONECLICK en producción");
    return commerceCode;
  }
  return IntegrationCommerceCodes.ONECLICK_MALL;
}

/**
 * Código de comercio de la transacción HIJA dentro de `authorize()`. Tanto
 * en integración como en producción, Transbank exige un código "hijo"
 * distinto al del mall (usar el mismo código del mall como hijo da "Invalid
 * commerce configuration"). En producción es el código "PST" (Proveedor de
 * Servicios Tecnológicos) que entrega Transbank junto al código del mall en
 * la afiliación a Oneclick Mall.
 */
export function oneclickChildCommerceCode(): string {
  const entorno = process.env.TRANSBANK_ENVIRONMENT || "integration";
  if (entorno === "production") {
    const commerceCode = process.env.TRANSBANK_COMMERCE_CODE_ONECLICK_PST;
    if (!commerceCode) throw new Error("Falta TRANSBANK_COMMERCE_CODE_ONECLICK_PST en producción");
    return commerceCode;
  }
  return IntegrationCommerceCodes.ONECLICK_MALL_CHILD1;
}

export function oneclickInscription(): InstanceType<typeof Oneclick.MallInscription> {
  const entorno = process.env.TRANSBANK_ENVIRONMENT || "integration";
  if (entorno === "production") {
    const commerceCode = process.env.TRANSBANK_COMMERCE_CODE_ONECLICK;
    const apiKey = process.env.TRANSBANK_API_KEY_ONECLICK;
    if (!commerceCode || !apiKey) {
      throw new Error("Faltan TRANSBANK_COMMERCE_CODE_ONECLICK / TRANSBANK_API_KEY_ONECLICK en producción");
    }
    return Oneclick.MallInscription.buildForProduction(commerceCode, apiKey);
  }
  return Oneclick.MallInscription.buildForIntegration(IntegrationCommerceCodes.ONECLICK_MALL, IntegrationApiKeys.WEBPAY);
}

export function oneclickTransaction(): InstanceType<typeof Oneclick.MallTransaction> {
  const entorno = process.env.TRANSBANK_ENVIRONMENT || "integration";
  if (entorno === "production") {
    const commerceCode = process.env.TRANSBANK_COMMERCE_CODE_ONECLICK;
    const apiKey = process.env.TRANSBANK_API_KEY_ONECLICK;
    if (!commerceCode || !apiKey) {
      throw new Error("Faltan TRANSBANK_COMMERCE_CODE_ONECLICK / TRANSBANK_API_KEY_ONECLICK en producción");
    }
    return Oneclick.MallTransaction.buildForProduction(commerceCode, apiKey);
  }
  return Oneclick.MallTransaction.buildForIntegration(IntegrationCommerceCodes.ONECLICK_MALL, IntegrationApiKeys.WEBPAY);
}
