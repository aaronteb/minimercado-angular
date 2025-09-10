import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { CrearNotaVentaRequest, NotaVentaCompleta } from '../components/Models/nota-venta.model';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          storage: window.localStorage,
          persistSession: true,
          autoRefreshToken: true
        }
      }
    );
  }

  private getFechaLocal(): string {
    const ahora = new Date();
    const fechaLocal = new Date(ahora.getTime() - (5 * 60 * 60 * 1000)); // UTC-5
    return fechaLocal.toISOString().replace('T', ' ').substring(0, 19);
  }
  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  }

  async logout() {
    await this.supabase.auth.signOut();
  }

  getUser() {
    return this.supabase.auth.getUser();
  }

  getCurrentSession() {
    return this.supabase.auth.getSession();
  }

  async setSession(accessToken: string, refreshToken: string) {
    const { data, error } = await this.supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    return { data, error };
  }

  async recuperarPassword(email: string) {
    return this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://aaronteb.github.io/minimercado-angular/#/reset-password'
    });
  }

  async actualizarPassword(newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  }

  async crearNotaVenta(request: CrearNotaVentaRequest) {
    try {
      const { data: notaCreada, error: errorNota } = await this.supabase
        .from('notas_venta')
        .insert([{ ...request.nota, creado_en: this.getFechaLocal() }])
        .select()
        .single();

      if (errorNota) {
        return { data: null, error: errorNota };
      }

      const detallesConNotaId = request.detalles.map(detalle => ({
        ...detalle,
        nota_venta_id: notaCreada.id
      }));

      const { data: detallesCreados, error: errorDetalles } = await this.supabase
        .from('detalle_nota_venta')
        .insert(detallesConNotaId)
        .select();

      if (errorDetalles) {
        await this.supabase
          .from('notas_venta')
          .delete()
          .eq('id', notaCreada.id);
        
        return { data: null, error: errorDetalles };
      }

      for (const detalle of request.detalles) {
        const { data: producto } = await this.supabase
          .from('productos')
          .select('stock')
          .eq('id', detalle.producto_id)
          .single();

        if (producto) {
          const nuevoStock = producto.stock - detalle.cantidad;
          await this.supabase
            .from('productos')
            .update({ stock: nuevoStock })
            .eq('id', detalle.producto_id);
        }
      }

      return { 
        data: { 
          nota: notaCreada, 
          detalles: detallesCreados 
        }, 
        error: null 
      };

    } catch (error) {
      return { data: null, error };
    }
  }

  async obtenerNotasVenta() {
    return await this.supabase
      .from('notas_venta')
      .select('*')
      .order('creado_en', { ascending: false });
  }

  async obtenerNotaVentaPorId(id: number): Promise<{ data: NotaVentaCompleta | null, error: any }> {
    const { data: nota, error: errorNota } = await this.supabase
      .from('notas_venta')
      .select('*')
      .eq('id', id)
      .single();

    if (errorNota) {
      return { data: null, error: errorNota };
    }

    const { data: detalles, error: errorDetalles } = await this.supabase
      .from('detalle_nota_venta')
      .select(`
        *,
        productos:producto_id (
          nombre,
          codigo
        )
      `)
      .eq('nota_venta_id', id);

    if (errorDetalles) {
      return { data: null, error: errorDetalles };
    }

    return {
      data: {
        ...nota,
        detalles: detalles || []
      },
      error: null
    };
  }

  async obtenerProductos() {
    return await this.supabase
      .from('productos')
      .select('*')
      .order('nombre');
  }
}