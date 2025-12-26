import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PartidaPlanificada, PartidaPlanificadaService } from '../partidas-planificadas/partida-planificada.service';
import { PresupuestoDropdown, PresupuestoService } from '../presupuestos/presupuesto.service';
import { TransaccionRequestDto, TransaccionService } from '../transacciones/transaccion.service';
import { CuentaFinanciera } from '../cuentas-financieras/cuenta-financiera.service';

@Component({
  selector: 'app-periodos-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
                      <ng-container *ngFor="let item of ingresos()">
                        <tr>
                          <td>{{ item.descripcion }}</td>
                          <td>{{ item.rubro.nombre }}</td>
                          <td class="text-end">{{ item.montoComprometido | number: '1.2-2' }}</td>
                          <td class="text-end">{{ getTransaccionesSum(item) | number: '1.2-2' }}</td>
                          <td>{{ item.fechaObjetivo || '—' }}</td>
                          <td class="text-end">
                            <button
                              type="button"
                              class="btn btn-primary btn-sm"
                              (click)="toggleNewTransactionForm(item)"
                              aria-label="Registrar nueva transacción"
                            >
                              <span aria-hidden="true">+</span>
                            </button>
                          </td>
                        </tr>
                        <tr *ngIf="inlineFormPartidaId() === item.id">
                          <td colspan="6">
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
                                  <div class="col-12 col-md-6">
                                    <label for="referencia-{{ item.id }}" class="form-label">Referencia externa</label>
                                    <input
                                      class="form-control"
                                      [id]="'referencia-' + item.id"
                                      type="text"
                                      formControlName="referenciaExterna"
                                      maxlength="150"
                                      autocomplete="off"
                                    />
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
                      <ng-container *ngFor="let item of gastos()">
                        <tr>
                          <td>{{ item.descripcion }}</td>
                          <td>{{ item.rubro.nombre }}</td>
                          <td class="text-end">{{ item.montoComprometido | number: '1.2-2' }}</td>
                          <td class="text-end">{{ getTransaccionesSum(item) | number: '1.2-2' }}</td>
                          <td>{{ item.fechaObjetivo || '—' }}</td>
                          <td class="text-end">
                            <button
                              type="button"
                              class="btn btn-primary btn-sm"
                              (click)="toggleNewTransactionForm(item)"
                              aria-label="Registrar nueva transacción"
                            >
                              <span aria-hidden="true">+</span>
                            </button>
                          </td>
                        </tr>
                        <tr *ngIf="inlineFormPartidaId() === item.id">
                          <td colspan="6">
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
                                  <div class="col-12 col-md-6">
                                    <label for="referencia-{{ item.id }}" class="form-label">Referencia externa</label>
                                    <input
                                      class="form-control"
                                      [id]="'referencia-' + item.id"
                                      type="text"
                                      formControlName="referenciaExterna"
                                      maxlength="150"
                                      autocomplete="off"
                                    />
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
                      <ng-container *ngFor="let item of ahorro()">
                        <tr>
                          <td>{{ item.descripcion }}</td>
                          <td>{{ item.rubro.nombre }}</td>
                          <td class="text-end">{{ item.montoComprometido | number: '1.2-2' }}</td>
                          <td class="text-end">{{ getTransaccionesSum(item) | number: '1.2-2' }}</td>
                          <td>{{ item.fechaObjetivo || '—' }}</td>
                          <td class="text-end">
                            <button
                              type="button"
                              class="btn btn-primary btn-sm"
                              (click)="toggleNewTransactionForm(item)"
                              aria-label="Registrar nueva transacción"
                            >
                              <span aria-hidden="true">+</span>
                            </button>
                          </td>
                        </tr>
                        <tr *ngIf="inlineFormPartidaId() === item.id">
                          <td colspan="6">
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
                                  <div class="col-12 col-md-6">
                                    <label for="referencia-{{ item.id }}" class="form-label">Referencia externa</label>
                                    <input
                                      class="form-control"
                                      [id]="'referencia-' + item.id"
                                      type="text"
                                      formControlName="referenciaExterna"
                                      maxlength="150"
                                      autocomplete="off"
                                    />
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
  protected readonly inlineFormPartidaId = signal<number | null>(null);
  protected readonly cuentasFinancieras = signal<CuentaFinanciera[]>([]);
  protected readonly savingTransaction = signal(false);
  protected readonly inlineStatusMessage = signal('');
  protected readonly inlineErrorMessage = signal('');
  protected readonly newTransactionForm: FormGroup;

  constructor(
    private readonly presupuestoService: PresupuestoService,
    private readonly partidaPlanificadaService: PartidaPlanificadaService,
    private readonly transaccionService: TransaccionService,
    private readonly fb: FormBuilder
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
      referenciaExterna: this.fb.control<string | null>(null),
      partidaPlanificada_id: this.fb.control<number | null>(null),
    });
  }

  ngOnInit(): void {
    this.loadDropdown();
    this.loadCuentasFinancieras();
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
  protected toggleNewTransactionForm(partida: PartidaPlanificada): void {
    if (this.inlineFormPartidaId() === partida.id) {
      this.closeInlineForm();
      return;
    }

    this.inlineFormPartidaId.set(partida.id);
    this.inlineStatusMessage.set('');
    this.inlineErrorMessage.set('');
    this.prepareInlineForm(partida);
  }

  protected closeInlineForm(): void {
    this.inlineFormPartidaId.set(null);
    this.prepareInlineForm(null);
    this.inlineStatusMessage.set('');
    this.inlineErrorMessage.set('');
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.newTransactionForm.get(controlName);
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
      next: () => {
        this.inlineStatusMessage.set('Transacción creada correctamente.');
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

  private prepareInlineForm(partida: PartidaPlanificada | null): void {
    this.newTransactionForm.reset({
      presupuesto_id: partida?.presupuesto?.id ?? this.selectedPresupuestoId(),
      rubro_id: partida?.rubro?.id ?? null,
      cuentaFinanciera_id: null,
      descripcion: '',
      fecha: null,
      monto: null,
      referenciaExterna: null,
      partidaPlanificada_id: partida?.id ?? null,
    });
  }

  private getPartidaById(id: number | null): PartidaPlanificada | undefined {
    if (id === null) {
      return undefined;
    }

    return [...this.ingresos(), ...this.gastos(), ...this.ahorro()].find((partida) => partida.id === id);
  }
}
