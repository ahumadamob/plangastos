import { Routes } from '@angular/router';
import { CuentasFinancierasPage } from './cuentas-financieras/cuentas-financieras-page';
import { PlanPresupuestarioPage } from './plan-presupuestario/plan-presupuestario-page';
import { PresupuestosPage } from './presupuestos/presupuestos-page';
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
    path: 'presupuestos',
    component: PresupuestosPage,
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
