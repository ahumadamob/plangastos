import { Routes } from '@angular/router';
import { CuentasFinancierasPage } from './cuentas-financieras/cuentas-financieras-page';
import { PartidasPlanificadasPage } from './partidas-planificadas/partidas-planificadas-page';
import { PresupuestosPage } from './presupuestos/presupuestos-page';
import { RubrosPage } from './rubros/rubros-page';
import { TransaccionesPage } from './transacciones/transacciones-page';
import { PeriodosPage } from './periodos/periodos-page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'periodos',
    pathMatch: 'full',
  },
  {
    path: 'periodos',
    component: PeriodosPage,
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
    path: 'cuentas-financieras',
    component: CuentasFinancierasPage,
  },
];
