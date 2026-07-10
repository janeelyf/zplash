import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { responderMensaje } from "@/lib/whatsapp/router";

export const runtime = "nodejs";

function xmlEscape(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("TWILIO_AUTH_TOKEN no configurado");
    return NextResponse.json({ error: "No configurado" }, { status: 500 });
  }

  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  const firma = request.headers.get("x-twilio-signature");
  const url = request.nextUrl.href;
  const firmaValida = !!firma && twilio.validateRequest(authToken, firma, url, params);
  if (!firmaValida) {
    console.error("Firma inválida en webhook de Twilio WhatsApp", { url, tieneFirma: !!firma });
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const cuerpoMensaje = params.Body || "";
  let respuesta: string;
  try {
    respuesta = await responderMensaje(cuerpoMensaje);
  } catch (error) {
    console.error("Error respondiendo mensaje de WhatsApp", error);
    respuesta = "Ocurrió un error de nuestro lado. Intenta de nuevo en unos minutos.";
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${xmlEscape(respuesta)}</Message></Response>`;
  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
}
