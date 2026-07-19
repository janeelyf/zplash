// Forma de la respuesta de /api/pagos/precios, compartida entre las pestañas
// del portal cliente (mismo endpoint público que ya usa /pagar).
export interface PreciosPublicos {
  plan: { nombre: string; precio: number };
  planOneclick: { nombre: string; precio: number };
  lavadoUnico: { nombre: string; precio: number };
  zonaAspirado: { nombre: string; precio: number };
  servicios: { id: string; nombre: string; categoria?: string; precio: number }[];
  packsEmpresa: { cantidad: number; nombre: string; precio: number }[];
}
