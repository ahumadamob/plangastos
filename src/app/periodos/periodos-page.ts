import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
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
          <div class="row g-3">
            <div class="col-12 col-lg-4">
              <div class="card h-100">
                <div class="card-header">Ingresos</div>
                <div class="card-body">
                  <div *ngIf="ingresos().length === 0" class="text-muted">Sin ingresos.</div>
                  <div class="table-responsive" *ngIf="ingresos().length > 0">
                    <table class="table table-sm table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Descripción</th>
                          <th>Rubro</th>
                          <th class="text-end">Monto comprometido</th>
                          <th>Fecha objetivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let item of ingresos()">
                          <td>{{ item.descripcion }}</td>
                          <td>{{ item.rubro.nombre }}</td>
                          <td class="text-end">{{ item.montoComprometido | number: '1.2-2' }}</td>
                          <td>{{ item.fechaObjetivo || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 col-lg-4">
              <div class="card h-100">
                <div class="card-header">Gastos</div>
                <div class="card-body">
                  <div *ngIf="gastos().length === 0" class="text-muted">Sin gastos.</div>
                  <div class="table-responsive" *ngIf="gastos().length > 0">
                    <table class="table table-sm table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Descripción</th>
                          <th>Rubro</th>
                          <th class="text-end">Monto comprometido</th>
                          <th>Fecha objetivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let item of gastos()">
                          <td>{{ item.descripcion }}</td>
                          <td>{{ item.rubro.nombre }}</td>
                          <td class="text-end">{{ item.montoComprometido | number: '1.2-2' }}</td>
                          <td>{{ item.fechaObjetivo || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 col-lg-4">
              <div class="card h-100">
                <div class="card-header">Ahorro</div>
                <div class="card-body">
                  <div *ngIf="ahorro().length === 0" class="text-muted">Sin ahorro.</div>
                  <div class="table-responsive" *ngIf="ahorro().length > 0">
                    <table class="table table-sm table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Descripción</th>
                          <th>Rubro</th>
                          <th class="text-end">Monto comprometido</th>
                          <th>Fecha objetivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let item of ahorro()">
                          <td>{{ item.descripcion }}</td>
                          <td>{{ item.rubro.nombre }}</td>
                          <td class="text-end">{{ item.montoComprometido | number: '1.2-2' }}</td>
                          <td>{{ item.fechaObjetivo || '—' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
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
    private readonly partidaPlanificadaService: PartidaPlanificadaService
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
}
