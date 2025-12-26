import { Routes } from '@angular/router';
import { CuentasFinancierasPage } from './cuentas-financieras/cuentas-financieras-page';
import { PlanPresupuestarioPage } from './plan-presupuestario/plan-presupuestario-page';
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
  {
    path: 'planes-presupuestarios',
    component: PlanPresupuestarioPage,
  },
  {
    path: 'cuentas-financieras',
    component: CuentasFinancierasPage,
  },
];
