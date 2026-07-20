// Parser de la cartola histórica de Cta.Cte de Santander Office Banking
// (PDF). A diferencia de un CSV/Excel, este PDF no trae columnas
// delimitadas: cada celda es texto posicionado por (x, y), y la glosa suele
// partirse en 2 líneas físicas dentro de una misma fila lógica (ver muestra
// real usada para diseñar esto). Por eso no basta con leer el texto en orden
// de lectura — hay que reconstruir a qué columna pertenece cada fragmento
// según su posición x relativa al encabezado de esa página.
//
// Las funciones de acá son puras y testeables con fixtures sintéticas
// (PdfTextItem[]). Solo `parsearCartolaPDF` toca pdfjs-dist (dynamic import,
// corre exclusivamente server-side vía la API route de conciliación).

export interface PdfTextItem {
  text: string;
  x: number;
  y: number;
}

export interface ParsedMovimiento {
  fecha: string; // ISO
  glosa: string;
  cargo: number;
  abono: number;
  saldo?: number;
  numeroDocumento?: string;
  sucursal?: string;
}

export interface CartolaResumen {
  saldoInicial?: number;
  saldoFinal?: number;
  depositos?: number;
  otrosAbonos?: number;
  cheques?: number;
  otrosCargos?: number;
}

export interface CartolaParseResult {
  movimientos: ParsedMovimiento[];
  resumen: CartolaResumen;
  warnings: string[];
}

type ColumnaId = "fecha" | "cargo" | "abono" | "descripcion" | "saldo" | "numeroDocumento" | "sucursal";

/** Quita tildes y puntuación para poder comparar encabezados sin depender de la codificación exacta del PDF (ej. "DESCRIPCIÓN" vs "DESCRIPCION"). */
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
}

const HEADER_MAP: Record<string, ColumnaId> = {
  FECHA: "fecha",
  CARGO: "cargo",
  ABONO: "abono",
  DESCRIPCION: "descripcion",
  SALDO: "saldo",
  N: "numeroDocumento",
  DOC: "numeroDocumento",
  NDOC: "numeroDocumento",
  SUCURSAL: "sucursal",
};

export function parseMontoCLP(texto: string | undefined): number {
  if (!texto) return 0;
  const digitos = texto.replace(/[^\d]/g, "");
  return digitos ? parseInt(digitos, 10) : 0;
}

export function esFechaCompleta(texto: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(texto.trim());
}

/** "01/06/2026" -> ISO al mediodía, mismo criterio que MovimientoContableTab (evita corrimientos de huso horario al mostrar solo la fecha). */
export function fechaCartolaAISO(texto: string): string {
  const [dd, mm, yyyy] = texto.trim().split("/");
  return new Date(`${yyyy}-${mm}-${dd}T12:00:00`).toISOString();
}

/** Agrupa items en filas físicas por cercanía de y (arriba->abajo), y dentro de cada fila ordena por x (izquierda->derecha). */
export function agruparFilas(items: PdfTextItem[], tolerancia = 2.5): PdfTextItem[][] {
  const ordenados = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const filas: PdfTextItem[][] = [];
  for (const item of ordenados) {
    const filaActual = filas[filas.length - 1];
    if (filaActual && Math.abs(filaActual[0].y - item.y) <= tolerancia) {
      filaActual.push(item);
    } else {
      filas.push([item]);
    }
  }
  for (const fila of filas) fila.sort((a, b) => a.x - b.x);
  return filas;
}

function detectarEncabezado(fila: PdfTextItem[]): Partial<Record<ColumnaId, number>> | null {
  const inicios: Partial<Record<ColumnaId, number>> = {};
  for (const item of fila) {
    const col = HEADER_MAP[normalizar(item.text)];
    if (col && inicios[col] === undefined) inicios[col] = item.x;
  }
  if (inicios.fecha !== undefined && inicios.descripcion !== undefined && inicios.saldo !== undefined) {
    return inicios;
  }
  return null;
}

interface RangoColumna {
  id: ColumnaId;
  x: number;
}

function construirRangos(inicios: Partial<Record<ColumnaId, number>>): RangoColumna[] {
  return (Object.entries(inicios) as [ColumnaId, number][]).sort((a, b) => a[1] - b[1]).map(([id, x]) => ({ id, x }));
}

// Por vecino más cercano, no por umbral de inicio: los montos (Cargo/Abono/
// Saldo) vienen right-aligned dentro de su columna, así que su x real suele
// caer antes del x del propio header — un umbral de "empieza en o después
// del header" los hace caer en la columna anterior (bug real, encontrado
// probando contra un PDF generado a mano: un cargo corto quedaba pegado a la
// columna FECHA y rompía la detección de fila nueva). La distancia al header
// más cercano es simétrica y tolera ese corrimiento en ambos sentidos.
function columnaDeX(rangos: RangoColumna[], x: number): ColumnaId {
  let mejor = rangos[0];
  let mejorDistancia = Math.abs(x - mejor.x);
  for (const r of rangos) {
    const distancia = Math.abs(x - r.x);
    if (distancia < mejorDistancia) {
      mejor = r;
      mejorDistancia = distancia;
    }
  }
  return mejor.id;
}

function textoPorColumna(fila: PdfTextItem[], rangos: RangoColumna[]): Partial<Record<ColumnaId, string>> {
  const acc: Partial<Record<ColumnaId, string[]>> = {};
  for (const item of fila) {
    const col = columnaDeX(rangos, item.x);
    (acc[col] ??= []).push(item.text);
  }
  const out: Partial<Record<ColumnaId, string>> = {};
  for (const [id, partes] of Object.entries(acc) as [ColumnaId, string[]][]) {
    out[id] = partes.join(" ").replace(/\s+/g, " ").trim();
  }
  return out;
}

const MARCA_FIN_DETALLE = /Resumen comisiones|Saldos diarios/i;
const MARCA_IGNORAR = /^Nota:|Inf[oó]rmese|garant[ií]a estatal|^office\s*banking$|^Santander$/i;

interface MovimientoEnConstruccion {
  fecha: string;
  cargo: number;
  abono: number;
  glosaPartes: string[];
  saldo?: number;
  numeroDocumento?: string;
  sucursal?: string;
}

/** Reconstruye los movimientos de la sección "Detalle movimientos", cortando antes de "Resumen comisiones"/"Saldos diarios" (son vistas derivadas del mismo detalle, no movimientos nuevos). */
export function reconstruirDetalleMovimientos(paginas: PdfTextItem[][]): { movimientos: ParsedMovimiento[]; warnings: string[] } {
  const movimientos: ParsedMovimiento[] = [];
  const warnings: string[] = [];
  let rangos: RangoColumna[] | null = null;
  let actual: MovimientoEnConstruccion | null = null;
  let detenido = false;

  const cerrarActual = () => {
    if (!actual) return;
    if (actual.saldo === undefined) {
      warnings.push(
        `Movimiento del ${actual.fecha.slice(0, 10)} ("${actual.glosaPartes.join(" ")}") quedó sin saldo/N°doc/sucursal — revisar manualmente.`
      );
    }
    movimientos.push({
      fecha: actual.fecha,
      glosa: actual.glosaPartes.join(" ").replace(/\s+/g, " ").trim(),
      cargo: actual.cargo,
      abono: actual.abono,
      saldo: actual.saldo,
      numeroDocumento: actual.numeroDocumento,
      sucursal: actual.sucursal,
    });
    actual = null;
  };

  for (const pagina of paginas) {
    if (detenido) break;
    for (const fila of agruparFilas(pagina)) {
      if (detenido) break;
      const textoFila = fila.map((i) => i.text).join(" ").trim();
      if (MARCA_FIN_DETALLE.test(textoFila)) {
        detenido = true;
        break;
      }
      if (MARCA_IGNORAR.test(textoFila)) continue;

      const posibleEncabezado = detectarEncabezado(fila);
      if (posibleEncabezado) {
        rangos = construirRangos(posibleEncabezado);
        continue;
      }
      if (!rangos) continue; // aún no llegamos a la tabla "Detalle movimientos"

      const cols = textoPorColumna(fila, rangos);
      const fechaTxt = (cols.fecha || "").trim();

      if (esFechaCompleta(fechaTxt)) {
        cerrarActual();
        actual = {
          fecha: fechaCartolaAISO(fechaTxt),
          cargo: parseMontoCLP(cols.cargo),
          abono: parseMontoCLP(cols.abono),
          glosaPartes: cols.descripcion ? [cols.descripcion] : [],
          saldo: cols.saldo ? parseMontoCLP(cols.saldo) : undefined,
          numeroDocumento: cols.numeroDocumento || undefined,
          sucursal: cols.sucursal || undefined,
        };
      } else if (actual) {
        if (cols.descripcion) actual.glosaPartes.push(cols.descripcion);
        if (actual.saldo === undefined && cols.saldo) actual.saldo = parseMontoCLP(cols.saldo);
        if (!actual.numeroDocumento && cols.numeroDocumento) actual.numeroDocumento = cols.numeroDocumento;
        if (!actual.sucursal && cols.sucursal) actual.sucursal = cols.sucursal;
      }
    }
  }
  cerrarActual();
  return { movimientos, warnings };
}

/** Extrae el bloque "Saldos" de la página 1 (Saldo inicial/Depósitos/Otros abonos/Cheques/Otros cargos/Saldo final) para usarlo como checksum del parseo — no necesita posición, son pares "Etiqueta: $ monto" en orden de lectura. */
export function extraerResumenSaldos(textoPagina1: string): CartolaResumen {
  const buscar = (etiqueta: string): number | undefined => {
    const m = textoPagina1.match(new RegExp(etiqueta + "\\s*:\\s*\\$?\\s*(-?[\\d.]+)", "i"));
    return m ? parseMontoCLP(m[1]) : undefined;
  };
  return {
    saldoInicial: buscar("Saldo inicial"),
    depositos: buscar("Dep[oó]sitos"),
    otrosAbonos: buscar("Otros abonos"),
    cheques: buscar("Cheques"),
    otrosCargos: buscar("Otros cargos"),
    saldoFinal: buscar("Saldo final"),
  };
}

/** Orquestación pura a partir de items ya posicionados (una lista de páginas, cada una una lista de PdfTextItem) — testeable sin pdfjs-dist. */
export function parsearPaginasCartola(paginas: PdfTextItem[][]): CartolaParseResult {
  const { movimientos, warnings } = reconstruirDetalleMovimientos(paginas);
  const textoPagina1 = (paginas[0] ?? []).map((i) => i.text).join(" ");
  const resumen = extraerResumenSaldos(textoPagina1);

  const sumaCargos = movimientos.reduce((s, m) => s + m.cargo, 0);
  const sumaAbonos = movimientos.reduce((s, m) => s + m.abono, 0);
  const cargosDeclarados = (resumen.cheques ?? 0) + (resumen.otrosCargos ?? 0);
  const abonosDeclarados = (resumen.depositos ?? 0) + (resumen.otrosAbonos ?? 0);

  if (cargosDeclarados && Math.abs(sumaCargos - cargosDeclarados) > 1) {
    warnings.push(`El total de cargos parseado ($${sumaCargos.toLocaleString("es-CL")}) no calza con el declarado por el banco ($${cargosDeclarados.toLocaleString("es-CL")}).`);
  }
  if (abonosDeclarados && Math.abs(sumaAbonos - abonosDeclarados) > 1) {
    warnings.push(`El total de abonos parseado ($${sumaAbonos.toLocaleString("es-CL")}) no calza con el declarado por el banco ($${abonosDeclarados.toLocaleString("es-CL")}).`);
  }
  if (!movimientos.length) {
    warnings.push("No se reconoció ningún movimiento — revisa que el PDF sea una cartola de Santander Office Banking.");
  }

  return { movimientos, resumen, warnings };
}

/** Extrae texto posicionado de un PDF de cartola Santander y lo reconstruye en movimientos. Corre solo server-side (dynamic import de pdfjs-dist, que en Node usa un worker en el mismo proceso — ver pdfjs-dist/legacy/build/pdf.mjs, `isNodeJS` deshabilita el Worker real). */
export async function parsearCartolaPDF(bytes: Uint8Array): Promise<CartolaParseResult> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Bajo Turbopack/webpack, el import dinámico de pdfjs-dist queda empaquetado
  // en .next/dev/server/chunks/..., y el default de workerSrc ("./pdf.worker.mjs",
  // relativo a ESE chunk) deja de existir ahí — pdfjs no tiene Worker real en
  // Node (ver isNodeJS más arriba), pero igual hace `import(workerSrc)` para
  // cargar su "fake worker". Se sobreescribe SIEMPRE (no solo si falta): el
  // propio módulo ya deja workerSrc con ese default relativo (truthy) apenas
  // se importa, en un static initializer de PDFWorker — un `if (!workerSrc)`
  // nunca se cumple. Apuntamos a la ruta real en node_modules vía file://
  // URL absoluta, que no depende de dónde Turbopack reubicó el chunk.
  const path = await import("node:path");
  const { pathToFileURL } = await import("node:url");
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(
    path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")
  ).href;
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const doc = await loadingTask.promise;
  const paginas: PdfTextItem[][] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items: PdfTextItem[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      items.push({ text: item.str, x: item.transform[4], y: item.transform[5] });
    }
    paginas.push(items);
    await page.cleanup();
  }
  await loadingTask.destroy();
  return parsearPaginasCartola(paginas);
}
