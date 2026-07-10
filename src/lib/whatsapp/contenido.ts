import {
  fmtCLP,
  PRECIOS_DEFAULT,
  PRECIO_LAVADO_UNICO,
  SERVICIOS_ADICIONALES,
} from "@/lib/helpers";

export const MENU_PRINCIPAL = `¡Hola! 👋 Soy el asistente de ZPlash.

Elige una opción escribiendo el número, o envía tu *patente* para consultar tu plan:

1️⃣ Precios
2️⃣ Horario y ubicación
3️⃣ Hablar con una persona

Ejemplo: escribe *AB1234* para ver el estado de tu plan.`;

// TODO: reemplazar con la dirección y horario real antes de lanzar el bot.
export const HORARIO_UBICACION = `📍 *Ubicación*
Dirección de ejemplo 123, Comuna, Ciudad (reemplazar)

🕒 *Horario*
Lunes a sábado: 09:00 - 19:00 (reemplazar)
Domingo: cerrado (reemplazar)`;

// TODO: reemplazar con el número/instrucción real de contacto humano.
export const CONTACTO_HUMANO = `Un miembro de nuestro equipo te va a contactar por este mismo WhatsApp. También puedes llamar al +56 9 XXXX XXXX (reemplazar).`;

export const MENSAJE_NO_ENTENDIDO = `No entendí tu mensaje 🤔

Escribe *menu* para ver las opciones, o envía tu *patente* para consultar tu plan.`;

export const PATENTE_NO_ENCONTRADA = `No encontramos ningún cliente con esa patente. Verifica que esté bien escrita (ej. AB1234) o escribe *3* para hablar con una persona.`;

export function textoPrecios(): string {
  const lineas = [`💰 *Precios*`, ``];

  for (const [plan, precio] of Object.entries(PRECIOS_DEFAULT)) {
    lineas.push(`${plan}: ${fmtCLP(precio.promo)} (normal ${fmtCLP(precio.normal)})`);
  }

  lineas.push(``, `Lavado único: ${fmtCLP(PRECIO_LAVADO_UNICO)}`, ``, `*Servicios adicionales*`);
  for (const s of SERVICIOS_ADICIONALES) {
    lineas.push(`${s.nombre}: ${fmtCLP(s.precio)}`);
  }

  return lineas.join("\n");
}
