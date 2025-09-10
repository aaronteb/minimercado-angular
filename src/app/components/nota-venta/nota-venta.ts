import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../Services/supabase.service';
import { RespuestaComponent } from '../respuesta/respuesta';
import { Loader } from '../loader/loader';
import { CrearNotaVentaRequest } from '../Models/nota-venta.model';

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
}

interface ProductoCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

@Component({
  selector: 'app-nota-venta',
  standalone: true,
  imports: [CommonModule, FormsModule, RespuestaComponent, Loader],
  templateUrl: './nota-venta.html',
  styleUrl: './nota-venta.css'
})
export class NotaVentaComponent implements OnInit {
  
  // Datos del cliente
  cliente = {
    nombre: '',
    ruc: '',
    cedula: '',
    correo: ''
  };

  // Productos y carrito
  productos: Producto[] = [];
  productoSeleccionado: Producto | null = null;
  cantidadSeleccionada: number = 1;
  carrito: ProductoCarrito[] = [];
  
  // Variables para código de barras
  codigoEscaneado: string = '';
  cantidadCodigoBarras: number = 1;
  buscandoProducto: boolean = false;
  
  // Estados
  loading = false;
  guardando = false;
  
  // Mensaje de respuesta
  mensajeRespuesta = '';
  tipoRespuesta: 'error' | 'exito' = 'exito';
  mostrarRespuesta = false;
  
  // Totales
  get total(): number {
    return this.carrito.reduce((total, item) => total + item.subtotal, 0);
  }

  get totalCantidad(): number {
    return this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
  }

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarProductos();
    this.inicializarDetectorCodigoBarras();
  }

  async cargarProductos() {
    this.loading = true;
    try {
      const { data, error } = await this.supabaseService.obtenerProductos();
      if (error) {
        this.mostrarMensaje('Error al cargar productos', 'error');
        console.error(error);
      } else {
        this.productos = data || [];
      }
    } catch (err) {
      this.mostrarMensaje('Error al cargar productos', 'error');
      console.error(err);
    }
    this.loading = false;
  }

  seleccionarProducto(producto: Producto) {
    this.productoSeleccionado = producto;
    this.cantidadSeleccionada = 1;
  }

  agregarAlCarrito() {
    if (!this.productoSeleccionado || this.cantidadSeleccionada <= 0) {
      return;
    }

    // Verificar si el producto tiene stock disponible
    if (this.productoSeleccionado.stock === 0) {
      this.mostrarMensaje(`El producto "${this.productoSeleccionado.nombre}" no tiene stock disponible`, 'error');
      return;
    }

    // Verificar stock
    if (this.cantidadSeleccionada > this.productoSeleccionado.stock) {
      this.mostrarMensaje('Cantidad mayor al stock disponible', 'error');
      return;
    }

    // Verificar si el producto ya está en el carrito
    const indiceExistente = this.carrito.findIndex(
      item => item.producto.id === this.productoSeleccionado!.id
    );

    if (indiceExistente >= 0) {
      // Actualizar cantidad
      this.carrito[indiceExistente].cantidad += this.cantidadSeleccionada;
      this.carrito[indiceExistente].subtotal = 
        this.carrito[indiceExistente].cantidad * this.carrito[indiceExistente].producto.precio;
    } else {
      // Agregar nuevo producto
      const item: ProductoCarrito = {
        producto: this.productoSeleccionado,
        cantidad: this.cantidadSeleccionada,
        subtotal: this.cantidadSeleccionada * this.productoSeleccionado.precio
      };
      this.carrito.push(item);
    }

    // Limpiar selección
    this.productoSeleccionado = null;
    this.cantidadSeleccionada = 1;
    this.ocultarMensaje();
  }

  eliminarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
  }

  actualizarCantidad(index: number, nuevaCantidad: number) {
    if (nuevaCantidad <= 0) {
      this.eliminarDelCarrito(index);
      return;
    }

    const item = this.carrito[index];
    if (nuevaCantidad > item.producto.stock) {
      this.mostrarMensaje(`Stock disponible: ${item.producto.stock}`, 'error');
      return;
    }

    item.cantidad = nuevaCantidad;
    item.subtotal = item.cantidad * item.producto.precio;
    this.ocultarMensaje();
  }

  async guardarNotaVenta() {
    if (!this.validarFormulario()) {
      return;
    }

    this.guardando = true;
    this.ocultarMensaje();

    try {
      // Si no hay nombre, usar "CONSUMIDOR FINAL"
      const nombreCliente = this.cliente.nombre.trim() || 'CONSUMIDOR FINAL';
      
      const request: CrearNotaVentaRequest = {
        nota: {
          nombre: nombreCliente,
          ruc: this.cliente.ruc?.trim() || undefined,
          cedula: this.cliente.cedula?.trim() || undefined,
          correo: this.cliente.correo?.trim() || undefined,
          total: this.total
        },
        detalles: this.carrito.map(item => ({
          producto_id: item.producto.id,
          cantidad: item.cantidad,
          precio_unitario: item.producto.precio,
          subtotal: item.subtotal
        }))
      };

      const { data, error } = await this.supabaseService.crearNotaVenta(request);
      
      if (error) {
        this.mostrarMensaje('Error al guardar la nota de venta', 'error');
        console.error(error);
      } else {
        this.mostrarMensaje('Nota de venta guardada exitosamente', 'exito');
        this.limpiarFormulario();
        // Recargar productos para mostrar stock actualizado
        await this.cargarProductos();
      }
    } catch (err) {
      this.mostrarMensaje('Error al guardar la nota de venta', 'error');
      console.error(err);
    }
    
    this.guardando = false;
  }

  validarFormulario(): boolean {
    // Solo validar que haya productos en el carrito
    if (this.carrito.length === 0) {
      this.mostrarMensaje('Debe agregar al menos un producto', 'error');
      return false;
    }

    return true;
  }

  limpiarFormulario() {
    this.cliente = {
      nombre: '',
      ruc: '',
      cedula: '',
      correo: ''
    };
    this.carrito = [];
    this.productoSeleccionado = null;
    this.cantidadSeleccionada = 1;
    this.ocultarMensaje();
  }

  // Métodos para manejar mensajes
  mostrarMensaje(mensaje: string, tipo: 'error' | 'exito') {
    this.mensajeRespuesta = mensaje;
    this.tipoRespuesta = tipo;
    this.mostrarRespuesta = true;
  }

  ocultarMensaje() {
    this.mostrarRespuesta = false;
  }

  // ====== MÉTODOS PARA CÓDIGO DE BARRAS ======

  // Inicializar detector de código de barras
  inicializarDetectorCodigoBarras() {
    // Escuchar eventos de teclado para la pistola
    document.addEventListener('keydown', (event) => {
      // Solo procesar si no estamos en un input
      if (document.activeElement?.tagName === 'INPUT') {
        return;
      }

      // La pistola generalmente envía Enter al final
      if (event.key === 'Enter' && this.codigoEscaneado.length > 0) {
        this.procesarCodigoBarras(this.codigoEscaneado);
        this.codigoEscaneado = '';
      } 
      // Acumular caracteres del código
      else if (event.key.length === 1) {
        this.codigoEscaneado += event.key;
        // Limpiar después de 1 segundo si no hay Enter
        setTimeout(() => {
          if (this.codigoEscaneado.length > 0) {
            this.codigoEscaneado = '';
          }
        }, 1000);
      }
    });
  }

  // Procesar código de barras escaneado
  async procesarCodigoBarras(codigoProducto: string) {
    if (!codigoProducto || codigoProducto.length < 1) return;

    this.buscandoProducto = true;
    this.ocultarMensaje();

    try {
      // Buscar producto por su campo 'codigo' que corresponde al código de barras
      const productoEncontrado = this.productos.find(p => p.codigo === codigoProducto);

      if (productoEncontrado) {
        // Producto encontrado - intentar agregar automáticamente
        if (this.agregarProductoPorCodigo(productoEncontrado, this.cantidadCodigoBarras)) {
          this.mostrarMensaje(`Producto agregado: ${productoEncontrado.nombre}`, 'exito');
        }
        // Si no se agregó, el mensaje de error ya se mostró en agregarProductoPorCodigo
      } else {
        // Producto no encontrado - mostrar opción para agregarlo
        this.mostrarMensaje(`Producto no encontrado con código: ${codigoProducto}`, 'error');
        this.manejarProductoNoEncontrado(codigoProducto);
      }
    } catch (error) {
      this.mostrarMensaje('Error al procesar código de barras', 'error');
      console.error(error);
    }

    this.buscandoProducto = false;
  }

  // Agregar producto por código de barras
  agregarProductoPorCodigo(producto: Producto, cantidad: number = 1): boolean {
    // Verificar si el producto tiene stock disponible
    if (producto.stock === 0) {
      this.mostrarMensaje(`El producto "${producto.nombre}" no tiene stock disponible`, 'error');
      return false;
    }

    // Verificar stock
    if (cantidad > producto.stock) {
      this.mostrarMensaje(`Stock insuficiente. Disponible: ${producto.stock}`, 'error');
      return false;
    }

    // Verificar si el producto ya está en el carrito
    const indiceExistente = this.carrito.findIndex(item => item.producto.id === producto.id);

    if (indiceExistente >= 0) {
      // Verificar que no exceda el stock al sumar
      const nuevaCantidad = this.carrito[indiceExistente].cantidad + cantidad;
      if (nuevaCantidad > producto.stock) {
        this.mostrarMensaje(`Stock insuficiente. Disponible: ${producto.stock}`, 'error');
        return false;
      }

      // Actualizar cantidad existente
      this.carrito[indiceExistente].cantidad = nuevaCantidad;
      this.carrito[indiceExistente].subtotal = 
        this.carrito[indiceExistente].cantidad * this.carrito[indiceExistente].producto.precio;
    } else {
      // Agregar nuevo producto
      const item: ProductoCarrito = {
        producto: producto,
        cantidad: cantidad,
        subtotal: cantidad * producto.precio
      };
      this.carrito.push(item);
    }

    return true;
  }

  // Manejar producto no encontrado
  manejarProductoNoEncontrado(codigoProducto: string) {
    console.log(`Código de producto no encontrado: ${codigoProducto}`);
    
    const agregarNuevo = confirm(`¿Desea agregar un nuevo producto con código ${codigoProducto}?`);
    if (agregarNuevo) {
      this.router.navigate(['/productos/nuevo'], { 
        queryParams: { codigo: codigoProducto } 
      });
    }
  }

  // Buscar producto manualmente por código
  async buscarPorCodigo() {
    if (!this.codigoEscaneado.trim()) {
      this.mostrarMensaje('Ingrese un código para buscar', 'error');
      return;
    }

    await this.procesarCodigoBarras(this.codigoEscaneado.trim());
    this.codigoEscaneado = '';
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }
}