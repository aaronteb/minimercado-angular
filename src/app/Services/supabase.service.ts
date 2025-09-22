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
  async obtenerVentasPorMes(): Promise<{ mes: string; total: number }[]> {
    const { data: notas, error } = await this.supabase
      .from('notas_venta')
      .select('total, creado_en');

    if (error) return [];
    const ventasPorMes: Record<string, number> = {};
    notas.forEach((nota: any) => {
      const fecha = new Date(nota.creado_en);
      const mes = `${fecha.getFullYear()}-${(fecha.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`; 
      ventasPorMes[mes] = (ventasPorMes[mes] || 0) + nota.total;
    });

    // Convertir a array
    return Object.keys(ventasPorMes).map(mes => ({
      mes,
      total: ventasPorMes[mes],
    }));
  }
async obtenerVentasPorMesEspecifico(año: number, mes: number): Promise<{ fecha: string; total: number }[]> {
  const inicioMes = `${año}-${mes.toString().padStart(2, '0')}-01`;
  const finMes = new Date(año, mes, 0).getDate(); // Último día del mes
  const finMesStr = `${año}-${mes.toString().padStart(2, '0')}-${finMes}`;

  const { data: notas, error } = await this.supabase
    .from('notas_venta')
    .select('total, creado_en')
    .gte('creado_en', inicioMes)
    .lte('creado_en', finMesStr + ' 23:59:59');

  if (error) return [];
  const ventasPorDia: Record<string, number> = {};
  notas.forEach((nota: any) => {
    const fecha = new Date(nota.creado_en);
    const dia = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
    ventasPorDia[dia] = (ventasPorDia[dia] || 0) + nota.total;
  });

  return Object.keys(ventasPorDia).map(fecha => ({
    fecha,
    total: ventasPorDia[fecha],
  }));
}

async obtenerResumenVentasMes(año: number, mes: number): Promise<{
  totalVentas: number;
  cantidadNotas: number;
  ventaPromedio: number;
  ventasPorDia: { fecha: string; total: number }[];
}> {
  const inicioMes = `${año}-${mes.toString().padStart(2, '0')}-01`;
  const finMes = new Date(año, mes, 0).getDate();
  const finMesStr = `${año}-${mes.toString().padStart(2, '0')}-${finMes}`;

  const { data: notas, error } = await this.supabase
    .from('notas_venta')
    .select('total, creado_en')
    .gte('creado_en', inicioMes)
    .lte('creado_en', finMesStr + ' 23:59:59');

  if (error) {
    return {
      totalVentas: 0,
      cantidadNotas: 0,
      ventaPromedio: 0,
      ventasPorDia: []
    };
  }

  const totalVentas = notas.reduce((sum, nota) => sum + nota.total, 0);
  const cantidadNotas = notas.length;
  const ventaPromedio = cantidadNotas > 0 ? totalVentas / cantidadNotas : 0;
  const ventasPorDia: Record<string, number> = {};
  notas.forEach((nota: any) => {
    const fecha = new Date(nota.creado_en);
    const dia = fecha.toISOString().split('T')[0];
    ventasPorDia[dia] = (ventasPorDia[dia] || 0) + nota.total;
  });

  const ventasPorDiaArray = Object.keys(ventasPorDia)
    .sort()
    .map(fecha => ({
      fecha,
      total: ventasPorDia[fecha],
    }));

  return {
    totalVentas,
    cantidadNotas,
    ventaPromedio,
    ventasPorDia: ventasPorDiaArray
  };
}
}