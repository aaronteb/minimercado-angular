import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RespuestaComponent } from '../respuesta/respuesta';
import { RecuperarContrasenaComponent } from '../recuperar-contrasena/recuperar-contrasena';
import { Loader } from '../loader/loader';
import { SupabaseService } from '../../Services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RespuestaComponent, RecuperarContrasenaComponent, Loader], 
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  mensaje: string = '';
  tipo: 'exito' | 'error' = 'exito';
  mostrarMensaje: boolean = false;
  mostrarRecuperacion: boolean = false;
  cargando: boolean = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}
  async login() {
    if (!this.email || !this.password) {
      this.mostrar('Ingresa email y contraseña', 'error');
      return;
    }
    this.cargando = true;
    try {
      const { data, error } = await this.supabaseService.login(this.email, this.password);

      if (error) {
        let msg = 'Ocurrió un error';
        if (error.message.includes('Invalid login credentials')) msg = 'Usuario o contraseña incorrectos';
        else if (error.message.includes('user not found')) msg = 'El usuario no existe';
        this.mostrar(msg, 'error');
        this.cargando = false; 
      } else {
        this.mostrar(`Inicio de Sesión Exitosa`, 'exito');
        setTimeout(() => {
          this.router.navigate(['/dashboard']).then(() => {
            this.cargando = false;
          });
        }, 1000);
      }
    } catch (error) {
      this.mostrar('Error de conexión', 'error');
      this.cargando = false; // Desactivar loader en caso de excepción
    }
  }

  mostrar(mensaje: string, tipo: 'exito' | 'error') {
    this.mensaje = mensaje;
    this.tipo = tipo;
    this.mostrarMensaje = true;
  }

  abrirRecuperacion() {
    this.mostrarRecuperacion = true;
  }

  cerrarRecuperacion() {
    this.mostrarRecuperacion = false;
  }
}