import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductosService } from '../../Services/Productos.service';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './producto-form-component.html',
  styleUrls: ['./producto-form-component.css']
})
export class ProductoFormComponent implements OnInit {
  productoForm: FormGroup;
  loading = false;
  modoEdicion = false;
  productoId: number | null = null;
  mostrarMensaje = false;
  mensajeTexto = '';
  mensajeTipo: 'error' | 'exito' = 'error';

  constructor(
    private fb: FormBuilder,
    private productosService: ProductosService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productoForm = this.crearFormulario();
  }

  async ngOnInit() {
    // Verificar si estamos en modo edición
    this.route.params.subscribe(async params => {
      if (params['id']) {
        this.modoEdicion = true;
        this.productoId = +params['id'];
        await this.cargarProducto(this.productoId);
      }
    });
  }

  crearFormulario(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      precio: [0, [Validators.required, Validators.min(0.01), Validators.max(999999.99)]],
      stock: [0, [Validators.required, Validators.min(0), Validators.max(99999)]],
      categoria: ['', Validators.required],
      descripcion: ['', [Validators.maxLength(500)]],
      imagen: ['', [Validators.pattern(/^https?:\/\/.+/)]] // URL opcional
    });
  }

  async cargarProducto(id: number) {
    this.loading = true;
    try {
      const { data, error } = await this.productosService.getProductoPorId(id);
      
      if (error) {
        console.error('Error al cargar producto:', error);
        this.mostrarMensajeRespuesta('Error al cargar el producto', 'error');
        this.volver();
        return;
      }

      if (data) {
        this.productoForm.patchValue({
          nombre: data.nombre,
          precio: data.precio,
          stock: data.stock,
          categoria: data.categoria || '',
          descripcion: data.descripcion || '',
          imagen: data.imagen || ''
        });
      } else {
        this.mostrarMensajeRespuesta('Producto no encontrado', 'error');
        this.volver();
      }
    } catch (error) {
      console.error('Error:', error);
      this.mostrarMensajeRespuesta('Error inesperado al cargar producto', 'error');
      this.volver();
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    if (this.productoForm.invalid) {
      this.marcarCamposComoTocados();
      this.mostrarMensajeRespuesta('Por favor, corrige los errores en el formulario', 'error');
      return;
    }

    this.loading = true;

    try {
      const datosProducto = this.productoForm.value;
      
      // Limpiar datos opcionales vacíos
      if (!datosProducto.descripcion?.trim()) {
        datosProducto.descripcion = null;
      }
      if (!datosProducto.imagen?.trim()) {
        datosProducto.imagen = null;
      }

      let resultado;
      
      if (this.modoEdicion && this.productoId) {
        // Actualizar producto existente
        resultado = await this.productosService.actualizarProducto(this.productoId, datosProducto);
      } else {
        // Crear nuevo producto
        resultado = await this.productosService.crearProducto(datosProducto);
      }

      if (resultado.error) {
        console.error('Error al guardar producto:', resultado.error);
        this.mostrarMensajeRespuesta(
          `Error al ${this.modoEdicion ? 'actualizar' : 'crear'} el producto: ${resultado.error.message}`,
          'error'
        );
      } else {
        const accion = this.modoEdicion ? 'actualizado' : 'creado';
        this.mostrarMensajeRespuesta(
          `Producto "${datosProducto.nombre}" ${accion} correctamente`,
          'exito'
        );
        
        // Redireccionar después de 2 segundos
        setTimeout(() => {
          this.volver();
        }, 2000);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      this.mostrarMensajeRespuesta('Error inesperado al guardar el producto', 'error');
    } finally {
      this.loading = false;
    }
  }

  marcarCamposComoTocados() {
    Object.keys(this.productoForm.controls).forEach(field => {
      const control = this.productoForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  // Getters para facilitar la validación en el template
  get nombre() { return this.productoForm.get('nombre'); }
  get precio() { return this.productoForm.get('precio'); }
  get stock() { return this.productoForm.get('stock'); }
  get categoria() { return this.productoForm.get('categoria'); }
  get descripcion() { return this.productoForm.get('descripcion'); }
  get imagen() { return this.productoForm.get('imagen'); }

  // Métodos de validación para el template
  esCampoInvalido(campo: string): boolean {
    const control = this.productoForm.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  obtenerMensajeError(campo: string): string {
    const control = this.productoForm.get(campo);
    if (!control || !control.errors) return '';

    const errores = control.errors;

    if (errores['required']) return `${this.getNombreCampo(campo)} es requerido`;
    if (errores['minlength']) return `${this.getNombreCampo(campo)} debe tener al menos ${errores['minlength'].requiredLength} caracteres`;
    if (errores['maxlength']) return `${this.getNombreCampo(campo)} no puede exceder ${errores['maxlength'].requiredLength} caracteres`;
    if (errores['min']) return `${this.getNombreCampo(campo)} debe ser mayor a ${errores['min'].min}`;
    if (errores['max']) return `${this.getNombreCampo(campo)} no puede ser mayor a ${errores['max'].max}`;
    if (errores['pattern']) return `${this.getNombreCampo(campo)} debe ser una URL válida`;

    return 'Campo inválido';
  }

  private getNombreCampo(campo: string): string {
    const nombres: { [key: string]: string } = {
      'nombre': 'El nombre',
      'precio': 'El precio',
      'stock': 'El stock',
      'categoria': 'La categoría',
      'descripcion': 'La descripción',
      'imagen': 'La imagen'
    };
    return nombres[campo] || 'El campo';
  }

  limpiarFormulario() {
    this.productoForm.reset();
    this.productoForm.patchValue({
      codigo: '',
      precio: 0,
      stock: 0
    });
  }

  volver() {
    this.router.navigate(['/productos']);
  }

  mostrarMensajeRespuesta(mensaje: string, tipo: 'error' | 'exito') {
    this.mensajeTexto = mensaje;
    this.mensajeTipo = tipo;
    this.mostrarMensaje = true;

    setTimeout(() => {
      this.mostrarMensaje = false;
    }, 5000);
  }
}