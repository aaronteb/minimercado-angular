import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../Services/supabase.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  
  userEmail: string = '';
  
  secciones = [
    { 
      titulo: 'Productos',
      icono: 'fas fa-boxes',
      color: '#45B7D1',
      descripcion: 'Control de productos y stock'
    },
    { 
      titulo: 'Reportes',
      icono: 'fas fa-chart-bar',
      color: '#FECA57',
      descripcion: 'Informes y estadísticas'
    },
    { 
      titulo: 'Historial de Ventas',
      icono: 'fas fa-history',
      color: '#FF6B6B',
      descripcion: 'Historial de notas de venta'
    },
    { 
      titulo: 'Nota de Venta',
      icono: 'fas fa-receipt',
      color: '#A8E6CF',
      descripcion: 'Generar notas de venta'
    }
  ];

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    const { data } = await this.supabaseService.getUser();
    if (data.user) {
      this.userEmail = data.user.email || 'Usuario';
    } else {
      this.router.navigate(['/login']);
    }
  }

  async logout() {
    await this.supabaseService.logout();
    this.router.navigate(['/login']);
  }

  seleccionarSeccion(seccion: any) {
    if (seccion.titulo === 'Productos') {
      this.router.navigate(['/productos']);
    } else if (seccion.titulo === 'Nota de Venta') {
      this.router.navigate(['/nota-venta']);
    } else if (seccion.titulo === 'Historial de Ventas') {
      this.router.navigate(['/historial-ventas']);
    }
  }
}
