"use client";

import { useApp } from "@/context/AppContext";
import {
  fmtCLP,
  inRange,
  mesPasadoRango,
  planStatus,
  primerDiaMesActualYMD,
  todayStr,
  todayYMD,
} from "@/lib/helpers";
import type { Cliente } from "@/types";

export default function StatsTab() {
  const { data, ui, patchUi } = useApp();
  const hoy = todayStr();
  const ingresosHoy = data.ingresos.filter((i) => new Date(i.fecha).toDateString() === hoy).length;
  const vencidos = data.clientes.filter((c) => planStatus(c).label === "Vencido").length;
  const sinPlan = data.clientes.filter((c) => planStatus(c).label === "Sin plan").length;
  const porVencer = data.clientes.filter((c) => planStatus(c).cls === "warn").length;
  const vigentes = data.clientes.filter((c) => planStatus(c).cls !== "bad");
  const vigentesWeb = vigentes.filter((c) => c.origen === "WEB").length;
  const vigentesLocal = vigentes.length - vigentesWeb;

  // Promedio diario de lavados en lo que va del mes (ingresos del 1° del mes a hoy / días transcurridos).
  const diasTranscurridosMes = new Date().getDate();
  const ingresosMesActual = data.ingresos.filter((i) => inRange(i.fecha, primerDiaMesActualYMD(), todayYMD()));
  const promedioLavadosDiarios = diasTranscurridosMes ? ingresosMesActual.length / diasTranscurridosMes : 0;

  // --- Resumen por período (fechas seleccionables) ---
  const desde = ui.statsDesde || primerDiaMesActualYMD();
  const hasta = ui.statsHasta || todayYMD();

  const cuponPorCodigo = new Map(data.cupones.map((c) => [c.codigo, c]));
  const cuponValor = (cuponCodigo: string | undefined) =>
    (cuponCodigo && cuponPorCodigo.get(cuponCodigo)?.valor) || 0;

  // Las garantías (relavado gratis por reclamo) no se consideran en este resumen. Los ingresos con
  // glosa propia (p. ej. "Limpieza Completa" de un detailing, ya cobrado como servicio adicional) sí
  // se cuentan, pero en su propio bucket: no son plan, ni $9.990, ni ticket.
  const ingresosPeriodo = data.ingresos.filter((i) => inRange(i.fecha, desde, hasta) && !i.esGarantia);
  const conPlan = ingresosPeriodo.filter((i) => !i.viaCupon && !i.glosa && i.planEstadoAlIngreso !== "bad");
  const por9990 = ingresosPeriodo.filter((i) => !i.viaCupon && !i.glosa && i.planEstadoAlIngreso === "bad");
  const ticketGratis = ingresosPeriodo.filter((i) => i.viaCupon && cuponValor(i.cuponCodigo) === 0);
  const ticketPagado = ingresosPeriodo.filter((i) => i.viaCupon && cuponValor(i.cuponCodigo) > 0);
  const limpiezasCompletas = ingresosPeriodo.filter((i) => !i.viaCupon && i.glosa);

  const totalPeriodo = ingresosPeriodo.length;
  const pct = (n: number) => (totalPeriodo ? ((n / totalPeriodo) * 100).toFixed(1) : "0.0") + "%";
  const pctTickets = pct(ticketGratis.length + ticketPagado.length);
  const pctPlanes = pct(conPlan.length);
  const pct9990 = pct(por9990.length);
  const pctLimpiezas = pct(limpiezasCompletas.length);

  // --- Uso de clientes con plan y ranking, fijo al mes calendario anterior ---
  const { desde: mpDesde, hasta: mpHasta } = mesPasadoRango();
  const ingresosMesPasado = data.ingresos.filter((i) => inRange(i.fecha, mpDesde, mpHasta));
  const clientesPorId = new Map(data.clientes.map((c) => [c.id, c]));

  const visitasPorCliente = new Map<string, number>();
  ingresosMesPasado.forEach((i) => {
    if (!i.clienteId) return;
    visitasPorCliente.set(i.clienteId, (visitasPorCliente.get(i.clienteId) || 0) + 1);
  });

  const clientesConPlan = data.clientes.filter((c) => c.plan);
  const totalVisitasPlan = clientesConPlan.reduce((s, c) => s + (visitasPorCliente.get(c.id) || 0), 0);
  const promedioVisitasPlan = clientesConPlan.length ? totalVisitasPlan / clientesConPlan.length : 0;

  const conVisitas = Array.from(visitasPorCliente.entries())
    .map(([clienteId, cantidad]) => ({ cliente: clientesPorId.get(clienteId), cantidad }))
    .filter((x): x is { cliente: Cliente; cantidad: number } => !!x.cliente);

  const ordenNombre = (a: { cliente: Cliente }, b: { cliente: Cliente }) =>
    a.cliente.nombre.localeCompare(b.cliente.nombre, "es");

  const top10 = [...conVisitas].sort((a, b) => b.cantidad - a.cantidad || ordenNombre(a, b)).slice(0, 10);
  const bottom10 = [...conVisitas].sort((a, b) => a.cantidad - b.cantidad || ordenNombre(a, b)).slice(0, 10);

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="num">{data.clientes.length}</div>
          <div className="lbl">Clientes totales</div>
        </div>
        <div className="stat-card">
          <div className="num">{ingresosHoy}</div>
          <div className="lbl">Ingresos hoy</div>
        </div>
        <div className="stat-card">
          <div className="num">{data.ingresos.length}</div>
          <div className="lbl">Ingresos históricos</div>
        </div>
        <div className="stat-card">
          <div className="num">{porVencer}</div>
          <div className="lbl">Planes por vencer</div>
        </div>
        <div className="stat-card">
          <div className="num">{vencidos}</div>
          <div className="lbl">Planes vencidos</div>
        </div>
        <div className="stat-card">
          <div className="num">{sinPlan}</div>
          <div className="lbl">Sin plan</div>
        </div>
        <div className="stat-card">
          <div className="num">{vigentes.length}</div>
          <div className="lbl">Planes vigentes</div>
        </div>
        <div className="stat-card">
          <div className="num">{vigentesWeb}</div>
          <div className="lbl">Vigentes · Web</div>
        </div>
        <div className="stat-card">
          <div className="num">{vigentesLocal}</div>
          <div className="lbl">Vigentes · Local</div>
        </div>
        <div className="stat-card">
          <div className="num">{promedioLavadosDiarios.toFixed(1)}</div>
          <div className="lbl">Promedio lavados/día (mes actual)</div>
        </div>
      </div>

      <h3 style={{ fontSize: 16, color: "var(--gold)", margin: "24px 0 10px" }}>Resumen por período</h3>
      <div className="toolbar">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase" }}>Desde</label>
          <input
            type="date"
            value={desde}
            style={{ maxWidth: 170 }}
            onChange={(e) => patchUi({ statsDesde: e.target.value })}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase" }}>Hasta</label>
          <input
            type="date"
            value={hasta}
            style={{ maxWidth: 170 }}
            onChange={(e) => patchUi({ statsHasta: e.target.value })}
          />
        </div>
        <button
          className="btn ghost"
          style={{ alignSelf: "flex-end" }}
          onClick={() => patchUi({ statsDesde: primerDiaMesActualYMD(), statsHasta: todayYMD() })}
        >
          Mes actual
        </button>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="num">{conPlan.length}</div>
          <div className="lbl">Autos con plan</div>
        </div>
        <div className="stat-card">
          <div className="num">{por9990.length}</div>
          <div className="lbl">Autos por {fmtCLP(9990)}</div>
        </div>
        <div className="stat-card">
          <div className="num">{ticketGratis.length}</div>
          <div className="lbl">Ticket gratis</div>
        </div>
        <div className="stat-card">
          <div className="num">{ticketPagado.length}</div>
          <div className="lbl">Ticket pagado</div>
        </div>
        <div className="stat-card">
          <div className="num">{limpiezasCompletas.length}</div>
          <div className="lbl">Limpiezas completas</div>
        </div>
      </div>

      <h3 style={{ fontSize: 16, color: "var(--gold)", margin: "24px 0 10px" }}>Distribución de ingresos por tipo</h3>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="num">{pctPlanes}</div>
          <div className="lbl">% Planes</div>
        </div>
        <div className="stat-card">
          <div className="num">{pct9990}</div>
          <div className="lbl">% {fmtCLP(9990)}</div>
        </div>
        <div className="stat-card">
          <div className="num">{pctTickets}</div>
          <div className="lbl">% Tickets</div>
        </div>
        <div className="stat-card">
          <div className="num">{pctLimpiezas}</div>
          <div className="lbl">% Limpiezas completas</div>
        </div>
      </div>

      <h3 style={{ fontSize: 16, color: "var(--gold)", margin: "24px 0 10px" }}>Uso de planes · mes pasado</h3>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="num">{promedioVisitasPlan.toFixed(1)}</div>
          <div className="lbl">Promedio de pasadas por cliente con plan ({clientesConPlan.length} clientes)</div>
        </div>
      </div>

      <h3 style={{ fontSize: 16, color: "var(--gold)", margin: "24px 0 10px" }}>
        Top 10 clientes que más pasaron · mes pasado
      </h3>
      <table style={{ marginBottom: 24 }}>
        <thead>
          <tr>
            <th>Patente</th>
            <th>Cliente</th>
            <th>Pasadas</th>
          </tr>
        </thead>
        <tbody>
          {top10.length === 0 ? (
            <tr>
              <td colSpan={3}>
                <div className="empty">Sin ingresos el mes pasado</div>
              </td>
            </tr>
          ) : (
            top10.map(({ cliente, cantidad }) => (
              <tr key={cliente.id}>
                <td className="plate-tag">{cliente.patente}</td>
                <td>{cliente.nombre}</td>
                <td>{cantidad}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3 style={{ fontSize: 16, color: "var(--gold)", margin: "24px 0 10px" }}>
        Top 10 clientes que menos pasaron · mes pasado
      </h3>
      <table>
        <thead>
          <tr>
            <th>Patente</th>
            <th>Cliente</th>
            <th>Pasadas</th>
          </tr>
        </thead>
        <tbody>
          {bottom10.length === 0 ? (
            <tr>
              <td colSpan={3}>
                <div className="empty">Sin ingresos el mes pasado</div>
              </td>
            </tr>
          ) : (
            bottom10.map(({ cliente, cantidad }) => (
              <tr key={cliente.id}>
                <td className="plate-tag">{cliente.patente}</td>
                <td>{cliente.nombre}</td>
                <td>{cantidad}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
