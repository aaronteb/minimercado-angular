import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Producto, ProductosService } from '../../Services/Productos.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  productosVisibles: Producto[] = [];
  loading = true;
  searchTerm = '';
  eliminandoProducto = false;
  paginaActual = 1;
  productosPorPagina = 9;
  totalPaginas = 0;
  mostrarMensaje = false;
  mensajeTexto = '';
  mensajeTipo: 'error' | 'exito' = 'error';

  constructor(
    private productosService: ProductosService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.cargarProductos();
  }

  async cargarProductos() {
    this.loading = true;
    try {
      const { data, error } = await this.productosService.getProductos();

      if (error) {
        this.mostrarMensajeRespuesta('Error al cargar los productos', 'error');
      } else {
        this.productos = data ?? [];
        this.productosFiltrados = [...this.productos];
        this.actualizarPaginacion();
      }
    } catch (error) {
      this.mostrarMensajeRespuesta('Error inesperado al cargar productos', 'error');
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
        producto.stock.toString().includes(termino) ||
        (producto.categoria && producto.categoria.toLowerCase().includes(termino))
      );
    }
    this.paginaActual = 1;
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
      document.querySelector('.productos-grid')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
  getPaginasVisibles(): number[] {
    const paginas: number[] = [];
    const maxPaginas = 5;

    let inicio = Math.max(1, this.paginaActual - Math.floor(maxPaginas / 2));
    let fin = Math.min(this.totalPaginas, inicio + maxPaginas - 1);

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
    this.router.navigate(['/productos/nuevo']);
  }
  verDetalles(producto: Producto) {
  }

  editarProducto(producto: Producto) {
    if (producto.id) {
      this.router.navigate(['/productos/editar', producto.id]);
    } else {
      this.mostrarMensajeRespuesta('Error: El producto no tiene un ID válido', 'error');
    }
  }
  async eliminarProducto(producto: Producto) {
    if (!producto.id) {
      this.mostrarMensajeRespuesta('Error: El producto no tiene un ID válido', 'error');
      return;
    }

    const confirmar = confirm(
      `¿Estás seguro de que deseas eliminar "${producto.nombre}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) {
      return;
    }

    this.eliminandoProducto = true;

    try {
      const { error } = await this.productosService.eliminarProducto(producto.id);

      if (error) {
        this.mostrarMensajeRespuesta(`Error al eliminar el producto: ${error.message}`, 'error');
      } else {
        this.productos = this.productos.filter(p => p.id !== producto.id);
        this.productosFiltrados = this.productosFiltrados.filter(p => p.id !== producto.id);
        this.actualizarPaginacion();
        if (this.productosVisibles.length === 0 && this.paginaActual > 1) {
          this.paginaActual--;
          this.actualizarPaginacion();
        }

        this.mostrarMensajeRespuesta(`Producto "${producto.nombre}" eliminado correctamente`, 'exito');
      }
    } catch (error) {
      this.mostrarMensajeRespuesta('Error inesperado al eliminar el producto', 'error');
    } finally {
      this.eliminandoProducto = false;
    }
  }
  async filtrarPorCategoria(categoria: string) {
    this.loading = true;
    try {
      const { data, error } = await this.productosService.getProductosPorCategoria(categoria);

      if (error) {
        this.mostrarMensajeRespuesta('Error al filtrar productos', 'error');
      } else {
        this.productos = data ?? [];
        this.productosFiltrados = [...this.productos];
        this.paginaActual = 1;
        this.actualizarPaginacion();
      }
    } catch (error) {
      this.mostrarMensajeRespuesta('Error inesperado al filtrar', 'error');
    } finally {
      this.loading = false;
    }
  }
  Math = Math;

  mostrarMensajeRespuesta(mensaje: string, tipo: 'error' | 'exito') {
    this.mensajeTexto = mensaje;
    this.mensajeTipo = tipo;
    this.mostrarMensaje = true;

    setTimeout(() => {
      this.mostrarMensaje = false;
    }, 5000);
  }
}