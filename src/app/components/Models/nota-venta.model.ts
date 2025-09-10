// models/nota-venta.model.ts

export interface NotaVenta {
  id?: number;
  nombre: string;
  ruc?: string;
  cedula?: string;
  correo?: string;
  total: number;
  creado_en?: string;
}

export interface DetalleNotaVenta {
  id?: number;
  nota_venta_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  productos?: {
    nombre: string;
    codigo: string;
  };
}

export interface CrearNotaVentaRequest {
  nota: Omit<NotaVenta, 'id' | 'creado_en'>;
  detalles: Omit<DetalleNotaVenta, 'id' | 'nota_venta_id' | 'productos'>[];
}

export interface NotaVentaCompleta extends NotaVenta {
  detalles: DetalleNotaVenta[];
}