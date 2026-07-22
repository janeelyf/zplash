// Máquina/equipo del túnel de lavado (ej. cepillos, secadores, bomba de
// agua) — catálogo administrable desde Libro de Mantención → Máquinas.
export interface Maquinaria {
  id: string;
  nombre: string;
  tipo?: string;
  activo: boolean;
  creadoEn: string;
  creadoPor?: string;
}

// Registro de una mantención realizada a una Maquinaria. `vehiculosDesdeUltima`
// se calcula al guardar (ver vehiculosDesdeUltimaMantencion en
// @/lib/helpers/mantencion) contando los Ingreso con fecha entre la mantención
// anterior de esta misma máquina (o Maquinaria.creadoEn si es la primera) y
// `fecha` — así queda registrado cuántos vehículos pasaron por el túnel desde
// el mantenimiento anterior, para decidir el siguiente por desgaste de uso y
// no solo por calendario.
export interface RegistroMantencion {
  id: string;
  maquinariaId: string;
  fecha: string;
  descripcion: string;
  responsable?: string;
  costo?: number;
  vehiculosDesdeUltima: number;
  notas?: string;
  creadoPor?: string;
}
