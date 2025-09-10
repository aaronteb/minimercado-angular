import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { NuevaContrasena } from './components/nueva-contrasena/nueva-contrasena';
import { Dashboard } from './components/dashboard/dashboard';
import { ProductosComponent } from './components/productos/productos';
import { authGuard } from './Services/authGuard';
import { ProductoFormComponent } from './components/producto-form-component/producto-form-component';
import { NotaVentaComponent } from './components/nota-venta/nota-venta';
import { ListarNotasDeVenta } from './components/listar-notas-de-venta/listar-notas-de-venta';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'reset-password', component: NuevaContrasena },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [authGuard] 
  },
  { 
    path: 'productos', 
    component: ProductosComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'productos/nuevo', 
    component: ProductoFormComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'productos/editar/:id', 
    component: ProductoFormComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'nota-venta', 
    component: NotaVentaComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'historial-ventas', 
    component: ListarNotasDeVenta,
    canActivate: [authGuard] 
  },
  { path: '**', redirectTo: '/login' }
];