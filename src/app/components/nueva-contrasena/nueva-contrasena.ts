import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../Services/supabase.service';
import { RespuestaComponent } from '../respuesta/respuesta';

@Component({
  selector: 'app-nueva-contrasena',
  imports: [CommonModule, FormsModule, RespuestaComponent],
  templateUrl: './nueva-contrasena.html',
  styleUrl: './nueva-contrasena.css'
})
export class NuevaContrasena implements OnInit {
  nuevaPassword: string = '';
  confirmarPassword: string = '';
  mensaje: string = '';
  tipo: 'exito' | 'error' = 'exito';
  mostrarMensaje: boolean = false;

  constructor(
    private supabaseService: SupabaseService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.fragment.subscribe(fragment => {
      if (fragment && fragment.includes('error')) {
        this.mostrar('El enlace ha expirado o es inválido. Serás redirigido al login.', 'error');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.mostrar('El enlace ha expirado o es inválido. Serás redirigido al login.', 'error');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      }
    });
  }

  async actualizarPassword() {
    if (!this.nuevaPassword || !this.confirmarPassword) {
      this.mostrar('Completa todos los campos', 'error');
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      this.mostrar('Las contraseñas no coinciden', 'error');
      return;
    }

    if (this.nuevaPassword.length < 6) {
      this.mostrar('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    const { data, error } = await this.supabaseService.actualizarPassword(this.nuevaPassword);
    if (error) {
      this.mostrar('Error al actualizar contraseña: ' + error.message, 'error');
    } else {
      this.mostrar('Contraseña actualizada correctamente', 'exito');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }
  }

  mostrar(mensaje: string, tipo: 'exito' | 'error') {
    this.mensaje = mensaje;
    this.tipo = tipo;
    this.mostrarMensaje = true;
    setTimeout(() => this.mostrarMensaje = false, 5000);
  }

  irAlLogin() {
    this.router.navigate(['/login']);
  }
}