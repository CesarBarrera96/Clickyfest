import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminLayout } from './components/admin-layout/admin-layout';
import { Login } from './components/login/login';
import { authGuard } from '../core/guards/auth-guard';

const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      // Aquí podrías tener un componente de dashboard para la ruta vacía, por ejemplo:
      // { path: '', component: DashboardComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
