import { Routes } from '@angular/router';
import { ProformaListComponent } from './proforma-list/proforma-list.component';
import { ProformaNewComponent } from './proforma-new/proforma-new.component';
import {LoginComponent} from './login/login.component';
import {authGuard} from './auth.guard'; // Asegúrate de importar este componente

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'proformas',
    component: ProformaListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'proformas/new',
    component: ProformaNewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'proformas/edit/:id',
    component: ProformaNewComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
