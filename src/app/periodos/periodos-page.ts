import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PartidaPlanificada, PartidaPlanificadaService } from '../partidas-planificadas/partida-planificada.service';
import { PresupuestoDropdown, PresupuestoService } from '../presupuestos/presupuesto.service';

@Component({
  selector: 'app-periodos-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>Periodos</span>
        <button class="btn btn-outline-primary btn-sm" type="button" (click)="loadDropdown()" [disabled]="loadingDropdown()">
          Recargar
        </button>
      </div>
      <div class="card-body">
        <div *ngIf="loadingDropdown()" class="alert alert-info">Cargando periodos...</div>
        <div *ngIf="errorMessage()" class="alert alert-danger">{{ errorMessage() }}</div>
        <div class="mb-3">
          <label for="periodo" class="form-label">Selecciona un periodo</label>
          <select
            id="periodo"
            class="form-select"
            [disabled]="loadingDropdown() || dropdown().length === 0"
            (change)="onPeriodoChange($event)"
          >
            <option value="">{{ dropdown().length === 0 ? 'No hay periodos disponibles' : 'Selecciona un periodo' }}</option>
            <option *ngFor="let periodo of dropdown()" [value]="periodo.id">{{ periodo.nombre }}</option>
          </select>
        </div>
        <div *ngIf="loadingData()" class="alert alert-info">Cargando datos del periodo...</div>
        <div *ngIf="!loadingData() && selectedPresupuestoId() === null" class="alert alert-secondary">
          Selecciona un periodo para ver las partidas planificadas.
        </div>
        <ng-container *ngIf="selectedPresupuestoId() !== null">
          <div class="row row-cols-1 row-cols-md-4 g-3 mb-3">
            <div class="col">
              <div class="card text-white bg-success h-100" style="max-width: 20rem; width: 100%;">
                <div class="card-header">Ingresos</div>
                <div class="card-body">
                  <div class="d-flex justify-content-between">
                    <span>Comprometido</span>
                    <strong>{{ getTotal(ingresos()) | number: '1.2-2' }}</strong>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span>Pagado</span>
                    <strong>{{ getTotalTransacciones(ingresos()) | number: '1.2-2' }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="card text-white bg-danger h-100" style="max-width: 20rem; width: 100%;">
                <div class="card-header">Gastos</div>
                <div class="card-body">
                  <div class="d-flex justify-content-between">
                    <span>Comprometido</span>
                    <strong>{{ getTotal(gastos()) | number: '1.2-2' }}</strong>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span>Pagado</span>
                    <strong>{{ getTotalTransacciones(gastos()) | number: '1.2-2' }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="card bg-light h-100" style="max-width: 20rem; width: 100%;">
                <div class="card-header">Ahorro</div>
                <div class="card-body">
                  <div class="d-flex justify-content-between">
                    <span>Comprometido</span>
                    <strong>{{ getTotal(ahorro()) | number: '1.2-2' }}</strong>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span>Pagado</span>
                    <strong>{{ getTotalTransacciones(ahorro()) | number: '1.2-2' }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="card text-white bg-info h-100" style="max-width: 20rem; width: 100%;">
                <div class="card-header">Total</div>
                <div class="card-body">
                  <div class="d-flex justify-content-between">
                    <span>Comprometido</span>
                    <strong>{{ getSaldoComprometido() | number: '1.2-2' }}</strong>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span>Pagado</span>
                    <strong>{{ getSaldoReal() | number: '1.2-2' }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="d-flex flex-column gap-3">
            <div class="card w-100">
              <div class="card-header">Ingresos</div>
              <div class="card-body">
                <div *ngIf="ingresos().length === 0" class="text-muted">Sin ingresos.</div>
                <div class="table-responsive" *ngIf="ingresos().length > 0">
                  <table class="table table-sm table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Rubro</th>
                        <th class="text-end">Monto comprometido</th>
                        <th class="text-end">Monto transacciones</th>
                        <th>Fecha objetivo</th>
                        <th class="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of ingresos()">
                        <td>{{ item.descripcion }}</td>
                        <td>{{ item.rubro.nombre }}</td>
                        <td class="text-end">{{ item.montoComprometido | number: '1.2-2' }}</td>
                        <td class="text-end">{{ getTransaccionesSum(item) | number: '1.2-2' }}</td>
                        <td>{{ item.fechaObjetivo || '—' }}</td>
                        <td class="text-end">
                          <button
                            type="button"
                            class="btn btn-primary btn-sm"
                            (click)="openNewTransactionForm(item)"
                            aria-label="Registrar nueva transacción"
                          >
                            <span aria-hidden="true">+</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colspan="2" class="text-end">Total</th>
                        <th class="text-end">{{ getTotal(ingresos()) | number: '1.2-2' }}</th>
                        <th class="text-end">{{ getTotalTransacciones(ingresos()) | number: '1.2-2' }}</th>
                        <th></th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div class="card w-100">
              <div class="card-header">Gastos</div>
              <div class="card-body">
                <div *ngIf="gastos().length === 0" class="text-muted">Sin gastos.</div>
                <div class="table-responsive" *ngIf="gastos().length > 0">
                  <table class="table table-sm table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Rubro</th>
                        <th class="text-end">Monto comprometido</th>
                        <th class="text-end">Monto transacciones</th>
                        <th>Fecha objetivo</th>
                        <th class="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of gastos()">
                        <td>{{ item.descripcion }}</td>
                        <td>{{ item.rubro.nombre }}</td>
                        <td class="text-end">{{ item.montoComprometido | number: '1.2-2' }}</td>
                        <td class="text-end">{{ getTransaccionesSum(item) | number: '1.2-2' }}</td>
                        <td>{{ item.fechaObjetivo || '—' }}</td>
                        <td class="text-end">
                          <button
                            type="button"
                            class="btn btn-primary btn-sm"
                            (click)="openNewTransactionForm(item)"
                            aria-label="Registrar nueva transacción"
                          >
                            <span aria-hidden="true">+</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colspan="2" class="text-end">Total</th>
                        <th class="text-end">{{ getTotal(gastos()) | number: '1.2-2' }}</th>
                        <th class="text-end">{{ getTotalTransacciones(gastos()) | number: '1.2-2' }}</th>
                        <th></th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div class="card w-100">
              <div class="card-header">Ahorro</div>
              <div class="card-body">
                <div *ngIf="ahorro().length === 0" class="text-muted">Sin ahorro.</div>
                <div class="table-responsive" *ngIf="ahorro().length > 0">
                  <table class="table table-sm table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Rubro</th>
                        <th class="text-end">Monto comprometido</th>
                        <th class="text-end">Monto transacciones</th>
                        <th>Fecha objetivo</th>
                        <th class="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of ahorro()">
                        <td>{{ item.descripcion }}</td>
                        <td>{{ item.rubro.nombre }}</td>
                        <td class="text-end">{{ item.montoComprometido | number: '1.2-2' }}</td>
                        <td class="text-end">{{ getTransaccionesSum(item) | number: '1.2-2' }}</td>
                        <td>{{ item.fechaObjetivo || '—' }}</td>
                        <td class="text-end">
                          <button
                            type="button"
                            class="btn btn-primary btn-sm"
                            (click)="openNewTransactionForm(item)"
                            aria-label="Registrar nueva transacción"
                          >
                            <span aria-hidden="true">+</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colspan="2" class="text-end">Total</th>
                        <th class="text-end">{{ getTotal(ahorro()) | number: '1.2-2' }}</th>
                        <th class="text-end">{{ getTotalTransacciones(ahorro()) | number: '1.2-2' }}</th>
                        <th></th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
})
export class PeriodosPage implements OnInit {
  protected readonly dropdown = signal<PresupuestoDropdown[]>([]);
  protected readonly ingresos = signal<PartidaPlanificada[]>([]);
  protected readonly gastos = signal<PartidaPlanificada[]>([]);
  protected readonly ahorro = signal<PartidaPlanificada[]>([]);
  protected readonly loadingDropdown = signal(false);
  protected readonly loadingData = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly selectedPresupuestoId = signal<number | null>(null);

  constructor(
    private readonly presupuestoService: PresupuestoService,
    private readonly partidaPlanificadaService: PartidaPlanificadaService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadDropdown();
  }

  protected loadDropdown(): void {
    this.loadingDropdown.set(true);
    this.errorMessage.set('');
    this.presupuestoService.getDropdown().subscribe({
      next: (response) => this.dropdown.set(response.data ?? []),
      error: () => {
        this.errorMessage.set('No se pudieron obtener los periodos.');
        this.dropdown.set([]);
      },
      complete: () => this.loadingDropdown.set(false),
    });
  }

  protected onPeriodoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const parsedValue = value ? Number(value) : null;
    this.selectedPresupuestoId.set(Number.isNaN(parsedValue as number) ? null : parsedValue);
    this.loadData();
  }

  private loadData(): void {
    const presupuestoId = this.selectedPresupuestoId();
    if (presupuestoId === null) {
      this.ingresos.set([]);
      this.gastos.set([]);
      this.ahorro.set([]);
      return;
    }

    this.loadingData.set(true);
    this.errorMessage.set('');
    forkJoin({
      ingresos: this.partidaPlanificadaService.getIngresosByPresupuesto(presupuestoId),
      gastos: this.partidaPlanificadaService.getGastosByPresupuesto(presupuestoId),
      ahorro: this.partidaPlanificadaService.getAhorroByPresupuesto(presupuestoId),
    }).subscribe({
      next: (response) => {
        this.ingresos.set(response.ingresos.data ?? []);
        this.gastos.set(response.gastos.data ?? []);
        this.ahorro.set(response.ahorro.data ?? []);
      },
      error: () => {
        this.errorMessage.set('No se pudieron obtener los datos del periodo.');
        this.ingresos.set([]);
        this.gastos.set([]);
        this.ahorro.set([]);
      },
      complete: () => this.loadingData.set(false),
    });
  }

  protected getTotal(list: PartidaPlanificada[]): number {
    return list.reduce((acc, item) => acc + (item.montoComprometido ?? 0), 0);
  }

  protected getTransaccionesSum(partida: PartidaPlanificada): number {
    return (partida.transacciones ?? []).reduce((acc, tx) => acc + (tx.monto ?? 0), 0);
  }

  protected getTotalTransacciones(list: PartidaPlanificada[]): number {
    return list.reduce((acc, item) => acc + this.getTransaccionesSum(item), 0);
  }

  protected getSaldoComprometido(): number {
    return this.getTotal(this.ingresos()) - this.getTotal(this.gastos()) - this.getTotal(this.ahorro());
  }

  protected getSaldoReal(): number {
    return (
      this.getTotalTransacciones(this.ingresos()) -
      this.getTotalTransacciones(this.gastos()) -
      this.getTotalTransacciones(this.ahorro())
    );
  }

  protected openNewTransactionForm(partida: PartidaPlanificada): void {
    this.router.navigate(['/transacciones'], {
      queryParams: {
        nueva: true,
        partidaId: partida.id,
        presupuestoId: partida.presupuesto?.id ?? null,
        rubroId: partida.rubro?.id ?? null,
      },
    });
  }
}
