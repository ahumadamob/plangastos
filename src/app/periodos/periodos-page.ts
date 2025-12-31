import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  PartidaPlanificada,
  PartidaPlanificadaTransaccion,
  PartidaPlanificadaRequestDto,
  PartidaPlanificadaService,
} from '../partidas-planificadas/partida-planificada.service';
import { Rubro } from '../rubros/rubro.service';
import { PresupuestoDropdown, PresupuestoService } from '../presupuestos/presupuesto.service';
import { TransaccionRequestDto, TransaccionService } from '../transacciones/transaccion.service';
import { CuentaFinanciera } from '../cuentas-financieras/cuenta-financiera.service';
import { RubroService } from '../rubros/rubro.service';

@Component({
  selector: 'app-periodos-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>Periodos</span>
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
          <ng-template #transactionsList let-partida>
            <tr *ngIf="viewingTransactionsPartidaId() === partida.id">
              <td colspan="7">
                <div class="border rounded p-3 bg-light">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <div class="fw-bold">Transacciones de: {{ partida.descripcion }}</div>
                      <div class="text-muted small">
                        Total registrado: {{ getTransaccionesSum(partida) | number: '1.2-2' }}
                      </div>
                    </div>
                    <button type="button" class="btn btn-outline-secondary btn-sm" (click)="closeTransactionsView()">
                      Cerrar
                    </button>
                  </div>
                  <div *ngIf="(partida.transacciones?.length ?? 0) === 0" class="text-muted fst-italic">
                    No hay transacciones registradas para esta partida.
                  </div>
                  <div *ngIf="(partida.transacciones?.length ?? 0) > 0" class="table-responsive">
                    <table class="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Descripción</th>
                          <th>Cuenta</th>
                          <th>Fecha</th>
                          <th class="text-end">Monto</th>
                          <th>Referencia</th>
                          <th class="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let transaccion of partida.transacciones">
                          <td>{{ transaccion.descripcion }}</td>
                          <td>{{ transaccion.cuenta.nombre }}</td>
                          <td>{{ transaccion.fecha | date: 'dd/MM/yyyy' }}</td>
                          <td class="text-end">{{ transaccion.monto | number: '1.2-2' }}</td>
                          <td>{{ transaccion.referenciaExterna || '—' }}</td>
                          <td class="text-end">
                            <button
                              type="button"
                              class="btn btn-danger btn-sm rounded-circle delete-btn"
                              (click)="confirmDeleteTransaccion(transaccion)"
                              [disabled]="deletingTransactionId() === transaccion.id"
                              aria-label="Eliminar transacción"
                              title="Eliminar transacción"
                            >
                              <i aria-hidden="true" class="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </td>
            </tr>
          </ng-template>
          <div class="row row-cols-1 row-cols-md-4 g-3 mb-3">
            <div class="col">
              <div class="card text-white bg-success h-100" style="max-width: 20rem; width: 100%;">
                <div class="card-header">Ingresos</div>
                <div class="card-body">
                  <div class="d-flex align-items-baseline">
                    <span>Comprometido</span>
                    <strong class="ms-auto text-end">{{ getTotal(ingresos()) | number: '1.2-2' }}</strong>
                  </div>
                  <div class="d-flex align-items-baseline">
                    <span>Pagado</span>
                    <strong class="ms-auto text-end">{{ getTotalTransacciones(ingresos()) | number: '1.2-2' }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="card text-dark bg-warning h-100" style="max-width: 20rem; width: 100%;">
                <div class="card-header">Gastos</div>
                <div class="card-body">
                  <div class="d-flex align-items-baseline">
                    <span>Comprometido</span>
                    <strong class="ms-auto text-end">{{ getTotal(gastos()) | number: '1.2-2' }}</strong>
                  </div>
                  <div class="d-flex align-items-baseline">
                    <span>Pagado</span>
                    <strong class="ms-auto text-end">{{ getTotalTransacciones(gastos()) | number: '1.2-2' }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="card bg-light h-100" style="max-width: 20rem; width: 100%;">
                <div class="card-header">Ahorro</div>
                <div class="card-body">
                  <div class="d-flex align-items-baseline">
                    <span>Comprometido</span>
                    <strong class="ms-auto text-end">{{ getTotal(ahorro()) | number: '1.2-2' }}</strong>
                  </div>
                  <div class="d-flex align-items-baseline">
                    <span>Pagado</span>
                    <strong class="ms-auto text-end">{{ getTotalTransacciones(ahorro()) | number: '1.2-2' }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div class="col">
              <div class="card text-white bg-secondary h-100" style="max-width: 20rem; width: 100%;">
                <div class="card-header">Total</div>
                <div class="card-body">
                  <div class="d-flex align-items-baseline">
                    <span>Comprometido</span>
                    <strong class="ms-auto text-end">{{ getSaldoComprometido() | number: '1.2-2' }}</strong>
                  </div>
                  <div class="d-flex align-items-baseline">
                    <span>Pagado</span>
                    <strong class="ms-auto text-end">{{ getSaldoReal() | number: '1.2-2' }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="d-flex flex-column gap-3">
            <div class="card w-100">
              <div class="card-header d-flex justify-content-between align-items-center">
                <span>Ingresos</span>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  (click)="openNewPlanForm('ingreso')"
                  [disabled]="selectedPresupuestoId() === null || loadingData()"
                >
                  Nuevo Ingreso
                </button>
              </div>
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
                        <th>Cuotas</th>
                        <th class="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <ng-container *ngFor="let item of ingresos()">
                        <tr [ngClass]="getRowClasses(item)">
                          <td>{{ item.descripcion }}</td>
                          <td>{{ item.rubro.nombre }}</td>
                          <td class="text-end">{{ item.montoComprometido | number: '1.2-2' }}</td>
                          <td class="text-end">{{ getTransaccionesSum(item) | number: '1.2-2' }}</td>
                          <td>{{ item.fechaObjetivo ? (item.fechaObjetivo | date: 'dd/MM/yyyy') : '—' }}</td>
                          <td>{{ getCuotasLabel(item) }}</td>
                          <td class="text-end">
                            <div class="d-inline-flex gap-2">
                              <button
                                type="button"
                                class="btn btn-light btn-sm rounded-circle icon-btn view-btn"
                                (click)="toggleTransactionsView(item)"
                                aria-label="Ver transacciones"
                                title="Ver transacciones"
                                *ngIf="hasTransacciones(item)"
                              >
                                <i aria-hidden="true" class="fa-solid fa-magnifying-glass view-icon"></i>
                              </button>
                              <button
                                type="button"
                                class="btn btn-primary btn-sm rounded-circle icon-btn transaction-btn"
                                (click)="toggleNewTransactionForm(item)"
                                aria-label="Ingresar transacción"
                                title="Ingresar transacción"
                                *ngIf="item.consolidado !== true"
                              >
                                <span aria-hidden="true" class="transaction-icon">⇄</span>
                              </button>
                              <button
                                type="button"
                                class="btn btn-info btn-sm rounded-circle icon-btn consolidate-btn"
                                (click)="confirmConsolidatePartida(item)"
                                *ngIf="canConsolidate(item)"
                                [disabled]="consolidatingPartidaId() === item.id"
                                aria-label="Consolidar partida"
                                title="Consolidar partida"
                              >
                                <i aria-hidden="true" class="fa-solid fa-circle-check consolidate-icon"></i>
                              </button>
                              <button
                                type="button"
                                class="btn btn-danger btn-sm rounded-circle icon-btn delete-btn"
                                (click)="confirmDeletePartida(item)"
                                [disabled]="deletingPartidaId() === item.id"
                                *ngIf="!hasTransacciones(item)"
                                aria-label="Eliminar partida"
                                title="Eliminar partida"
                              >
                                <i aria-hidden="true" class="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                        <ng-container *ngTemplateOutlet="transactionsList; context: { $implicit: item }"></ng-container>
                        <tr *ngIf="inlineFormPartidaId() === item.id">
                          <td colspan="7">
                            <div class="border rounded p-3">
                              <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                  <div class="fw-bold">Nueva transacción para: {{ item.descripcion }}</div>
                                  <div class="text-muted small">Rubro: {{ item.rubro.nombre }}</div>
                                </div>
                                <button
                                  type="button"
                                  class="btn btn-outline-secondary btn-sm"
                                  (click)="closeInlineForm()"
                                  [disabled]="savingTransaction()"
                                >
                                  Cerrar
                                </button>
                              </div>
                              <form [formGroup]="newTransactionForm" (ngSubmit)="submitNewTransaction()">
                                <div class="row g-2">
                                  <div class="col-12 col-md-4">
                                    <label for="descripcion-{{ item.id }}" class="form-label">Descripción</label>
                                    <input
                                      class="form-control"
                                      [id]="'descripcion-' + item.id"
                                      type="text"
                                      formControlName="descripcion"
                                      [class.is-invalid]="isInvalid('descripcion')"
                                      autocomplete="off"
                                      required
                                    />
                                    <div class="invalid-feedback" *ngIf="isInvalid('descripcion')">
                                      Ingresa una descripción (mínimo 3 caracteres).
                                    </div>
                                  </div>
                                  <div class="col-12 col-md-2">
                                    <label for="fecha-{{ item.id }}" class="form-label">Fecha</label>
                                    <input
                                      class="form-control"
                                      [id]="'fecha-' + item.id"
                                      type="date"
                                      formControlName="fecha"
                                      [class.is-invalid]="isInvalid('fecha')"
                                      required
                                    />
                                    <div class="invalid-feedback" *ngIf="isInvalid('fecha')">
                                      Selecciona la fecha.
                                    </div>
                                  </div>
                                  <div class="col-12 col-md-2">
                                    <label for="monto-{{ item.id }}" class="form-label">Monto</label>
                                    <input
                                      class="form-control"
                                      [id]="'monto-' + item.id"
                                      type="number"
                                      formControlName="monto"
                                      [class.is-invalid]="isInvalid('monto')"
                                      step="0.01"
                                      min="0"
                                      required
                                    />
                                    <div class="invalid-feedback" *ngIf="isInvalid('monto')">
                                      Ingresa un monto válido.
                                    </div>
                                  </div>
                                  <div class="col-12 col-md-4">
                                    <label for="cuenta-{{ item.id }}" class="form-label">Cuenta financiera</label>
                                    <select
                                      class="form-select"
                                      [id]="'cuenta-' + item.id"
                                      formControlName="cuentaFinanciera_id"
                                      [class.is-invalid]="isInvalid('cuentaFinanciera_id')"
                                      required
                                    >
                                      <option [ngValue]="null" disabled>Selecciona una cuenta</option>
                                      <option *ngFor="let cuenta of cuentasFinancieras()" [ngValue]="cuenta.id">
                                        {{ cuenta.nombre }} - {{ cuenta.divisa.codigo }}
                                      </option>
                                    </select>
                                    <div class="invalid-feedback" *ngIf="isInvalid('cuentaFinanciera_id')">
                                      Selecciona la cuenta financiera.
                                    </div>
                                  </div>
                                  <div class="col-12 d-flex gap-2">
                                    <button type="submit" class="btn btn-primary btn-sm" [disabled]="savingTransaction()">
                                      Guardar transacción
                                    </button>
                                    <button
                                      type="button"
                                      class="btn btn-outline-secondary btn-sm"
                                      (click)="closeInlineForm()"
                                      [disabled]="savingTransaction()"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                  <div class="col-12">
                                    <div *ngIf="inlineStatusMessage()" class="alert alert-success mb-0">
                                      {{ inlineStatusMessage() }}
                                    </div>
                                    <div *ngIf="inlineErrorMessage()" class="alert alert-danger mb-0">
                                      {{ inlineErrorMessage() }}
                                    </div>
                                  </div>
                                </div>
                              </form>
                            </div>
                          </td>
                        </tr>
                      </ng-container>
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colspan="2" class="text-end">Total</th>
                        <th class="text-end">{{ getTotal(ingresos()) | number: '1.2-2' }}</th>
                        <th class="text-end">{{ getTotalTransacciones(ingresos()) | number: '1.2-2' }}</th>
                        <th></th>
                        <th></th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div class="card-body border-top" *ngIf="newPlanCategory() === 'ingreso'">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div class="fw-bold">Nueva partida planificada de ingreso</div>
                    <div class="text-muted small">Periodo: {{ getSelectedPeriodoNombre() || '—' }}</div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    (click)="closeNewPlanForm()"
                    [disabled]="newPlanSaving()"
                  >
                    Cerrar
                  </button>
                </div>
                <form [formGroup]="newPlanForm" (ngSubmit)="submitNewPlanForm()" novalidate>
                  <div class="row g-2">
                    <div class="col-12 col-md-4">
                      <label for="rubro-ingreso" class="form-label">Rubro</label>
                      <select
                        id="rubro-ingreso"
                        class="form-select"
                        formControlName="rubro_id"
                        [class.is-invalid]="isNewPlanInvalid('rubro_id')"
                        required
                      >
                        <option [ngValue]="null" disabled>Selecciona un rubro</option>
                        <option *ngFor="let rubro of getRubrosByCategory('ingreso')" [ngValue]="rubro.id">
                          {{ rubro.nombre }}
                        </option>
                      </select>
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('rubro_id')">
                        Selecciona el rubro de la partida.
                      </div>
                    </div>
                    <div class="col-12 col-md-4">
                      <label for="descripcion-ingreso" class="form-label">Descripción</label>
                      <input
                        id="descripcion-ingreso"
                        type="text"
                        class="form-control"
                        formControlName="descripcion"
                        [class.is-invalid]="isNewPlanInvalid('descripcion')"
                        autocomplete="off"
                        required
                      />
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('descripcion')">
                        Ingresa una descripción (mínimo 3 caracteres).
                      </div>
                    </div>
                    <div class="col-12 col-md-2">
                      <label for="monto-ingreso" class="form-label">Monto comprometido</label>
                      <input
                        id="monto-ingreso"
                        type="number"
                        class="form-control"
                        formControlName="montoComprometido"
                        [class.is-invalid]="isNewPlanInvalid('montoComprometido')"
                        step="0.01"
                        min="0"
                        required
                      />
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('montoComprometido')">
                        Ingresa un monto comprometido válido.
                      </div>
                    </div>
                    <div class="col-12 col-md-2">
                      <label for="fecha-ingreso" class="form-label">Fecha objetivo</label>
                      <input
                        id="fecha-ingreso"
                        type="date"
                        class="form-control"
                        formControlName="fechaObjetivo"
                      />
                    </div>
                    <div class="col-12 col-md-2">
                      <label for="cuotas-ingreso" class="form-label">Cuotas</label>
                      <input
                        id="cuotas-ingreso"
                        type="number"
                        class="form-control"
                        formControlName="cuota"
                        [class.is-invalid]="isNewPlanInvalid('cuota')"
                        min="1"
                      />
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('cuota')">
                        Ingresa un número de cuotas válido (1 o más).
                      </div>
                    </div>
                    <div class="col-12 col-md-2">
                      <label for="cantidad-cuotas-ingreso" class="form-label">Cantidad de cuotas</label>
                      <input
                        id="cantidad-cuotas-ingreso"
                        type="number"
                        class="form-control"
                        formControlName="cantidadCuotas"
                        [class.is-invalid]="isNewPlanInvalid('cantidadCuotas')"
                        min="1"
                      />
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('cantidadCuotas')">
                        Ingresa una cantidad de cuotas válida (1 o más).
                      </div>
                    </div>
                    <div class="col-12 d-flex gap-2">
                      <button type="submit" class="btn btn-primary btn-sm" [disabled]="newPlanSaving()">
                        Guardar partida
                      </button>
                      <button
                        type="button"
                        class="btn btn-outline-secondary btn-sm"
                        (click)="closeNewPlanForm()"
                        [disabled]="newPlanSaving()"
                      >
                        Cancelar
                      </button>
                    </div>
                    <div class="col-12">
                      <div *ngIf="newPlanStatusMessage()" class="alert alert-success mb-0">
                        {{ newPlanStatusMessage() }}
                      </div>
                      <div *ngIf="newPlanErrorMessage()" class="alert alert-danger mb-0">
                        {{ newPlanErrorMessage() }}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div class="card w-100">
              <div class="card-header d-flex justify-content-between align-items-center">
                <span>Gastos</span>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  (click)="openNewPlanForm('gasto')"
                  [disabled]="selectedPresupuestoId() === null || loadingData()"
                >
                  Nuevo Gasto
                </button>
              </div>
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
                        <th>Cuotas</th>
                        <th class="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <ng-container *ngFor="let item of gastos()">
                        <tr [ngClass]="getRowClasses(item)">
                          <td>{{ item.descripcion }}</td>
                          <td>{{ item.rubro.nombre }}</td>
                          <td class="text-end">{{ item.montoComprometido | number: '1.2-2' }}</td>
                          <td class="text-end">{{ getTransaccionesSum(item) | number: '1.2-2' }}</td>
                          <td>{{ item.fechaObjetivo ? (item.fechaObjetivo | date: 'dd/MM/yyyy') : '—' }}</td>
                          <td>{{ getCuotasLabel(item) }}</td>
                          <td class="text-end">
                            <div class="d-inline-flex gap-2">
                              <button
                                type="button"
                                class="btn btn-light btn-sm rounded-circle icon-btn view-btn"
                                (click)="toggleTransactionsView(item)"
                                aria-label="Ver transacciones"
                                title="Ver transacciones"
                                *ngIf="hasTransacciones(item)"
                              >
                                <i aria-hidden="true" class="fa-solid fa-magnifying-glass view-icon"></i>
                              </button>
                              <button
                                type="button"
                                class="btn btn-primary btn-sm rounded-circle icon-btn transaction-btn"
                                (click)="toggleNewTransactionForm(item)"
                                aria-label="Ingresar transacción"
                                title="Ingresar transacción"
                                *ngIf="item.consolidado !== true"
                              >
                                <span aria-hidden="true" class="transaction-icon">⇄</span>
                              </button>
                              <button
                                type="button"
                                class="btn btn-info btn-sm rounded-circle icon-btn consolidate-btn"
                                (click)="confirmConsolidatePartida(item)"
                                *ngIf="canConsolidate(item)"
                                [disabled]="consolidatingPartidaId() === item.id"
                                aria-label="Consolidar partida"
                                title="Consolidar partida"
                              >
                                <i aria-hidden="true" class="fa-solid fa-circle-check consolidate-icon"></i>
                              </button>
                              <button
                                type="button"
                                class="btn btn-danger btn-sm rounded-circle icon-btn delete-btn"
                                (click)="confirmDeletePartida(item)"
                                [disabled]="deletingPartidaId() === item.id"
                                *ngIf="!hasTransacciones(item)"
                                aria-label="Eliminar partida"
                                title="Eliminar partida"
                              >
                                <i aria-hidden="true" class="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                        <ng-container *ngTemplateOutlet="transactionsList; context: { $implicit: item }"></ng-container>
                        <tr *ngIf="inlineFormPartidaId() === item.id">
                          <td colspan="7">
                            <div class="border rounded p-3">
                              <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                  <div class="fw-bold">Nueva transacción para: {{ item.descripcion }}</div>
                                  <div class="text-muted small">Rubro: {{ item.rubro.nombre }}</div>
                                </div>
                                <button
                                  type="button"
                                  class="btn btn-outline-secondary btn-sm"
                                  (click)="closeInlineForm()"
                                  [disabled]="savingTransaction()"
                                >
                                  Cerrar
                                </button>
                              </div>
                              <form [formGroup]="newTransactionForm" (ngSubmit)="submitNewTransaction()">
                                <div class="row g-2">
                                  <div class="col-12 col-md-4">
                                    <label for="descripcion-{{ item.id }}" class="form-label">Descripción</label>
                                    <input
                                      class="form-control"
                                      [id]="'descripcion-' + item.id"
                                      type="text"
                                      formControlName="descripcion"
                                      [class.is-invalid]="isInvalid('descripcion')"
                                      autocomplete="off"
                                      required
                                    />
                                    <div class="invalid-feedback" *ngIf="isInvalid('descripcion')">
                                      Ingresa una descripción (mínimo 3 caracteres).
                                    </div>
                                  </div>
                                  <div class="col-12 col-md-2">
                                    <label for="fecha-{{ item.id }}" class="form-label">Fecha</label>
                                    <input
                                      class="form-control"
                                      [id]="'fecha-' + item.id"
                                      type="date"
                                      formControlName="fecha"
                                      [class.is-invalid]="isInvalid('fecha')"
                                      required
                                    />
                                    <div class="invalid-feedback" *ngIf="isInvalid('fecha')">
                                      Selecciona la fecha.
                                    </div>
                                  </div>
                                  <div class="col-12 col-md-2">
                                    <label for="monto-{{ item.id }}" class="form-label">Monto</label>
                                    <input
                                      class="form-control"
                                      [id]="'monto-' + item.id"
                                      type="number"
                                      formControlName="monto"
                                      [class.is-invalid]="isInvalid('monto')"
                                      step="0.01"
                                      min="0"
                                      required
                                    />
                                    <div class="invalid-feedback" *ngIf="isInvalid('monto')">
                                      Ingresa un monto válido.
                                    </div>
                                  </div>
                                  <div class="col-12 col-md-4">
                                    <label for="cuenta-{{ item.id }}" class="form-label">Cuenta financiera</label>
                                    <select
                                      class="form-select"
                                      [id]="'cuenta-' + item.id"
                                      formControlName="cuentaFinanciera_id"
                                      [class.is-invalid]="isInvalid('cuentaFinanciera_id')"
                                      required
                                    >
                                      <option [ngValue]="null" disabled>Selecciona una cuenta</option>
                                      <option *ngFor="let cuenta of cuentasFinancieras()" [ngValue]="cuenta.id">
                                        {{ cuenta.nombre }} - {{ cuenta.divisa.codigo }}
                                      </option>
                                    </select>
                                    <div class="invalid-feedback" *ngIf="isInvalid('cuentaFinanciera_id')">
                                      Selecciona la cuenta financiera.
                                    </div>
                                  </div>
                                  <div class="col-12 d-flex gap-2">
                                    <button type="submit" class="btn btn-primary btn-sm" [disabled]="savingTransaction()">
                                      Guardar transacción
                                    </button>
                                    <button
                                      type="button"
                                      class="btn btn-outline-secondary btn-sm"
                                      (click)="closeInlineForm()"
                                      [disabled]="savingTransaction()"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                  <div class="col-12">
                                    <div *ngIf="inlineStatusMessage()" class="alert alert-success mb-0">
                                      {{ inlineStatusMessage() }}
                                    </div>
                                    <div *ngIf="inlineErrorMessage()" class="alert alert-danger mb-0">
                                      {{ inlineErrorMessage() }}
                                    </div>
                                  </div>
                                </div>
                              </form>
                            </div>
                          </td>
                        </tr>
                      </ng-container>
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colspan="2" class="text-end">Total</th>
                        <th class="text-end">{{ getTotal(gastos()) | number: '1.2-2' }}</th>
                        <th class="text-end">{{ getTotalTransacciones(gastos()) | number: '1.2-2' }}</th>
                        <th></th>
                        <th></th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div class="card-body border-top" *ngIf="newPlanCategory() === 'gasto'">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div class="fw-bold">Nueva partida planificada de gasto</div>
                    <div class="text-muted small">Periodo: {{ getSelectedPeriodoNombre() || '—' }}</div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    (click)="closeNewPlanForm()"
                    [disabled]="newPlanSaving()"
                  >
                    Cerrar
                  </button>
                </div>
                <form [formGroup]="newPlanForm" (ngSubmit)="submitNewPlanForm()" novalidate>
                  <div class="row g-2">
                    <div class="col-12 col-md-4">
                      <label for="rubro-gasto" class="form-label">Rubro</label>
                      <select
                        id="rubro-gasto"
                        class="form-select"
                        formControlName="rubro_id"
                        [class.is-invalid]="isNewPlanInvalid('rubro_id')"
                        required
                      >
                        <option [ngValue]="null" disabled>Selecciona un rubro</option>
                        <option *ngFor="let rubro of getRubrosByCategory('gasto')" [ngValue]="rubro.id">
                          {{ rubro.nombre }}
                        </option>
                      </select>
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('rubro_id')">
                        Selecciona el rubro de la partida.
                      </div>
                    </div>
                    <div class="col-12 col-md-4">
                      <label for="descripcion-gasto" class="form-label">Descripción</label>
                      <input
                        id="descripcion-gasto"
                        type="text"
                        class="form-control"
                        formControlName="descripcion"
                        [class.is-invalid]="isNewPlanInvalid('descripcion')"
                        autocomplete="off"
                        required
                      />
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('descripcion')">
                        Ingresa una descripción (mínimo 3 caracteres).
                      </div>
                    </div>
                    <div class="col-12 col-md-2">
                      <label for="monto-gasto" class="form-label">Monto comprometido</label>
                      <input
                        id="monto-gasto"
                        type="number"
                        class="form-control"
                        formControlName="montoComprometido"
                        [class.is-invalid]="isNewPlanInvalid('montoComprometido')"
                        step="0.01"
                        min="0"
                        required
                      />
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('montoComprometido')">
                        Ingresa un monto comprometido válido.
                      </div>
                    </div>
                    <div class="col-12 col-md-2">
                      <label for="fecha-gasto" class="form-label">Fecha objetivo</label>
                      <input
                        id="fecha-gasto"
                        type="date"
                        class="form-control"
                        formControlName="fechaObjetivo"
                      />
                    </div>
                    <div class="col-12 col-md-2">
                      <label for="cuotas-gasto" class="form-label">Cuotas</label>
                      <input
                        id="cuotas-gasto"
                        type="number"
                        class="form-control"
                        formControlName="cuota"
                        [class.is-invalid]="isNewPlanInvalid('cuota')"
                        min="1"
                      />
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('cuota')">
                        Ingresa un número de cuotas válido (1 o más).
                      </div>
                    </div>
                    <div class="col-12 col-md-2">
                      <label for="cantidad-cuotas-gasto" class="form-label">Cantidad de cuotas</label>
                      <input
                        id="cantidad-cuotas-gasto"
                        type="number"
                        class="form-control"
                        formControlName="cantidadCuotas"
                        [class.is-invalid]="isNewPlanInvalid('cantidadCuotas')"
                        min="1"
                      />
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('cantidadCuotas')">
                        Ingresa una cantidad de cuotas válida (1 o más).
                      </div>
                    </div>
                    <div class="col-12 d-flex gap-2">
                      <button type="submit" class="btn btn-primary btn-sm" [disabled]="newPlanSaving()">
                        Guardar partida
                      </button>
                      <button
                        type="button"
                        class="btn btn-outline-secondary btn-sm"
                        (click)="closeNewPlanForm()"
                        [disabled]="newPlanSaving()"
                      >
                        Cancelar
                      </button>
                    </div>
                    <div class="col-12">
                      <div *ngIf="newPlanStatusMessage()" class="alert alert-success mb-0">
                        {{ newPlanStatusMessage() }}
                      </div>
                      <div *ngIf="newPlanErrorMessage()" class="alert alert-danger mb-0">
                        {{ newPlanErrorMessage() }}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div class="card w-100">
              <div class="card-header d-flex justify-content-between align-items-center">
                <span>Ahorro</span>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  (click)="openNewPlanForm('ahorro')"
                  [disabled]="selectedPresupuestoId() === null || loadingData()"
                >
                  Nuevo Ahorro
                </button>
              </div>
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
                        <th>Cuotas</th>
                        <th class="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <ng-container *ngFor="let item of ahorro()">
                        <tr [ngClass]="getRowClasses(item)">
                          <td>{{ item.descripcion }}</td>
                          <td>{{ item.rubro.nombre }}</td>
                          <td class="text-end">{{ item.montoComprometido | number: '1.2-2' }}</td>
                          <td class="text-end">{{ getTransaccionesSum(item) | number: '1.2-2' }}</td>
                          <td>{{ item.fechaObjetivo ? (item.fechaObjetivo | date: 'dd/MM/yyyy') : '—' }}</td>
                          <td>{{ getCuotasLabel(item) }}</td>
                          <td class="text-end">
                            <div class="d-inline-flex gap-2">
                              <button
                                type="button"
                                class="btn btn-light btn-sm rounded-circle icon-btn view-btn"
                                (click)="toggleTransactionsView(item)"
                                aria-label="Ver transacciones"
                                title="Ver transacciones"
                                *ngIf="hasTransacciones(item)"
                              >
                                <i aria-hidden="true" class="fa-solid fa-magnifying-glass view-icon"></i>
                              </button>
                              <button
                                type="button"
                                class="btn btn-primary btn-sm rounded-circle icon-btn transaction-btn"
                                (click)="toggleNewTransactionForm(item)"
                                aria-label="Ingresar transacción"
                                title="Ingresar transacción"
                                *ngIf="item.consolidado !== true"
                              >
                                <span aria-hidden="true" class="transaction-icon">⇄</span>
                              </button>
                              <button
                                type="button"
                                class="btn btn-info btn-sm rounded-circle icon-btn consolidate-btn"
                                (click)="confirmConsolidatePartida(item)"
                                *ngIf="canConsolidate(item)"
                                [disabled]="consolidatingPartidaId() === item.id"
                                aria-label="Consolidar partida"
                                title="Consolidar partida"
                              >
                                <i aria-hidden="true" class="fa-solid fa-circle-check consolidate-icon"></i>
                              </button>
                              <button
                                type="button"
                                class="btn btn-danger btn-sm rounded-circle icon-btn delete-btn"
                                (click)="confirmDeletePartida(item)"
                                [disabled]="deletingPartidaId() === item.id"
                                *ngIf="!hasTransacciones(item)"
                                aria-label="Eliminar partida"
                                title="Eliminar partida"
                              >
                                <i aria-hidden="true" class="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                        <ng-container *ngTemplateOutlet="transactionsList; context: { $implicit: item }"></ng-container>
                        <tr *ngIf="inlineFormPartidaId() === item.id">
                          <td colspan="7">
                            <div class="border rounded p-3">
                              <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                  <div class="fw-bold">Nueva transacción para: {{ item.descripcion }}</div>
                                  <div class="text-muted small">Rubro: {{ item.rubro.nombre }}</div>
                                </div>
                                <button
                                  type="button"
                                  class="btn btn-outline-secondary btn-sm"
                                  (click)="closeInlineForm()"
                                  [disabled]="savingTransaction()"
                                >
                                  Cerrar
                                </button>
                              </div>
                              <form [formGroup]="newTransactionForm" (ngSubmit)="submitNewTransaction()">
                                <div class="row g-2">
                                  <div class="col-12 col-md-4">
                                    <label for="descripcion-{{ item.id }}" class="form-label">Descripción</label>
                                    <input
                                      class="form-control"
                                      [id]="'descripcion-' + item.id"
                                      type="text"
                                      formControlName="descripcion"
                                      [class.is-invalid]="isInvalid('descripcion')"
                                      autocomplete="off"
                                      required
                                    />
                                    <div class="invalid-feedback" *ngIf="isInvalid('descripcion')">
                                      Ingresa una descripción (mínimo 3 caracteres).
                                    </div>
                                  </div>
                                  <div class="col-12 col-md-2">
                                    <label for="fecha-{{ item.id }}" class="form-label">Fecha</label>
                                    <input
                                      class="form-control"
                                      [id]="'fecha-' + item.id"
                                      type="date"
                                      formControlName="fecha"
                                      [class.is-invalid]="isInvalid('fecha')"
                                      required
                                    />
                                    <div class="invalid-feedback" *ngIf="isInvalid('fecha')">
                                      Selecciona la fecha.
                                    </div>
                                  </div>
                                  <div class="col-12 col-md-2">
                                    <label for="monto-{{ item.id }}" class="form-label">Monto</label>
                                    <input
                                      class="form-control"
                                      [id]="'monto-' + item.id"
                                      type="number"
                                      formControlName="monto"
                                      [class.is-invalid]="isInvalid('monto')"
                                      step="0.01"
                                      min="0"
                                      required
                                    />
                                    <div class="invalid-feedback" *ngIf="isInvalid('monto')">
                                      Ingresa un monto válido.
                                    </div>
                                  </div>
                                  <div class="col-12 col-md-4">
                                    <label for="cuenta-{{ item.id }}" class="form-label">Cuenta financiera</label>
                                    <select
                                      class="form-select"
                                      [id]="'cuenta-' + item.id"
                                      formControlName="cuentaFinanciera_id"
                                      [class.is-invalid]="isInvalid('cuentaFinanciera_id')"
                                      required
                                    >
                                      <option [ngValue]="null" disabled>Selecciona una cuenta</option>
                                      <option *ngFor="let cuenta of cuentasFinancieras()" [ngValue]="cuenta.id">
                                        {{ cuenta.nombre }} - {{ cuenta.divisa.codigo }}
                                      </option>
                                    </select>
                                    <div class="invalid-feedback" *ngIf="isInvalid('cuentaFinanciera_id')">
                                      Selecciona la cuenta financiera.
                                    </div>
                                  </div>
                                  <div class="col-12 d-flex gap-2">
                                    <button type="submit" class="btn btn-primary btn-sm" [disabled]="savingTransaction()">
                                      Guardar transacción
                                    </button>
                                    <button
                                      type="button"
                                      class="btn btn-outline-secondary btn-sm"
                                      (click)="closeInlineForm()"
                                      [disabled]="savingTransaction()"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                  <div class="col-12">
                                    <div *ngIf="inlineStatusMessage()" class="alert alert-success mb-0">
                                      {{ inlineStatusMessage() }}
                                    </div>
                                    <div *ngIf="inlineErrorMessage()" class="alert alert-danger mb-0">
                                      {{ inlineErrorMessage() }}
                                    </div>
                                  </div>
                                </div>
                              </form>
                            </div>
                          </td>
                        </tr>
                      </ng-container>
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colspan="2" class="text-end">Total</th>
                        <th class="text-end">{{ getTotal(ahorro()) | number: '1.2-2' }}</th>
                        <th class="text-end">{{ getTotalTransacciones(ahorro()) | number: '1.2-2' }}</th>
                        <th></th>
                        <th></th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div class="card-body border-top" *ngIf="newPlanCategory() === 'ahorro'">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div class="fw-bold">Nueva partida planificada de ahorro</div>
                    <div class="text-muted small">Periodo: {{ getSelectedPeriodoNombre() || '—' }}</div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    (click)="closeNewPlanForm()"
                    [disabled]="newPlanSaving()"
                  >
                    Cerrar
                  </button>
                </div>
                <form [formGroup]="newPlanForm" (ngSubmit)="submitNewPlanForm()" novalidate>
                  <div class="row g-2">
                    <div class="col-12 col-md-4">
                      <label for="rubro-ahorro" class="form-label">Rubro</label>
                      <select
                        id="rubro-ahorro"
                        class="form-select"
                        formControlName="rubro_id"
                        [class.is-invalid]="isNewPlanInvalid('rubro_id')"
                        required
                      >
                        <option [ngValue]="null" disabled>Selecciona un rubro</option>
                        <option *ngFor="let rubro of getRubrosByCategory('ahorro')" [ngValue]="rubro.id">
                          {{ rubro.nombre }}
                        </option>
                      </select>
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('rubro_id')">
                        Selecciona el rubro de la partida.
                      </div>
                    </div>
                    <div class="col-12 col-md-4">
                      <label for="descripcion-ahorro" class="form-label">Descripción</label>
                      <input
                        id="descripcion-ahorro"
                        type="text"
                        class="form-control"
                        formControlName="descripcion"
                        [class.is-invalid]="isNewPlanInvalid('descripcion')"
                        autocomplete="off"
                        required
                      />
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('descripcion')">
                        Ingresa una descripción (mínimo 3 caracteres).
                      </div>
                    </div>
                    <div class="col-12 col-md-2">
                      <label for="monto-ahorro" class="form-label">Monto comprometido</label>
                      <input
                        id="monto-ahorro"
                        type="number"
                        class="form-control"
                        formControlName="montoComprometido"
                        [class.is-invalid]="isNewPlanInvalid('montoComprometido')"
                        step="0.01"
                        min="0"
                        required
                      />
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('montoComprometido')">
                        Ingresa un monto comprometido válido.
                      </div>
                    </div>
                    <div class="col-12 col-md-2">
                      <label for="fecha-ahorro" class="form-label">Fecha objetivo</label>
                      <input
                        id="fecha-ahorro"
                        type="date"
                        class="form-control"
                        formControlName="fechaObjetivo"
                      />
                    </div>
                    <div class="col-12 col-md-2">
                      <label for="cuotas-ahorro" class="form-label">Cuotas</label>
                      <input
                        id="cuotas-ahorro"
                        type="number"
                        class="form-control"
                        formControlName="cuota"
                        [class.is-invalid]="isNewPlanInvalid('cuota')"
                        min="1"
                      />
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('cuota')">
                        Ingresa un número de cuotas válido (1 o más).
                      </div>
                    </div>
                    <div class="col-12 col-md-2">
                      <label for="cantidad-cuotas-ahorro" class="form-label">Cantidad de cuotas</label>
                      <input
                        id="cantidad-cuotas-ahorro"
                        type="number"
                        class="form-control"
                        formControlName="cantidadCuotas"
                        [class.is-invalid]="isNewPlanInvalid('cantidadCuotas')"
                        min="1"
                      />
                      <div class="invalid-feedback" *ngIf="isNewPlanInvalid('cantidadCuotas')">
                        Ingresa una cantidad de cuotas válida (1 o más).
                      </div>
                    </div>
                    <div class="col-12 d-flex gap-2">
                      <button type="submit" class="btn btn-primary btn-sm" [disabled]="newPlanSaving()">
                        Guardar partida
                      </button>
                      <button
                        type="button"
                        class="btn btn-outline-secondary btn-sm"
                        (click)="closeNewPlanForm()"
                        [disabled]="newPlanSaving()"
                      >
                        Cancelar
                      </button>
                    </div>
                    <div class="col-12">
                      <div *ngIf="newPlanStatusMessage()" class="alert alert-success mb-0">
                        {{ newPlanStatusMessage() }}
                      </div>
                      <div *ngIf="newPlanErrorMessage()" class="alert alert-danger mb-0">
                        {{ newPlanErrorMessage() }}
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </ng-container>
        <ng-container *ngIf="deleteTransactionModalOpen()">
          <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true">
            <div class="modal-dialog" role="document">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Eliminar transacción</h5>
                  <button
                    type="button"
                    class="btn-close"
                    aria-label="Close"
                    (click)="closeDeleteTransactionModal()"
                    [disabled]="deletingTransactionId() !== null"
                  ></button>
                </div>
                <div class="modal-body">
                  <p class="mb-0">
                    ¿Seguro que deseas eliminar la transacción
                    <strong>{{ transaccionToDelete()?.descripcion }}</strong>?
                  </p>
                </div>
                <div class="modal-footer">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    (click)="closeDeleteTransactionModal()"
                    [disabled]="deletingTransactionId() !== null"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    class="btn btn-danger"
                    (click)="deleteTransaccion()"
                    [disabled]="deletingTransactionId() !== null"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-backdrop fade show"></div>
        </ng-container>
        <ng-container *ngIf="consolidateModalOpen()">
          <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true">
            <div class="modal-dialog" role="document">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Consolidar partida</h5>
                  <button
                    type="button"
                    class="btn-close"
                    aria-label="Close"
                    (click)="closeConsolidateModal()"
                    [disabled]="consolidatingPartidaId() !== null"
                  ></button>
                </div>
                <div class="modal-body">
                  <p class="mb-0">
                    ¿Seguro que deseas consolidar este gasto
                    <strong>{{ partidaToConsolidate()?.descripcion }}</strong>?
                  </p>
                </div>
                <div class="modal-footer">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    (click)="closeConsolidateModal()"
                    [disabled]="consolidatingPartidaId() !== null"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    class="btn btn-info"
                    (click)="consolidatePartida()"
                    [disabled]="consolidatingPartidaId() !== null"
                  >
                    Consolidar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-backdrop fade show"></div>
        </ng-container>
        <ng-container *ngIf="deleteModalOpen()">
          <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true">
            <div class="modal-dialog" role="document">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Eliminar partida</h5>
                  <button
                    type="button"
                    class="btn-close"
                    aria-label="Close"
                    (click)="closeDeleteModal()"
                    [disabled]="deletingPartidaId() !== null"
                  ></button>
                </div>
                <div class="modal-body">
                  <p class="mb-0">
                    ¿Seguro que deseas eliminar la partida
                    <strong>{{ partidaToDelete()?.descripcion }}</strong>?
                  </p>
                </div>
                <div class="modal-footer">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    (click)="closeDeleteModal()"
                    [disabled]="deletingPartidaId() !== null"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    class="btn btn-danger"
                    (click)="deletePartida()"
                    [disabled]="deletingPartidaId() !== null"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-backdrop fade show"></div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [
    `
      .icon-btn {
        width: 2.25rem;
        height: 2.25rem;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .view-icon,
      .transaction-icon,
      .consolidate-icon {
        font-size: 1rem;
        line-height: 1;
      }
    `,
  ],
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
  protected readonly viewingTransactionsPartidaId = signal<number | null>(null);
  protected readonly inlineFormPartidaId = signal<number | null>(null);
  protected readonly deleteModalOpen = signal(false);
  protected readonly partidaToDelete = signal<PartidaPlanificada | null>(null);
  protected readonly deletingPartidaId = signal<number | null>(null);
  protected readonly consolidateModalOpen = signal(false);
  protected readonly partidaToConsolidate = signal<PartidaPlanificada | null>(null);
  protected readonly consolidatingPartidaId = signal<number | null>(null);
  protected readonly cuentasFinancieras = signal<CuentaFinanciera[]>([]);
  protected readonly savingTransaction = signal(false);
  protected readonly inlineStatusMessage = signal('');
  protected readonly inlineErrorMessage = signal('');
  protected readonly deleteTransactionModalOpen = signal(false);
  protected readonly transaccionToDelete = signal<PartidaPlanificadaTransaccion | null>(null);
  protected readonly deletingTransactionId = signal<number | null>(null);
  protected readonly newTransactionForm: FormGroup;
  protected readonly newPlanCategory = signal<'ingreso' | 'gasto' | 'ahorro' | null>(null);
  protected readonly newPlanForm: FormGroup;
  protected readonly newPlanSaving = signal(false);
  protected readonly newPlanStatusMessage = signal('');
  protected readonly newPlanErrorMessage = signal('');
  protected readonly rubros = signal<Rubro[]>([]);

  constructor(
    private readonly presupuestoService: PresupuestoService,
    private readonly partidaPlanificadaService: PartidaPlanificadaService,
    private readonly transaccionService: TransaccionService,
    private readonly fb: FormBuilder,
    private readonly rubroService: RubroService
  ) {
    this.newTransactionForm = this.fb.group({
      presupuesto_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      rubro_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      cuentaFinanciera_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      descripcion: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(3)],
        nonNullable: true,
      }),
      fecha: this.fb.control<string | null>(null, { validators: [Validators.required] }),
      monto: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
      partidaPlanificada_id: this.fb.control<number | null>(null),
    });

    this.newPlanForm = this.fb.group({
      presupuesto_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      rubro_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      descripcion: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(3)],
        nonNullable: true,
      }),
      montoComprometido: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
      fechaObjetivo: this.fb.control<string | null>(null),
      cuota: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
      cantidadCuotas: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
    });
  }

  ngOnInit(): void {
    this.loadDropdown();
    this.loadCuentasFinancieras();
    this.loadRubros();
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
    this.closeNewPlanForm();
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

  protected getCuotasLabel(partida: PartidaPlanificada): string {
    if (partida.cuota === null || partida.cuota === undefined || partida.cantidadCuotas === null || partida.cantidadCuotas === undefined) {
      return '—';
    }

    return `${partida.cuota} de ${partida.cantidadCuotas}`;
  }

  protected getRowClasses(partida: PartidaPlanificada): Record<string, boolean> {
    const status = this.getRowStatus(partida);
    return {
      'table-success': status === 'success',
      'table-danger': status === 'danger',
      'table-warning': status === 'warning',
    };
  }

  protected toggleTransactionsView(partida: PartidaPlanificada): void {
    if (this.viewingTransactionsPartidaId() === partida.id) {
      this.closeTransactionsView();
      return;
    }

    this.closeInlineForm();
    this.viewingTransactionsPartidaId.set(partida.id);
  }

  protected closeTransactionsView(): void {
    this.viewingTransactionsPartidaId.set(null);
  }

  protected toggleNewTransactionForm(partida: PartidaPlanificada): void {
    this.closeTransactionsView();

    if (this.inlineFormPartidaId() === partida.id) {
      this.closeInlineForm();
      return;
    }

    this.inlineFormPartidaId.set(partida.id);
    this.inlineStatusMessage.set('');
    this.inlineErrorMessage.set('');
    this.prepareInlineForm(partida);
  }

  protected canConsolidate(partida: PartidaPlanificada): boolean {
    return this.hasTransacciones(partida) && partida.consolidado !== true;
  }

  protected confirmConsolidatePartida(partida: PartidaPlanificada): void {
    if (!this.canConsolidate(partida)) {
      return;
    }

    this.partidaToConsolidate.set(partida);
    this.consolidateModalOpen.set(true);
  }

  protected closeConsolidateModal(): void {
    if (this.consolidatingPartidaId() !== null) {
      return;
    }

    this.consolidateModalOpen.set(false);
    this.partidaToConsolidate.set(null);
  }

  protected consolidatePartida(): void {
    const partida = this.partidaToConsolidate();
    if (!partida) {
      this.closeConsolidateModal();
      return;
    }

    this.consolidatingPartidaId.set(partida.id);
    this.errorMessage.set('');

    this.partidaPlanificadaService.consolidate(partida.id).subscribe({
      next: (response) => {
        if (!response.success) {
          this.errorMessage.set(response.message || 'No se pudo consolidar la partida planificada.');
          this.consolidatingPartidaId.set(null);
          return;
        }

        this.loadData();
        this.consolidatingPartidaId.set(null);
        this.consolidateModalOpen.set(false);
        this.partidaToConsolidate.set(null);
      },
      error: () => {
        this.errorMessage.set('No se pudo consolidar la partida planificada.');
        this.consolidatingPartidaId.set(null);
      },
    });
  }

  protected closeInlineForm(): void {
    this.inlineFormPartidaId.set(null);
    this.prepareInlineForm(null);
    this.inlineStatusMessage.set('');
    this.inlineErrorMessage.set('');
  }

  protected openNewPlanForm(category: 'ingreso' | 'gasto' | 'ahorro'): void {
    this.newPlanCategory.set(category);
    this.newPlanStatusMessage.set('');
    this.newPlanErrorMessage.set('');
    this.prepareNewPlanForm();
  }

  protected closeNewPlanForm(): void {
    this.newPlanCategory.set(null);
    this.newPlanForm.reset({
      presupuesto_id: this.selectedPresupuestoId(),
      rubro_id: null,
      descripcion: '',
      montoComprometido: null,
      fechaObjetivo: null,
      cuota: null,
      cantidadCuotas: null,
    });
  }

  protected submitNewPlanForm(): void {
    if (this.newPlanForm.invalid) {
      this.newPlanForm.markAllAsTouched();
      return;
    }

    const payload = this.newPlanForm.value as PartidaPlanificadaRequestDto;
    this.newPlanSaving.set(true);
    this.newPlanStatusMessage.set('');
    this.newPlanErrorMessage.set('');

    this.partidaPlanificadaService.create(payload).subscribe({
      next: (response) => {
        if (!response.success) {
          this.newPlanErrorMessage.set(response.message || 'No se pudo crear la partida planificada.');
          return;
        }

        this.newPlanStatusMessage.set(response.message || 'Partida planificada creada correctamente.');
        this.closeNewPlanForm();
        this.loadData();
      },
      error: () => {
        this.newPlanErrorMessage.set('No se pudo crear la partida planificada.');
      },
      complete: () => this.newPlanSaving.set(false),
    });
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.newTransactionForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  protected isNewPlanInvalid(controlName: string): boolean {
    const control = this.newPlanForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  protected submitNewTransaction(): void {
    if (this.newTransactionForm.invalid) {
      this.newTransactionForm.markAllAsTouched();
      return;
    }

    const payload = this.newTransactionForm.value as TransaccionRequestDto;
    this.savingTransaction.set(true);
    this.inlineStatusMessage.set('');
    this.inlineErrorMessage.set('');

    this.transaccionService.create(payload).subscribe({
      next: (response) => {
        if (!response.success) {
          this.inlineErrorMessage.set(response.message || 'No se pudo crear la transacción.');
          return;
        }

        this.inlineStatusMessage.set(response.message || 'Transacción creada correctamente.');
        const partida = this.getPartidaById(this.inlineFormPartidaId());
        if (partida) {
          this.prepareInlineForm(partida);
        } else {
          this.closeInlineForm();
        }
        this.loadData();
      },
      error: () => {
        this.inlineErrorMessage.set('No se pudo crear la transacción.');
      },
      complete: () => this.savingTransaction.set(false),
    });
  }

  private loadCuentasFinancieras(): void {
    this.transaccionService.getCuentasFinancieras().subscribe({
      next: (response) => this.cuentasFinancieras.set(response.data ?? []),
      error: () => this.inlineErrorMessage.set('No se pudieron obtener las cuentas financieras.'),
    });
  }

  private loadRubros(): void {
    this.rubroService.getAll().subscribe({
      next: (response) => this.rubros.set(response.data ?? []),
      error: () => this.newPlanErrorMessage.set('No se pudieron obtener los rubros.'),
    });
  }

  protected getRubrosByCategory(category: 'ingreso' | 'gasto' | 'ahorro'): Rubro[] {
    const naturalezaMap: Record<'ingreso' | 'gasto' | 'ahorro', string[]> = {
      ingreso: ['INGRESO'],
      gasto: ['GASTO', 'EGRESO'],
      ahorro: ['AHORRO'],
    };

    const allowedNaturalezas = naturalezaMap[category];

    return this.rubros().filter((rubro) => {
      const naturaleza = (rubro.naturaleza || '').toUpperCase();
      return allowedNaturalezas.includes(naturaleza);
    });
  }

  protected getSelectedPeriodoNombre(): string | undefined {
    const selectedId = this.selectedPresupuestoId();
    if (!selectedId) {
      return undefined;
    }

    const periodo = this.dropdown().find((item) => item.id === selectedId);
    return periodo?.nombre;
  }

  private prepareNewPlanForm(): void {
    this.newPlanForm.reset({
      presupuesto_id: this.selectedPresupuestoId(),
      rubro_id: null,
      descripcion: '',
      montoComprometido: null,
      fechaObjetivo: null,
      cuota: null,
      cantidadCuotas: null,
    });
  }

  private prepareInlineForm(partida: PartidaPlanificada | null): void {
    const today = this.getTodayDateString();
    const montoPredeterminado = partida ? this.getSaldoPartida(partida) : null;

    this.newTransactionForm.reset({
      presupuesto_id: partida?.presupuesto?.id ?? this.selectedPresupuestoId(),
      rubro_id: partida?.rubro?.id ?? null,
      cuentaFinanciera_id: null,
      descripcion: '',
      fecha: today,
      monto: montoPredeterminado,
      partidaPlanificada_id: partida?.id ?? null,
    });
  }

  private getPartidaById(id: number | null): PartidaPlanificada | undefined {
    if (id === null) {
      return undefined;
    }

    return [...this.ingresos(), ...this.gastos(), ...this.ahorro()].find((partida) => partida.id === id);
  }

  private getSaldoPartida(partida: PartidaPlanificada): number {
    return (partida.montoComprometido ?? 0) - this.getTransaccionesSum(partida);
  }

  private getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getRowStatus(partida: PartidaPlanificada): 'success' | 'danger' | 'warning' | null {
    if (this.isEightyPercentOrMore(partida)) {
      return 'success';
    }

    if (this.hasTransacciones(partida)) {
      return null;
    }

    const fechaObjetivo = this.getFechaObjetivoDate(partida.fechaObjetivo);
    if (!fechaObjetivo) {
      return null;
    }

    const today = this.getTodayAtMidnight();
    if (fechaObjetivo <= today) {
      return 'danger';
    }

    const tenDaysAhead = new Date(today);
    tenDaysAhead.setDate(today.getDate() + 10);
    if (fechaObjetivo > today && fechaObjetivo <= tenDaysAhead) {
      return 'warning';
    }

    return null;
  }

  private isEightyPercentOrMore(partida: PartidaPlanificada): boolean {
    const comprometido = partida.montoComprometido ?? 0;
    if (comprometido <= 0) {
      return false;
    }

    const transacciones = this.getTransaccionesSum(partida);
    return transacciones / comprometido >= 0.8;
  }

  protected hasTransacciones(partida: PartidaPlanificada): boolean {
    return (partida.transacciones?.length ?? 0) > 0;
  }

  protected confirmDeleteTransaccion(transaccion: PartidaPlanificadaTransaccion): void {
    this.transaccionToDelete.set(transaccion);
    this.deleteTransactionModalOpen.set(true);
  }

  protected closeDeleteTransactionModal(): void {
    if (this.deletingTransactionId() !== null) {
      return;
    }

    this.deleteTransactionModalOpen.set(false);
    this.transaccionToDelete.set(null);
  }

  protected deleteTransaccion(): void {
    const transaccion = this.transaccionToDelete();
    if (!transaccion) {
      this.closeDeleteTransactionModal();
      return;
    }

    this.deleteTransactionModalOpen.set(false);
    this.deletingTransactionId.set(transaccion.id);
    this.errorMessage.set('');
    this.transaccionService.delete(transaccion.id).subscribe({
      next: () => this.loadData(),
      error: () => {
        this.errorMessage.set('No se pudo eliminar la transacción.');
        this.deletingTransactionId.set(null);
        this.transaccionToDelete.set(null);
      },
      complete: () => {
        this.deletingTransactionId.set(null);
        this.transaccionToDelete.set(null);
        this.deleteTransactionModalOpen.set(false);
      },
    });
  }

  protected confirmDeletePartida(partida: PartidaPlanificada): void {
    this.partidaToDelete.set(partida);
    this.deleteModalOpen.set(true);
    this.closeInlineForm();
    this.closeTransactionsView();
  }

  protected closeDeleteModal(): void {
    if (this.deletingPartidaId() !== null) {
      return;
    }

    this.deleteModalOpen.set(false);
    this.partidaToDelete.set(null);
  }

  protected deletePartida(): void {
    const partida = this.partidaToDelete();
    if (!partida) {
      this.closeDeleteModal();
      return;
    }

    this.deleteModalOpen.set(false);
    this.deletingPartidaId.set(partida.id);
    this.errorMessage.set('');
    this.partidaPlanificadaService.delete(partida.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: () => this.errorMessage.set('No se pudo eliminar la partida planificada.'),
      complete: () => {
        this.deletingPartidaId.set(null);
        this.partidaToDelete.set(null);
        this.deleteModalOpen.set(false);
      },
    });
  }

  private getFechaObjetivoDate(fechaObjetivo?: string | null): Date | null {
    if (!fechaObjetivo) {
      return null;
    }

    const parsed = new Date(fechaObjetivo);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private getTodayAtMidnight(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
