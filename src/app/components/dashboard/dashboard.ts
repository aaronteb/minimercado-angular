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
      titulo: 'Ventas',
      icono: 'fas fa-shopping-cart',
      color: '#4ECDC4',
      descripcion: 'Gestión de ventas diarias'
    },
    { 
      titulo: 'Productos',
      icono: 'fas fa-boxes',
      color: '#45B7D1',
      descripcion: 'Control de productos y stock'
    },
    { 
      titulo: 'Clientes',
      icono: 'fas fa-users',
      color: '#96CEB4',
      descripcion: 'Base de datos de clientes'
    },
    { 
      titulo: 'Reportes',
      icono: 'fas fa-chart-bar',
      color: '#FECA57',
      descripcion: 'Informes y estadísticas'
    },
    { 
      titulo: 'Proveedores',
      icono: 'fas fa-truck',
      color: '#FF6B6B',
      descripcion: 'Gestión de proveedores'
    },
    { 
      titulo: 'Configuración',
      icono: 'fas fa-cog',
      color: '#A8E6CF',
      descripcion: 'Configuración del sistema'
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
    }
  }
}