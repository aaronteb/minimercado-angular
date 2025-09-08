import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Producto {
  id?: number;
  nombre: string;
  precio: number;
  stock: number;
  descripcion?: string;
  categoria?: string;
  imagen?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

 
  getProductos() {
    return this.supabase.from('productos').select('*');
  }
 
  getProductoPorId(id: number) {
    return this.supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();
  }

  crearProducto(producto: Omit<Producto, 'id'>) {
    return this.supabase
      .from('productos')
      .insert([producto])
      .select();
  }


  actualizarProducto(id: number, producto: Partial<Producto>) {
    return this.supabase
      .from('productos')
      .update(producto)
      .eq('id', id)
      .select();
  }

  
  eliminarProducto(id: number) {
    return this.supabase
      .from('productos')
      .delete()
      .eq('id', id);
  }

 
  buscarProductosPorNombre(termino: string) {
    return this.supabase
      .from('productos')
      .select('*')
      .ilike('nombre', `%${termino}%`);
  }

 
  getProductosPorCategoria(categoria: string) {
    return this.supabase
      .from('productos')
      .select('*')
      .eq('categoria', categoria);
  }

 
  getProductosStockBajo(cantidad: number = 5) {
    return this.supabase
      .from('productos')
      .select('*')
      .lt('stock', cantidad);
  }

  
  actualizarStock(id: number, nuevoStock: number) {
    return this.supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', id)
      .select();
  }

  
  getProductosOrdenadosPorFecha(ascendente: boolean = false) {
    return this.supabase
      .from('productos')
      .select('*')
      .order('creado_en', { ascending: ascendente });
  }
}