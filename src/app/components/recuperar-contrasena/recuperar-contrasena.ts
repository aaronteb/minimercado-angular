import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../Services/supabase.service';
import { RespuestaComponent } from '../respuesta/respuesta';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule, RespuestaComponent],
  templateUrl: './recuperar-contrasena.html',
  styleUrls: ['./recuperar-contrasena.css']
})
export class RecuperarContrasenaComponent implements OnInit {
  email: string = '';
  nuevaPassword: string = '';
  mensaje: string = '';
  tipo: 'exito' | 'error' = 'exito';
  mostrarMensaje: boolean = false;
  token: string | null = null;

  @Output() volver = new EventEmitter<void>();

  constructor(
    private supabaseService: SupabaseService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        const params = new URLSearchParams(fragment);
        this.token = params.get('access_token');
      }
    });
  }

  async enviarRecuperacion() {
    if (!this.email) {
      this.mostrar('Ingresa tu email', 'error');
      return;
    }

    const { data, error } = await this.supabaseService.recuperarPassword(this.email);
    if (error) {
      this.mostrar('Error al enviar correo: ' + error.message, 'error');
    } else {
      this.mostrar('Se ha enviado un correo para restablecer tu contraseña', 'exito');
    }
  }

  async actualizarPassword() {
    if (!this.nuevaPassword) {
      this.mostrar('Ingresa tu nueva contraseña', 'error');
      return;
    }

    const { data, error } = await this.supabaseService.actualizarPassword(this.nuevaPassword);
    if (error) {
      this.mostrar('Error al actualizar contraseña: ' + error.message, 'error');
    } else {
      this.mostrar('Contraseña actualizada correctamente', 'exito');
    }
  }

  mostrar(mensaje: string, tipo: 'exito' | 'error') {
    this.mensaje = mensaje;
    this.tipo = tipo;
    this.mostrarMensaje = true;
    setTimeout(() => this.mostrarMensaje = false, 5000);
  }
}