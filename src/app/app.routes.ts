import { Routes } from '@angular/router';
import { RubrosPage } from './rubros/rubros-page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'rubros',
    pathMatch: 'full',
  },
  {
    path: 'rubros',
    component: RubrosPage,
  },
];
