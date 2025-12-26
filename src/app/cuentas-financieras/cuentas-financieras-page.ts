import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CuentaFinancieraService, CuentaFinanciera, CuentaFinancieraRequestDto, Divisa, TipoCuenta, Usuario } from './cuenta-financiera.service';

@Component({
  selector: 'app-cuentas-financieras-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>Cuentas financieras</span>
        <button type="button" class="btn btn-success btn-sm" (click)="showNewForm()">
          Nueva cuenta
        </button>
      </div>
      <div class="card-body">
        <div *ngIf="displayForm()" class="mb-4">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label for="nombre" class="form-label">Nombre</label>
                <input
                  id="nombre"
                  type="text"
                  class="form-control"
                  formControlName="nombre"
                  [class.is-invalid]="isInvalid('nombre')"
                  autocomplete="off"
                  maxlength="150"
                  required
                />
                <div class="invalid-feedback" *ngIf="isInvalid('nombre')">
                  El nombre es obligatorio y debe tener al menos 3 caracteres.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label for="tipo" class="form-label">Tipo</label>
                <select
                  id="tipo"
                  class="form-select"
                  formControlName="tipo"
                  [class.is-invalid]="isInvalid('tipo')"
                  required
                >
                  <option value="" disabled>Selecciona el tipo</option>
                  <option *ngFor="let tipo of tiposCuenta" [ngValue]="tipo">
                    {{ tipo }}
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="isInvalid('tipo')">
                  Selecciona el tipo de cuenta.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label for="usuario" class="form-label">Usuario</label>
                <select
                  id="usuario"
                  class="form-select"
                  formControlName="usuario_id"
                  [class.is-invalid]="isInvalid('usuario_id')"
                  required
                >
                  <option [ngValue]="null" disabled>Selecciona un usuario</option>
                  <option *ngFor="let usuario of usuarios()" [ngValue]="usuario.id">
                    {{ usuario.nombre }} ({{ usuario.email }})
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="isInvalid('usuario_id')">
                  Selecciona el usuario propietario de la cuenta.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label for="divisa" class="form-label">Divisa</label>
                <select
                  id="divisa"
                  class="form-select"
                  formControlName="divisa_id"
                  [class.is-invalid]="isInvalid('divisa_id')"
                  required
                >
                  <option [ngValue]="null" disabled>Selecciona una divisa</option>
                  <option *ngFor="let divisa of divisas()" [ngValue]="divisa.id">
                    {{ divisa.nombre }} ({{ divisa.codigo }})
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="isInvalid('divisa_id')">
                  Selecciona la divisa de la cuenta.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label for="saldoInicial" class="form-label">Saldo inicial</label>
                <input
                  id="saldoInicial"
                  type="number"
                  class="form-control"
                  formControlName="saldoInicial"
                  [class.is-invalid]="isInvalid('saldoInicial')"
                  step="0.01"
                  min="0"
                  required
                />
                <div class="invalid-feedback" *ngIf="isInvalid('saldoInicial')">
                  Ingresa un saldo inicial válido (0 o mayor).
                </div>
              </div>

              <div class="col-12 col-md-6 d-flex align-items-center">
                <div class="form-check mt-3 mt-md-4">
                  <input
                    id="activo"
                    type="checkbox"
                    class="form-check-input"
                    formControlName="activo"
                  />
                  <label for="activo" class="form-check-label">Activo</label>
                </div>
              </div>

              <div class="col-12 d-flex gap-2">
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                  {{ editingCuentaId() ? 'Guardar cambios' : 'Crear cuenta' }}
                </button>
                <button type="button" class="btn btn-outline-secondary" (click)="cancelForm()" [disabled]="saving()">
                  Cancelar
                </button>
              </div>
            </div>
          </form>
          <hr />
        </div>

        <div *ngIf="loading()" class="alert alert-info mb-3">Cargando cuentas...</div>
        <div *ngIf="statusMessage()" class="alert alert-success mb-3">{{ statusMessage() }}</div>
        <div *ngIf="errorMessage()" class="alert alert-danger mb-3">{{ errorMessage() }}</div>
        <div *ngIf="!loading() && cuentas().length === 0" class="alert alert-secondary">
          No hay cuentas financieras registradas todavía.
        </div>

        <div class="table-responsive" *ngIf="cuentas().length > 0">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Usuario</th>
                <th>Divisa</th>
                <th class="text-end">Saldo inicial</th>
                <th>Estado</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cuenta of cuentas()">
                <td>{{ cuenta.nombre }}</td>
                <td><span class="badge bg-secondary">{{ cuenta.tipo }}</span></td>
                <td>{{ cuenta.usuario.nombre }}</td>
                <td>{{ cuenta.divisa.nombre }} ({{ cuenta.divisa.codigo }})</td>
                <td class="text-end">{{ cuenta.saldoInicial | number : '1.2-2' }}</td>
                <td>
                  <span class="badge" [class.bg-success]="cuenta.activo" [class.bg-danger]="!cuenta.activo">
                    {{ cuenta.activo ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td class="text-end d-flex gap-2 justify-content-end">
                  <button class="btn btn-outline-primary btn-sm" type="button" (click)="startEdit(cuenta)">
                    Editar
                  </button>
                  <button class="btn btn-danger btn-sm" type="button" (click)="openDeleteModal(cuenta)">
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
            <h5 class="modal-title">Eliminar cuenta</h5>
            <button type="button" class="btn-close" aria-label="Close" (click)="closeDeleteModal()"></button>
          </div>
          <div class="modal-body">
            <p *ngIf="cuentaToDelete()">¿Seguro que deseas eliminar la cuenta "{{ cuentaToDelete()?.nombre }}"?</p>
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
export class CuentasFinancierasPage implements OnInit {
  protected readonly cuentas = signal<CuentaFinanciera[]>([]);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly divisas = signal<Divisa[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly displayForm = signal(false);
  protected readonly deleteModalOpen = signal(false);
  protected readonly cuentaToDelete = signal<CuentaFinanciera | null>(null);
  protected readonly editingCuentaId = signal<number | null>(null);

  protected readonly tiposCuenta: TipoCuenta[] = ['EFECTIVO', 'BANCO', 'TARJETA', 'BILLETERA', 'OTRA'];

  protected readonly form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly cuentaFinancieraService: CuentaFinancieraService
  ) {
    this.form = this.fb.group({
      nombre: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(3)],
        nonNullable: true,
      }),
      tipo: this.fb.control<TipoCuenta | ''>('', { validators: [Validators.required] }),
      usuario_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      divisa_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      saldoInicial: this.fb.control<number | null>(0, {
        validators: [Validators.required, Validators.min(0)],
      }),
      activo: this.fb.control(true, { nonNullable: true }),
    });
  }

  ngOnInit(): void {
    this.loadUsuarios();
    this.loadDivisas();
    this.loadCuentas();
  }

  protected showNewForm(): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
    this.displayForm.set(true);
    this.editingCuentaId.set(null);
    this.resetForm();
  }

  protected startEdit(cuenta: CuentaFinanciera): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
    this.displayForm.set(true);
    this.editingCuentaId.set(cuenta.id);
    this.form.reset({
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      usuario_id: cuenta.usuario?.id ?? null,
      divisa_id: cuenta.divisa?.id ?? null,
      saldoInicial: cuenta.saldoInicial,
      activo: cuenta.activo,
    });
  }

  protected cancelForm(): void {
    this.displayForm.set(false);
    this.editingCuentaId.set(null);
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

    const payload = this.form.value as CuentaFinancieraRequestDto;
    const cuentaId = this.editingCuentaId();

    this.saving.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    const request$ = cuentaId
      ? this.cuentaFinancieraService.update(cuentaId, payload)
      : this.cuentaFinancieraService.create(payload);

    request$.subscribe({
      next: () => {
        this.statusMessage.set(
          cuentaId ? 'Cuenta actualizada correctamente.' : 'Cuenta creada correctamente.'
        );
        this.displayForm.set(false);
        this.editingCuentaId.set(null);
        this.loadCuentas();
        this.resetForm();
      },
      error: () => {
        this.errorMessage.set(
          cuentaId ? 'Ocurrió un error al actualizar la cuenta.' : 'Ocurrió un error al guardar la cuenta.'
        );
      },
      complete: () => this.saving.set(false),
    });
  }

  protected openDeleteModal(cuenta: CuentaFinanciera): void {
    this.cuentaToDelete.set(cuenta);
    this.deleteModalOpen.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');
  }

  protected closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.cuentaToDelete.set(null);
  }

  protected confirmDelete(): void {
    const cuenta = this.cuentaToDelete();
    if (!cuenta) {
      return;
    }

    this.loading.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    this.cuentaFinancieraService.delete(cuenta.id).subscribe({
      next: () => {
        this.statusMessage.set('Cuenta eliminada correctamente.');
        this.loadCuentas();
      },
      error: () => {
        this.errorMessage.set('No se pudo eliminar la cuenta.');
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
      nombre: '',
      tipo: '',
      usuario_id: null,
      divisa_id: null,
      saldoInicial: 0,
      activo: true,
    });
  }

  private loadCuentas(): void {
    this.loading.set(true);
    this.cuentaFinancieraService.getAll().subscribe({
      next: (response) => this.cuentas.set(response.data ?? []),
      error: () => {
        this.errorMessage.set('No se pudieron obtener las cuentas financieras.');
        this.cuentas.set([]);
      },
      complete: () => this.loading.set(false),
    });
  }

  private loadUsuarios(): void {
    this.cuentaFinancieraService.getUsuarios().subscribe({
      next: (response) => this.usuarios.set(response.data ?? []),
      error: () => this.errorMessage.set('No se pudieron obtener los usuarios.'),
    });
  }

  private loadDivisas(): void {
    this.cuentaFinancieraService.getDivisas().subscribe({
      next: (response) => this.divisas.set(response.data ?? []),
      error: () => this.errorMessage.set('No se pudieron obtener las divisas.'),
    });
  }
}
