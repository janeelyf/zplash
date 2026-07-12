import { NextRequest, NextResponse } from "next/server";
import { normPlate } from "@/lib/helpers";

export const runtime = "nodejs";

// Recibe una foto tomada con la cámara del operador y la manda a Plate
// Recognizer (ver https://platerecognizer.com/) para leer la patente. La API
// key nunca llega al navegador: esta ruta corre server-side y es la única
// que la conoce. Si la lectura falla o no hay match, el operador sigue
// pudiendo escribir la patente a mano — esto es un atajo, no un reemplazo.
export async function POST(request: NextRequest) {
  const apiKey = process.env.PLATE_RECOGNIZER_API_KEY;
  if (!apiKey) {
    console.error("PLATE_RECOGNIZER_API_KEY no configurado");
    return NextResponse.json({ error: "No configurado" }, { status: 500 });
  }

  const formData = await request.formData();
  const imagen = formData.get("imagen");
  if (!(imagen instanceof File)) {
    return NextResponse.json({ error: "Falta la imagen" }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("upload", imagen);
  upstream.append("regions", "cl");

  try {
    const res = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
      method: "POST",
      headers: { Authorization: `Token ${apiKey}` },
      body: upstream,
    });
    if (!res.ok) {
      console.error("Error de Plate Recognizer", res.status, await res.text());
      return NextResponse.json({ error: "No se pudo leer la patente" }, { status: 502 });
    }
    const data = (await res.json()) as { results?: { plate?: string; score?: number }[] };
    const top = data.results?.[0];
    if (!top?.plate) {
      return NextResponse.json({ patente: null });
    }
    return NextResponse.json({ patente: normPlate(top.plate), score: top.score ?? null });
  } catch (error) {
    console.error("Error llamando a Plate Recognizer", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
