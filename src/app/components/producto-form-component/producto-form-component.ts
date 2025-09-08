import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductosService } from '../../Services/Productos.service';
import { RespuestaComponent } from '../respuesta/respuesta';
import { Loader } from '../loader/loader';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RespuestaComponent, Loader],
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
    this.productoForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(2)]],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      precio: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.modoEdicion = true;
        this.productoId = +params['id'];
        this.cargarProducto(this.productoId);
      }
    });
  }

  async cargarProducto(id: number) {
    this.loading = true;
    try {
      const { data, error } = await this.productosService.getProductoPorId(id);
      
      if (error) {
        this.mostrarMensajeRespuesta('Error al cargar el producto', 'error');
        this.volver();
        return;
      }

      if (data) {
        this.productoForm.patchValue({
          codigo: data.codigo || '',
          nombre: data.nombre || '',
          precio: data.precio || '',
          stock: data.stock || ''
        });
      }
    } catch (error) {
      this.mostrarMensajeRespuesta('Error inesperado', 'error');
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    if (this.productoForm.invalid) {
      this.marcarCamposComoTocados();
      this.mostrarMensajeRespuesta('Por favor, completa todos los campos requeridos', 'error');
      return;
    }

    this.loading = true;

    try {
      const datosProducto = this.productoForm.value;
      let resultado;
      
      if (this.modoEdicion && this.productoId) {
        resultado = await this.productosService.actualizarProducto(this.productoId, datosProducto);
      } else {
        resultado = await this.productosService.crearProducto(datosProducto);
      }

      if (resultado.error) {
        this.mostrarMensajeRespuesta('Error al guardar el producto', 'error');
      } else {
        const accion = this.modoEdicion ? 'actualizado' : 'creado';
        this.mostrarMensajeRespuesta(`Producto ${accion} correctamente`, 'exito');
        
        setTimeout(() => {
          this.volver();
        }, 2000);
      }
    } catch (error) {
      this.mostrarMensajeRespuesta('Error inesperado', 'error');
    } finally {
      this.loading = false;
    }
  }

  marcarCamposComoTocados() {
    Object.keys(this.productoForm.controls).forEach(field => {
      const control = this.productoForm.get(field);
      control?.markAsTouched();
    });
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.productoForm.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  limpiarFormulario() {
    this.productoForm.reset();
  }

  volver() {
    this.loading = true;
    this.router.navigate(['/productos']).finally(() => {
      this.loading = false;
    });
  }

  mostrarMensajeRespuesta(mensaje: string, tipo: 'error' | 'exito') {
    this.mensajeTexto = mensaje;
    this.mensajeTipo = tipo;
    this.mostrarMensaje = true;

    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.mostrarMensaje = false;
    }, 5000);
  }

  // Método para cerrar manualmente el mensaje
  cerrarMensaje() {
    this.mostrarMensaje = false;
  }

  // Getters para el template
  get codigo() { return this.productoForm.get('codigo'); }
  get nombre() { return this.productoForm.get('nombre'); }
  get precio() { return this.productoForm.get('precio'); }
  get stock() { return this.productoForm.get('stock'); }
}