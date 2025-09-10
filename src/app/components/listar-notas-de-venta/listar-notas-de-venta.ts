import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../Services/supabase.service';
import { RespuestaComponent } from '../respuesta/respuesta';
import { Loader } from '../loader/loader';
import { NotaVentaCompleta } from '../Models/nota-venta.model';

@Component({
  selector: 'app-listar-notas-de-venta',
  standalone: true,
  imports: [CommonModule, FormsModule, RespuestaComponent, Loader],
  templateUrl: './listar-notas-de-venta.html',
  styleUrl: './listar-notas-de-venta.css'
})
export class ListarNotasDeVenta implements OnInit {

  loading = false;
  notas: any[] = [];
  notaSeleccionada: NotaVentaCompleta | null = null;
  mostrandoDetalle = false;
  mensajeRespuesta = '';
  tipoRespuesta: 'error' | 'exito' = 'exito';
  mostrarRespuesta = false;
  filtroFecha = '';
  filtroCliente = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarNotasVenta();
  }

  async cargarNotasVenta() {
    this.loading = true;
    try {
      const { data, error } = await this.supabaseService.obtenerNotasVenta();
      if (error) {
        this.mostrarMensaje('Error al cargar las notas de venta', 'error');
        console.error(error);
      } else {
        this.notas = data || [];
      }
    } catch (err) {
      this.mostrarMensaje('Error al cargar las notas de venta', 'error');
      console.error(err);
    }
    this.loading = false;
  }

  async verDetalle(notaId: number) {
    this.loading = true;
    try {
      const { data, error } = await this.supabaseService.obtenerNotaVentaPorId(notaId);
      if (error) {
        this.mostrarMensaje('Error al cargar el detalle de la nota', 'error');
        console.error(error);
      } else {
        this.notaSeleccionada = data;
        this.mostrandoDetalle = true;
      }
    } catch (err) {
      this.mostrarMensaje('Error al cargar el detalle de la nota', 'error');
      console.error(err);
    }
    this.loading = false;
  }

  cerrarDetalle() {
    this.mostrandoDetalle = false;
    this.notaSeleccionada = null;
  }

  formatearFecha(fecha: string): string {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return fecha;
    }
  }

  get notasFiltradas() {
    return this.notas.filter(nota => {
      const cumpleFecha = !this.filtroFecha || 
        nota.creado_en.includes(this.filtroFecha);
      const cumpleCliente = !this.filtroCliente || 
        nota.nombre.toLowerCase().includes(this.filtroCliente.toLowerCase());
      return cumpleFecha && cumpleCliente;
    });
  }

  get totalVentas(): number {
    return this.notasFiltradas.reduce((sum, nota) => sum + nota.total, 0);
  }

  get cantidadNotasFiltradas(): number {
    return this.notasFiltradas.length;
  }

  mostrarMensaje(mensaje: string, tipo: 'error' | 'exito') {
    this.mensajeRespuesta = mensaje;
    this.tipoRespuesta = tipo;
    this.mostrarRespuesta = true;
  }

  ocultarMensaje() {
    this.mostrarRespuesta = false;
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }
}