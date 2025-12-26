import { Routes } from '@angular/router';
import { CuentasFinancierasPage } from './cuentas-financieras/cuentas-financieras-page';
import { PartidasPlanificadasPage } from './partidas-planificadas/partidas-planificadas-page';
import { PlanPresupuestarioPage } from './plan-presupuestario/plan-presupuestario-page';
import { PresupuestosPage } from './presupuestos/presupuestos-page';
import { RubrosPage } from './rubros/rubros-page';
import { TransaccionesPage } from './transacciones/transacciones-page';

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
    path: 'transacciones',
    component: TransaccionesPage,
  },
  {
    path: 'presupuestos',
    component: PresupuestosPage,
  },
  {
    path: 'partidas-planificadas',
    component: PartidasPlanificadasPage,
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
