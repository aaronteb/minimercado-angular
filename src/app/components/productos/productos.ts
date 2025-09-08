import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../Services/supabase.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit {
  productos: any[] = [];
  productosFiltrados: any[] = [];
  productosVisibles: any[] = [];
  loading = true;
  searchTerm = '';

  // Paginación
  paginaActual = 1;
  productosPorPagina = 9;
  totalPaginas = 0;
  mostrarMensaje = false;
  mensajeTexto = '';
  mensajeTipo: 'error' | 'exito' = 'error';

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.cargarProductos();
  }

  async cargarProductos() {
    this.loading = true;
    try {
      const { data, error } = await this.supabase.getProductos();
      if (error) {
        console.error('Error al cargar productos:', error);
      } else {
        this.productos = data ?? [];
        this.productosFiltrados = [...this.productos];
        this.actualizarPaginacion();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      this.loading = false;
    }
  }

  filtrarProductos() {
    if (!this.searchTerm.trim()) {
      this.productosFiltrados = [...this.productos];
    } else {
      const termino = this.searchTerm.toLowerCase().trim();
      this.productosFiltrados = this.productos.filter(producto =>
        producto.nombre.toLowerCase().includes(termino) ||
        producto.precio.toString().includes(termino) ||
        producto.stock.toString().includes(termino)
      );
    }
    this.paginaActual = 1; // Resetear a primera página al filtrar
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.productosFiltrados.length / this.productosPorPagina);
    const inicio = (this.paginaActual - 1) * this.productosPorPagina;
    const fin = inicio + this.productosPorPagina;
    this.productosVisibles = this.productosFiltrados.slice(inicio, fin);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
      // Scroll suave hacia arriba
      document.querySelector('.productos-grid')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  getPaginasVisibles(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5; // Mostrar máximo 5 números de página

    let inicio = Math.max(1, this.paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.totalPaginas, inicio + maxPaginas - 1);

    // Ajustar si estamos cerca del final
    if (fin - inicio < maxPaginas - 1) {
      inicio = Math.max(1, fin - maxPaginas + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }

  agregarProducto() {
    console.log('Agregar nuevo producto');
    // Implementar navegación al formulario de agregar producto
  }

  verDetalles(producto: any) {
    console.log('Ver detalles de:', producto);
    // Implementar navegación a detalles del producto
  }

  editarProducto(producto: any) {
    console.log('Editar producto:', producto);
    // Implementar edición de producto
  }

  async eliminarProducto(producto: any) {
    if (confirm(`¿Estás seguro de que deseas eliminar ${producto.nombre}?`)) {
      console.log('Eliminar producto:', producto);
      // Implementar eliminación de producto
    }
  }

  // Necesario para usar Math.min en el template
  Math = Math;

  mostrarMensajeRespuesta(mensaje: string, tipo: 'error' | 'exito') {
    this.mensajeTexto = mensaje;
    this.mensajeTipo = tipo;
    this.mostrarMensaje = true;

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.mostrarMensaje = false;
    }, 5000);
  }
}