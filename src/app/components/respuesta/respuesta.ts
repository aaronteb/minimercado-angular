import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-respuesta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './respuesta.html',
  styleUrls: ['./respuesta.css']
})
export class RespuestaComponent {
  @Input() mensaje: string = '';    
  @Input() tipo: 'error' | 'exito' = 'exito'; 
  @Input() visible: boolean = false;

  cerrar() {
    this.visible = false;
  }
}
