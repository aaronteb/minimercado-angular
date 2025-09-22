import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { SupabaseService } from '../../Services/supabase.service';
import { RespuestaComponent } from '../respuesta/respuesta';

interface ResumenVentas {
  totalVentas: number;
  cantidadNotas: number;
  ventaPromedio: number;
  ventasPorDia: { fecha: string; total: number }[];
}

@Component({
  selector: 'app-reporteria',
  imports: [CommonModule, FormsModule, RespuestaComponent],
  templateUrl: './reporteria.html',
  styleUrl: './reporteria.css'
})
export class ReporteriaComponent implements OnInit {
  mensajeRespuesta: string = '';
  tipoRespuesta: 'error' | 'exito' = 'exito';
  mostrarRespuesta: boolean = false;

  // Filtros de fecha
  anioSeleccionado: number = new Date().getFullYear();
  mesSeleccionado: number = new Date().getMonth() + 1;
  
  // Datos para gráficas
  ventasPorMes: { mes: string; total: number }[] = [];
  resumenMesActual: ResumenVentas | null = null;
  
  // Estados de carga
  cargandoGraficas: boolean = false;
  cargandoResumen: boolean = false;

  // Opciones de meses
  meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  constructor(
    private supabaseService: SupabaseService,
    private router: Router 
  ) {}

  async ngOnInit() {
    await this.cargarDatosGenerales();
    await this.cargarResumenMes();
  }

  volverAlDashboard() {
    this.router.navigate(['/dashboard']);
  }

  async cargarDatosGenerales() {
    this.cargandoGraficas = true;
    try {
      this.ventasPorMes = await this.supabaseService.obtenerVentasPorMes();
    } catch (error) {
      this.mostrarMensaje('Error al cargar datos generales', 'error');
    } finally {
      this.cargandoGraficas = false;
    }
  }

  async cargarResumenMes() {
    this.cargandoResumen = true;
    try {
      this.resumenMesActual = await this.supabaseService.obtenerResumenVentasMes(
        this.anioSeleccionado, 
        this.mesSeleccionado
      );
    } catch (error) {
      this.mostrarMensaje('Error al cargar resumen del mes', 'error');
    } finally {
      this.cargandoResumen = false;
    }
  }

  async onFiltroChange() {
    await this.cargarResumenMes();
  }

  async exportarExcelGeneral() {
    try {
      if (!this.ventasPorMes || this.ventasPorMes.length === 0) {
        this.mostrarMensaje('No hay datos de ventas para exportar', 'error');
        return;
      }

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.ventasPorMes);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'VentasPorMes');
       
      const excelBuffer: any = XLSX.write(wb, {
        bookType: 'xlsx',
        type: 'array',
      });
           
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(data, 'Reporte_Ventas_General.xlsx');
      
      this.mostrarMensaje('Reporte general exportado exitosamente', 'exito');
          
    } catch (error) {
      this.mostrarMensaje('Error al exportar el reporte general', 'error');
    }
  }

  async exportarExcelMesEspecifico() {
    try {
      if (!this.resumenMesActual?.ventasPorDia || this.resumenMesActual.ventasPorDia.length === 0) {
        this.mostrarMensaje('No hay datos para el mes seleccionado', 'error');
        return;
      }

      const nombreMes = this.meses.find(m => m.valor === this.mesSeleccionado)!.nombre;
      
      // Crear hojas separadas
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      
      // Hoja 1: Resumen
      const resumen = [
        ['Mes', `${nombreMes} ${this.anioSeleccionado}`],
        ['Total Ventas', this.resumenMesActual.totalVentas],
        ['Cantidad de Notas', this.resumenMesActual.cantidadNotas],
        ['Venta Promedio', this.resumenMesActual.ventaPromedio.toFixed(2)]
      ];
      const wsResumen = XLSX.utils.aoa_to_sheet(resumen);
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

      // Hoja 2: Ventas por día
      const wsDetalle = XLSX.utils.json_to_sheet(this.resumenMesActual.ventasPorDia);
      XLSX.utils.book_append_sheet(wb, wsDetalle, 'VentasPorDia');
       
      const excelBuffer: any = XLSX.write(wb, {
        bookType: 'xlsx',
        type: 'array',
      });
           
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(data, `Reporte_${nombreMes}_${this.anioSeleccionado}.xlsx`);
      
      this.mostrarMensaje(`Reporte de ${nombreMes} exportado exitosamente`, 'exito');
          
    } catch (error) {
      this.mostrarMensaje('Error al exportar el reporte del mes', 'error');
    }
  }

  private mostrarMensaje(mensaje: string, tipo: 'error' | 'exito') {
    this.mensajeRespuesta = mensaje;
    this.tipoRespuesta = tipo;
    this.mostrarRespuesta = true;

    if (tipo === 'exito') {
      setTimeout(() => {
        this.mostrarRespuesta = false;
      }, 5000);
    }
  }

  // Método para obtener el máximo valor para escalar las barras
  getMaxVentaMes(): number {
    if (!this.ventasPorMes.length) return 0;
    return Math.max(...this.ventasPorMes.map(v => v.total));
  }

  getMaxVentaDia(): number {
    if (!this.resumenMesActual?.ventasPorDia.length) return 0;
    return Math.max(...this.resumenMesActual.ventasPorDia.map(v => v.total));
  }

  // Método para calcular el ancho de las barras (porcentaje)
  getAnchoBarra(valor: number, maximo: number): number {
    return maximo > 0 ? (valor / maximo) * 100 : 0;
  }

  // Formatear números como moneda
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(valor);
  }
}