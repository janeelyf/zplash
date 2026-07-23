"use client";

import { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { generarFolioTraspaso, productoPermitidoEnDestino, stockPorDestino, uid } from "@/lib/helpers";
import type { MovimientoInventario } from "@/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function TraspasoModal({ productoId }: { productoId?: string }) {
  const { data, ui, commit, patchUi } = useApp();
  const cantidadRef = useRef<HTMLInputElement>(null);
  const notasRef = useRef<HTMLInputElement>(null);
  const [productoSel, setProductoSel] = useState(productoId || data.productos.find((p) => p.activo)?.id || "");
  const bodega = data.destinosInventario.find((d) => d.esBodega);
  const [origenSel, setOrigenSel] = useState(bodega?.id || "");
  const [destinoSel, setDestinoSel] = useState("");
  const [err, setErr] = useState("");

  const cerrar = () => patchUi({ modal: null });

  const destinosActivos = data.destinosInventario.filter((d) => d.activo);
  const productosOrdenados = [...data.productos].filter((p) => p.activo).sort((a, b) => a.sku.localeCompare(b.sku));

  const producto = data.productos.find((p) => p.id === productoSel);
  const stockActual = producto ? stockPorDestino(producto, data.destinosInventario, data.movimientosInventario) : new Map<string, number>();
  const destinosPermitidos = producto
    ? destinosActivos.filter((d) => productoPermitidoEnDestino(producto, d))
    : destinosActivos;

  const guardar = async () => {
    const cantidad = Number(cantidadRef.current?.value) || 0;

    if (!productoSel) {
      setErr("Selecciona un producto");
      return;
    }
    if (!origenSel || !destinoSel) {
      setErr("Selecciona origen y destino");
      return;
    }
    if (origenSel === destinoSel) {
      setErr("El origen y el destino no pueden ser el mismo");
      return;
    }
    const destino = data.destinosInventario.find((d) => d.id === destinoSel);
    if (producto && destino && !productoPermitidoEnDestino(producto, destino)) {
      setErr(`Este producto no puede estar en "${destino.nombre}"`);
      return;
    }
    if (cantidad <= 0) {
      setErr("La cantidad debe ser mayor a 0");
      return;
    }
    const disponibleEnOrigen = stockActual.get(origenSel) ?? 0;
    if (cantidad > disponibleEnOrigen) {
      setErr(`No hay suficiente stock en el origen (disponible: ${disponibleEnOrigen})`);
      return;
    }

    const nuevo: MovimientoInventario = {
      id: uid(),
      folio: generarFolioTraspaso(data.movimientosInventario.map((m) => m.folio)),
      productoId: productoSel,
      origenId: origenSel,
      destinoId: destinoSel,
      cantidad,
      fecha: new Date().toISOString(),
      notas: notasRef.current?.value.trim() || undefined,
      creadoPor: ui.perfilActual?.nombre || "Administrador",
    };
    const ok = await commit({ movimientosInventario: [...data.movimientosInventario, nuevo] });
    if (!ok) {
      setErr("No se pudo guardar el traspaso (sin conexión). Intenta de nuevo.");
      return;
    }
    cerrar();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && cerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo traspaso</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Producto</Label>
            <Select value={productoSel} onValueChange={(v) => setProductoSel(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {productosOrdenados.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.sku} — {p.detalle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Origen</Label>
            <Select value={origenSel} onValueChange={(v) => setOrigenSel(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {destinosActivos.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombre} (disponible: {stockActual.get(d.id) ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Destino</Label>
            <Select value={destinoSel} onValueChange={(v) => setDestinoSel(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un destino" />
              </SelectTrigger>
              <SelectContent>
                {destinosPermitidos.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombre} (disponible: {stockActual.get(d.id) ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="traspaso-cantidad">Cantidad</Label>
            <Input id="traspaso-cantidad" ref={cantidadRef} type="number" min={1} placeholder="0" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="traspaso-notas">Notas (opcional)</Label>
            <Input id="traspaso-notas" ref={notasRef} placeholder="Ej: carga semanal" />
          </div>

          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={cerrar}>
            Cancelar
          </Button>
          <Button onClick={guardar}>Guardar traspaso</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
