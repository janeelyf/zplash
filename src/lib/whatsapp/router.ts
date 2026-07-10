import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { clientes } from "@/db/schema";
import { fmtFecha, isValidPatente, normPlate, planStatus } from "@/lib/helpers";
import {
  CONTACTO_HUMANO,
  HORARIO_UBICACION,
  MENSAJE_NO_ENTENDIDO,
  MENU_PRINCIPAL,
  PATENTE_NO_ENCONTRADA,
  textoPrecios,
} from "./contenido";

const SALUDOS = new Set(["hola", "buenas", "buenos dias", "buenos días", "buenas tardes", "buenas noches", "menu", "menú", "hi", "hello"]);
const OPCIONES_PRECIOS = new Set(["1", "precios", "precio"]);
const OPCIONES_HORARIO = new Set(["2", "horario", "horarios", "ubicacion", "ubicación"]);
const OPCIONES_HUMANO = new Set(["3", "humano", "ayuda", "persona"]);

async function estadoPlanPorPatente(patenteCruda: string): Promise<string> {
  const patente = normPlate(patenteCruda);
  const db = getDb();
  const [cliente] = await db.select().from(clientes).where(eq(clientes.patente, patente)).limit(1);

  if (!cliente) return PATENTE_NO_ENCONTRADA;

  const estado = planStatus(cliente);
  const lineas = [
    `🚗 *${cliente.patente}* — ${cliente.nombre}`,
    `Plan: ${cliente.plan || "Sin plan"}`,
    `Estado: ${estado.label}`,
  ];
  if (cliente.vencimiento) lineas.push(`Vencimiento: ${fmtFecha(cliente.vencimiento)}`);
  if (estado.cls === "warn" && estado.diasRestantes !== undefined) {
    lineas.push(`⚠️ Vence en ${estado.diasRestantes} día(s).`);
  }
  if (estado.cls === "bad") {
    lineas.push(``, `Tu plan no está vigente. Escribe *1* para ver precios de renovación.`);
  }
  return lineas.join("\n");
}

export async function responderMensaje(textoCrudo: string): Promise<string> {
  const texto = (textoCrudo || "").trim();
  const normalizado = texto.toLowerCase();

  if (!texto || SALUDOS.has(normalizado)) return MENU_PRINCIPAL;
  if (isValidPatente(texto)) return estadoPlanPorPatente(texto);
  if (OPCIONES_PRECIOS.has(normalizado)) return textoPrecios();
  if (OPCIONES_HORARIO.has(normalizado)) return HORARIO_UBICACION;
  if (OPCIONES_HUMANO.has(normalizado)) return CONTACTO_HUMANO;

  return MENSAJE_NO_ENTENDIDO;
}
