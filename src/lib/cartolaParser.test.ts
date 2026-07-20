import { describe, expect, it } from "vitest";
import {
  agruparFilas,
  esFechaCompleta,
  extraerResumenSaldos,
  fechaCartolaAISO,
  parseMontoCLP,
  parsearPaginasCartola,
  reconstruirDetalleMovimientos,
  type PdfTextItem,
} from "./cartolaParser";

// Coordenadas sintéticas: x fijo por columna, y decreciente fila a fila
// (el PDF real ordena de arriba hacia abajo, y crece hacia arriba en
// coordenadas PDF). No corresponden a un PDF real, solo modelan el layout
// "FECHA | CARGO | ABONO | DESCRIPCIÓN | SALDO | N° DOC | SUCURSAL".
const COL = { fecha: 50, cargo: 150, abono: 220, descripcion: 290, saldo: 430, numeroDocumento: 490, sucursal: 540 };

function fila(y: number, items: { col: keyof typeof COL; text: string }[]): PdfTextItem[] {
  return items.map(({ col, text }) => ({ text, x: COL[col], y }));
}

const HEADER = (y: number): PdfTextItem[] => [
  { text: "FECHA", x: COL.fecha, y },
  { text: "CARGO", x: COL.cargo, y },
  { text: "ABONO", x: COL.abono, y },
  { text: "DESCRIPCIÓN", x: COL.descripcion, y },
  { text: "SALDO", x: COL.saldo, y },
  { text: "N°", x: COL.numeroDocumento, y },
  { text: "DOC", x: COL.numeroDocumento + 10, y },
  { text: "SUCURSAL", x: COL.sucursal, y },
];

describe("parseMontoCLP", () => {
  it("convierte montos con formato chileno a número", () => {
    expect(parseMontoCLP("$ 1.066.944")).toBe(1066944);
    expect(parseMontoCLP("$ 40.171")).toBe(40171);
    expect(parseMontoCLP("")).toBe(0);
    expect(parseMontoCLP(undefined)).toBe(0);
  });
});

describe("esFechaCompleta / fechaCartolaAISO", () => {
  it("reconoce fechas DD/MM/YYYY y las convierte a ISO", () => {
    expect(esFechaCompleta("01/06/2026")).toBe(true);
    expect(esFechaCompleta("30/05/26")).toBe(false); // fecha corta embebida en la glosa, no es la columna FECHA
    expect(fechaCartolaAISO("01/06/2026").slice(0, 10)).toBe("2026-06-01");
  });
});

describe("agruparFilas", () => {
  it("agrupa items por cercanía de y y los ordena por x dentro de la fila", () => {
    const items: PdfTextItem[] = [
      { text: "B", x: 200, y: 100 },
      { text: "A", x: 50, y: 101 },
      { text: "C", x: 50, y: 50 },
    ];
    const filas = agruparFilas(items);
    expect(filas).toHaveLength(2);
    expect(filas[0].map((i) => i.text)).toEqual(["A", "B"]);
    expect(filas[1].map((i) => i.text)).toEqual(["C"]);
  });
});

describe("reconstruirDetalleMovimientos", () => {
  it("reconstruye un movimiento cuya glosa se parte en 2 líneas físicas", () => {
    const pagina: PdfTextItem[] = [
      ...HEADER(800),
      ...fila(790, [
        { col: "fecha", text: "01/06/2026" },
        { col: "abono", text: "$ 1.066.944" },
        { col: "descripcion", text: "Abono Ventas GETNET" },
      ]),
      ...fila(780, [
        { col: "descripcion", text: "30/05/26 CIERR" },
        { col: "saldo", text: "$ 11.007.059" },
        { col: "numeroDocumento", text: "88545256" },
        { col: "sucursal", text: "TEMUCO PZA EXPRESSO" },
      ]),
    ];

    const { movimientos, warnings } = reconstruirDetalleMovimientos([pagina]);

    expect(warnings).toEqual([]);
    expect(movimientos).toHaveLength(1);
    expect(movimientos[0]).toMatchObject({
      glosa: "Abono Ventas GETNET 30/05/26 CIERR",
      cargo: 0,
      abono: 1066944,
      saldo: 11007059,
      numeroDocumento: "88545256",
      sucursal: "TEMUCO PZA EXPRESSO",
    });
  });

  it("reconstruye un movimiento de una sola línea", () => {
    const pagina: PdfTextItem[] = [
      ...HEADER(800),
      ...fila(790, [
        { col: "fecha", text: "25/06/2026" },
        { col: "cargo", text: "$ 40.171" },
        { col: "descripcion", text: "COM.MANTENCION PLAN" },
        { col: "saldo", text: "$ 3.969.640" },
        { col: "numeroDocumento", text: "0" },
        { col: "sucursal", text: "Agustinas" },
      ]),
    ];

    const { movimientos } = reconstruirDetalleMovimientos([pagina]);

    expect(movimientos).toHaveLength(1);
    expect(movimientos[0]).toMatchObject({ glosa: "COM.MANTENCION PLAN", cargo: 40171, abono: 0 });
  });

  it("no confunde un monto right-aligned que empieza antes que el header de su columna con la columna vecina (regresión)", () => {
    // Reproduce un bug real encontrado probando contra un PDF generado a
    // mano: un cargo corto ("$ 40.171") renderizado más a la izquierda que
    // el header CARGO (por right-alignment) caía en la columna FECHA con el
    // umbral anterior, corrompía el texto de esa columna y la fila dejaba de
    // reconocerse como un movimiento nuevo (ver columnaDeX, ahora por vecino
    // más cercano en vez de "empieza en o después del header").
    const pagina: PdfTextItem[] = [
      ...HEADER(800),
      ...fila(790, [
        { col: "fecha", text: "01/06/2026" },
        { col: "abono", text: "$ 1.066.944" },
        { col: "descripcion", text: "Abono Ventas GETNET" },
      ]),
      ...fila(780, [
        { col: "descripcion", text: "30/05/26 CIERR" },
        { col: "saldo", text: "$ 11.007.059" },
        { col: "numeroDocumento", text: "88545256" },
        { col: "sucursal", text: "TEMUCO PZA EXPRESSO" },
      ]),
      { text: "25/06/2026", x: COL.fecha, y: 770 },
      { text: "$ 40.171", x: COL.cargo - 5, y: 770 }, // a la izquierda del header CARGO, no del todo alineado
      { text: "COM.MANTENCION PLAN", x: COL.descripcion, y: 770 },
      { text: "$ 3.969.640", x: COL.saldo, y: 770 },
      { text: "0", x: COL.numeroDocumento, y: 770 },
      { text: "Agustinas", x: COL.sucursal, y: 770 },
    ];

    const { movimientos, warnings } = reconstruirDetalleMovimientos([pagina]);

    expect(warnings).toEqual([]);
    expect(movimientos).toHaveLength(2);
    expect(movimientos[1]).toMatchObject({ glosa: "COM.MANTENCION PLAN", cargo: 40171, abono: 0, saldo: 3969640 });
  });

  it("corta antes de 'Resumen comisiones' y no duplica esas filas", () => {
    const pagina1: PdfTextItem[] = [
      ...HEADER(800),
      ...fila(790, [
        { col: "fecha", text: "25/06/2026" },
        { col: "cargo", text: "$ 40.171" },
        { col: "descripcion", text: "COM.MANTENCION PLAN" },
        { col: "saldo", text: "$ 3.969.640" },
        { col: "numeroDocumento", text: "0" },
        { col: "sucursal", text: "Agustinas" },
      ]),
    ];
    const pagina2: PdfTextItem[] = [
      [{ text: "Resumen comisiones", x: COL.fecha, y: 800 }],
      HEADER(790),
      fila(780, [
        { col: "fecha", text: "25/06/2026" },
        { col: "cargo", text: "$ 40.171" },
        { col: "descripcion", text: "COM.MANTENCION PLAN" },
        { col: "saldo", text: "$ 3.969.640" },
        { col: "numeroDocumento", text: "0" },
        { col: "sucursal", text: "Agustinas" },
      ]),
    ].flat();

    const { movimientos } = reconstruirDetalleMovimientos([pagina1, pagina2]);

    expect(movimientos).toHaveLength(1);
  });

  it("marca un warning cuando un movimiento queda abierto sin saldo/n°doc/sucursal", () => {
    const pagina: PdfTextItem[] = [
      ...HEADER(800),
      ...fila(790, [
        { col: "fecha", text: "01/06/2026" },
        { col: "abono", text: "$ 1.000" },
        { col: "descripcion", text: "Movimiento incompleto" },
      ]),
    ];

    const { movimientos, warnings } = reconstruirDetalleMovimientos([pagina]);

    expect(movimientos).toHaveLength(1);
    expect(movimientos[0].saldo).toBeUndefined();
    expect(warnings).toHaveLength(1);
  });
});

describe("extraerResumenSaldos", () => {
  it("extrae los totales declarados por el banco desde el texto de la página 1", () => {
    const texto =
      "Saldo inicial: $ 13.358.517 Depósitos: $ 0 Otros abonos: $ 28.831.039 " +
      "Cheques: $ 0 Otros cargos: $ 42.056.103 Impuestos: $ 0 Saldo final: $ 133.453";

    const resumen = extraerResumenSaldos(texto);

    expect(resumen).toEqual({
      saldoInicial: 13358517,
      depositos: 0,
      otrosAbonos: 28831039,
      cheques: 0,
      otrosCargos: 42056103,
      saldoFinal: 133453,
    });
  });
});

describe("parsearPaginasCartola", () => {
  it("agrega un warning cuando el total parseado no calza con el declarado por el banco", () => {
    const pagina1 = [
      { text: "Otros abonos: $ 999.999", x: 50, y: 900 },
      ...HEADER(800),
      ...fila(790, [
        { col: "fecha", text: "01/06/2026" },
        { col: "abono", text: "$ 1.066.944" },
        { col: "descripcion", text: "Abono Ventas GETNET" },
        { col: "saldo", text: "$ 11.007.059" },
        { col: "numeroDocumento", text: "88545256" },
        { col: "sucursal", text: "TEMUCO" },
      ]),
    ];

    const resultado = parsearPaginasCartola([pagina1]);

    expect(resultado.movimientos).toHaveLength(1);
    expect(resultado.warnings.some((w) => w.includes("no calza"))).toBe(true);
  });

  it("no agrega warning de checksum cuando el total parseado sí calza", () => {
    const pagina1 = [
      { text: "Otros abonos: $ 1.066.944", x: 50, y: 900 },
      ...HEADER(800),
      ...fila(790, [
        { col: "fecha", text: "01/06/2026" },
        { col: "abono", text: "$ 1.066.944" },
        { col: "descripcion", text: "Abono Ventas GETNET" },
        { col: "saldo", text: "$ 11.007.059" },
        { col: "numeroDocumento", text: "88545256" },
        { col: "sucursal", text: "TEMUCO" },
      ]),
    ];

    const resultado = parsearPaginasCartola([pagina1]);

    expect(resultado.warnings).toEqual([]);
  });
});
