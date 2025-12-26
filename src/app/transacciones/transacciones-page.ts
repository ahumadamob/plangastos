import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import {
  TransaccionService,
  Transaccion,
  TransaccionRequestDto,
} from './transaccion.service';
import { Presupuesto } from '../presupuestos/presupuesto.service';
import { Rubro } from '../rubros/rubro.service';
import { CuentaFinanciera } from '../cuentas-financieras/cuenta-financiera.service';
import { PartidaPlanificada } from '../partidas-planificadas/partida-planificada.service';

@Component({
  selector: 'app-transacciones-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>Transacciones</span>
        <button type="button" class="btn btn-success btn-sm" (click)="showNewForm()">
          Nueva transacción
        </button>
      </div>
      <div class="card-body">
        <div *ngIf="displayForm()" class="mb-4">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="row g-3">
              <div class="col-12">
                <label for="descripcion" class="form-label">Descripción</label>
                <input
                  id="descripcion"
                  type="text"
                  class="form-control"
                  formControlName="descripcion"
                  [class.is-invalid]="isInvalid('descripcion')"
                  autocomplete="off"
                  maxlength="250"
                  required
                />
                <div class="invalid-feedback" *ngIf="isInvalid('descripcion')">
                  La descripción es obligatoria y debe tener al menos 3 caracteres.
                </div>
              </div>

              <div class="col-12 col-md-4">
                <label for="presupuesto" class="form-label">Presupuesto</label>
                <select
                  id="presupuesto"
                  class="form-select"
                  formControlName="presupuesto_id"
                  [class.is-invalid]="isInvalid('presupuesto_id')"
                  required
                >
                  <option [ngValue]="null" disabled>Selecciona un presupuesto</option>
                  <option *ngFor="let presupuesto of presupuestos()" [ngValue]="presupuesto.id">
                    {{ presupuesto.nombre }}
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="isInvalid('presupuesto_id')">
                  Selecciona un presupuesto.
                </div>
              </div>

              <div class="col-12 col-md-4">
                <label for="rubro" class="form-label">Rubro</label>
                <select
                  id="rubro"
                  class="form-select"
                  formControlName="rubro_id"
                  [class.is-invalid]="isInvalid('rubro_id')"
                  required
                >
                  <option [ngValue]="null" disabled>Selecciona un rubro</option>
                  <option *ngFor="let rubro of rubros()" [ngValue]="rubro.id">
                    {{ rubro.nombre }} ({{ rubro.naturaleza }})
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="isInvalid('rubro_id')">
                  Selecciona el rubro de la transacción.
                </div>
              </div>

              <div class="col-12 col-md-4">
                <label for="cuenta" class="form-label">Cuenta financiera</label>
                <select
                  id="cuenta"
                  class="form-select"
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
                  Selecciona la cuenta financiera de la transacción.
                </div>
              </div>

              <div class="col-12 col-md-4">
                <label for="fecha" class="form-label">Fecha</label>
                <input
                  id="fecha"
                  type="date"
                  class="form-control"
                  formControlName="fecha"
                  [class.is-invalid]="isInvalid('fecha')"
                  required
                />
                <div class="invalid-feedback" *ngIf="isInvalid('fecha')">Selecciona la fecha.</div>
              </div>

              <div class="col-12 col-md-4">
                <label for="monto" class="form-label">Monto</label>
                <input
                  id="monto"
                  type="number"
                  class="form-control"
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
                <label for="partida" class="form-label">Partida planificada</label>
                <select
                  id="partida"
                  class="form-select"
                  formControlName="partidaPlanificada_id"
                  [class.is-invalid]="isInvalid('partidaPlanificada_id')"
                >
                  <option [ngValue]="null">Sin partida planificada</option>
                  <option *ngFor="let partida of partidasPlanificadas()" [ngValue]="partida.id">
                    {{ partida.descripcion }}
                  </option>
                </select>
              </div>

              <div class="col-12 col-md-6">
                <label for="referenciaExterna" class="form-label">Referencia externa</label>
                <input
                  id="referenciaExterna"
                  type="text"
                  class="form-control"
                  formControlName="referenciaExterna"
                  maxlength="150"
                  autocomplete="off"
                />
              </div>

              <div class="col-12 d-flex gap-2">
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                  {{ editingTransaccionId() ? 'Guardar cambios' : 'Crear transacción' }}
                </button>
                <button type="button" class="btn btn-outline-secondary" (click)="cancelForm()" [disabled]="saving()">
                  Cancelar
                </button>
              </div>
            </div>
          </form>
          <hr />
        </div>

        <div *ngIf="loading()" class="alert alert-info mb-3">Cargando transacciones...</div>
        <div *ngIf="statusMessage()" class="alert alert-success mb-3">{{ statusMessage() }}</div>
        <div *ngIf="errorMessage()" class="alert alert-danger mb-3">{{ errorMessage() }}</div>
        <div *ngIf="!loading() && transacciones().length === 0" class="alert alert-secondary">
          No hay transacciones registradas todavía.
        </div>

        <div class="table-responsive" *ngIf="transacciones().length > 0">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Presupuesto</th>
                <th>Rubro</th>
                <th>Cuenta</th>
                <th>Fecha</th>
                <th class="text-end">Monto</th>
                <th>Referencia</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let transaccion of transacciones()">
                <td>{{ transaccion.descripcion }}</td>
                <td>{{ transaccion.presupuesto.nombre }}</td>
                <td>{{ transaccion.rubro.nombre }}</td>
                <td>{{ transaccion.cuenta.nombre }}</td>
                <td>{{ transaccion.fecha }}</td>
                <td class="text-end">{{ transaccion.monto | number : '1.2-2' }}</td>
                <td>{{ transaccion.referenciaExterna || '—' }}</td>
                <td class="text-end d-flex gap-2 justify-content-end">
                  <button class="btn btn-outline-primary btn-sm" type="button" (click)="startEdit(transaccion)">
                    Editar
                  </button>
                  <button class="btn btn-danger btn-sm" type="button" (click)="openDeleteModal(transaccion)">
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      *ngIf="deleteModalOpen()"
      style="background-color: rgba(0, 0, 0, 0.5);"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Eliminar transacción</h5>
            <button type="button" class="btn-close" aria-label="Close" (click)="closeDeleteModal()"></button>
          </div>
          <div class="modal-body">
            <p *ngIf="transaccionToDelete()">
              ¿Seguro que deseas eliminar la transacción "{{ transaccionToDelete()?.descripcion }}"?
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeDeleteModal()">
              Cancelar
            </button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()" [disabled]="loading()">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TransaccionesPage implements OnInit {
  protected readonly transacciones = signal<Transaccion[]>([]);
  protected readonly presupuestos = signal<Presupuesto[]>([]);
  protected readonly rubros = signal<Rubro[]>([]);
  protected readonly cuentasFinancieras = signal<CuentaFinanciera[]>([]);
  protected readonly partidasPlanificadas = signal<PartidaPlanificada[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly displayForm = signal(false);
  protected readonly deleteModalOpen = signal(false);
  protected readonly transaccionToDelete = signal<Transaccion | null>(null);
  protected readonly editingTransaccionId = signal<number | null>(null);

  protected readonly form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly transaccionService: TransaccionService,
    private readonly route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      presupuesto_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      rubro_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      cuentaFinanciera_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      descripcion: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(3)],
        nonNullable: true,
      }),
      fecha: this.fb.control<string | null>(null, { validators: [Validators.required] }),
      monto: this.fb.control<number | null>(null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      referenciaExterna: this.fb.control<string | null>(null),
      partidaPlanificada_id: this.fb.control<number | null>(null),
    });
  }

  ngOnInit(): void {
    this.loadPresupuestos();
    this.loadRubros();
    this.loadCuentasFinancieras();
    this.loadPartidasPlanificadas();
    this.loadTransacciones();
    this.route.queryParams.subscribe((params) => this.applyQueryParams(params));
  }

  protected showNewForm(): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
    this.displayForm.set(true);
    this.editingTransaccionId.set(null);
    this.resetForm();
  }

  protected startEdit(transaccion: Transaccion): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
    this.displayForm.set(true);
    this.editingTransaccionId.set(transaccion.id);
    this.form.reset({
      presupuesto_id: transaccion.presupuesto?.id ?? null,
      rubro_id: transaccion.rubro?.id ?? null,
      cuentaFinanciera_id: transaccion.cuenta?.id ?? null,
      descripcion: transaccion.descripcion,
      fecha: transaccion.fecha,
      monto: transaccion.monto,
      referenciaExterna: transaccion.referenciaExterna ?? null,
      partidaPlanificada_id: transaccion.partidaPlanificada?.id ?? null,
    });
  }

  protected cancelForm(): void {
    this.displayForm.set(false);
    this.editingTransaccionId.set(null);
    this.resetForm();
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.value as TransaccionRequestDto;
    const transaccionId = this.editingTransaccionId();

    this.saving.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    const request$ = transaccionId
      ? this.transaccionService.update(transaccionId, payload)
      : this.transaccionService.create(payload);

    request$.subscribe({
      next: () => {
        this.statusMessage.set(
          transaccionId
            ? 'Transacción actualizada correctamente.'
            : 'Transacción creada correctamente.'
        );
        this.displayForm.set(false);
        this.editingTransaccionId.set(null);
        this.loadTransacciones();
        this.resetForm();
      },
      error: () => {
        this.errorMessage.set(
          transaccionId
            ? 'Ocurrió un error al actualizar la transacción.'
            : 'Ocurrió un error al guardar la transacción.'
        );
      },
      complete: () => this.saving.set(false),
    });
  }

  protected openDeleteModal(transaccion: Transaccion): void {
    this.transaccionToDelete.set(transaccion);
    this.deleteModalOpen.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');
  }

  protected closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.transaccionToDelete.set(null);
  }

  protected confirmDelete(): void {
    const transaccion = this.transaccionToDelete();
    if (!transaccion) {
      return;
    }

    this.loading.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    this.transaccionService.delete(transaccion.id).subscribe({
      next: () => {
        this.statusMessage.set('Transacción eliminada correctamente.');
        this.loadTransacciones();
      },
      error: () => {
        this.errorMessage.set('No se pudo eliminar la transacción.');
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
        this.closeDeleteModal();
      },
    });
  }

  private resetForm(): void {
    this.form.reset({
      presupuesto_id: null,
      rubro_id: null,
      cuentaFinanciera_id: null,
      descripcion: '',
      fecha: null,
      monto: null,
      referenciaExterna: null,
      partidaPlanificada_id: null,
    });
  }

  private loadTransacciones(): void {
    this.loading.set(true);
    this.transaccionService.getAll().subscribe({
      next: (response) => this.transacciones.set(response.data ?? []),
      error: () => {
        this.errorMessage.set('No se pudieron obtener las transacciones.');
        this.transacciones.set([]);
      },
      complete: () => this.loading.set(false),
    });
  }

  private loadPresupuestos(): void {
    this.transaccionService.getPresupuestos().subscribe({
      next: (response) => this.presupuestos.set(response.data ?? []),
      error: () => this.errorMessage.set('No se pudieron obtener los presupuestos.'),
    });
  }

  private loadRubros(): void {
    this.transaccionService.getRubros().subscribe({
      next: (response) => this.rubros.set(response.data ?? []),
      error: () => this.errorMessage.set('No se pudieron obtener los rubros.'),
    });
  }

  private loadCuentasFinancieras(): void {
    this.transaccionService.getCuentasFinancieras().subscribe({
      next: (response) => this.cuentasFinancieras.set(response.data ?? []),
      error: () => this.errorMessage.set('No se pudieron obtener las cuentas financieras.'),
    });
  }

  private loadPartidasPlanificadas(): void {
    this.transaccionService.getPartidasPlanificadas().subscribe({
      next: (response) => this.partidasPlanificadas.set(response.data ?? []),
      error: () => this.errorMessage.set('No se pudieron obtener las partidas planificadas.'),
    });
  }

  private applyQueryParams(params: Params): void {
    if (!('nueva' in params)) {
      return;
    }

    this.showNewForm();

    const presupuestoId = this.parseParamNumber(params['presupuestoId']);
    const partidaId = this.parseParamNumber(params['partidaId']);
    const rubroId = this.parseParamNumber(params['rubroId']);

    this.form.patchValue({
      presupuesto_id: presupuestoId,
      partidaPlanificada_id: partidaId,
      rubro_id: rubroId,
    });
  }

  private parseParamNumber(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
}
