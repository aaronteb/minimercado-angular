import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { NuevaContrasena } from './components/nueva-contrasena/nueva-contrasena';
import { Dashboard } from './components/dashboard/dashboard';
import { authGuard } from './Services/authGuard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'reset-password', component: NuevaContrasena },
  { 
    path: 'dashboard', 
    component: Dashboard,
    canActivate: [authGuard] 
  },
  { path: '**', redirectTo: '/login' }
];