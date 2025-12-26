import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PlanPresupuestarioService,
  PlanPresupuestario,
  PlanPresupuestarioRequestDto,
  Divisa,
  Usuario,
} from './plan-presupuestario.service';

@Component({
  selector: 'app-plan-presupuestario-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>Planes presupuestarios</span>
        <button type="button" class="btn btn-success btn-sm" (click)="showNewForm()">
          Nuevo plan
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
                  Selecciona el usuario responsable del plan.
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
                  Selecciona la divisa del plan.
                </div>
              </div>

              <div class="col-12">
                <label for="descripcion" class="form-label">Descripción</label>
                <textarea
                  id="descripcion"
                  class="form-control"
                  formControlName="descripcion"
                  rows="3"
                  maxlength="500"
                  placeholder="Opcional"
                ></textarea>
              </div>

              <div class="col-12">
                <div class="form-check">
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
                  {{ editingPlanId() ? 'Guardar cambios' : 'Crear plan' }}
                </button>
                <button type="button" class="btn btn-outline-secondary" (click)="cancelForm()" [disabled]="saving()">
                  Cancelar
                </button>
              </div>
            </div>
          </form>
          <hr />
        </div>

        <div *ngIf="loading()" class="alert alert-info mb-3">Cargando planes...</div>
        <div *ngIf="statusMessage()" class="alert alert-success mb-3">{{ statusMessage() }}</div>
        <div *ngIf="errorMessage()" class="alert alert-danger mb-3">{{ errorMessage() }}</div>
        <div *ngIf="!loading() && planes().length === 0" class="alert alert-secondary">
          No hay planes presupuestarios registrados todavía.
        </div>

        <div class="table-responsive" *ngIf="planes().length > 0">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Divisa</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let plan of planes()">
                <td>{{ plan.nombre }}</td>
                <td>{{ plan.usuario.nombre }}</td>
                <td>{{ plan.divisa.nombre }} ({{ plan.divisa.codigo }})</td>
                <td>{{ plan.descripcion || '—' }}</td>
                <td>
                  <span class="badge" [class.bg-success]="plan.activo" [class.bg-danger]="!plan.activo">
                    {{ plan.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="text-end d-flex gap-2 justify-content-end">
                  <button class="btn btn-outline-primary btn-sm" type="button" (click)="startEdit(plan)">
                    Editar
                  </button>
                  <button class="btn btn-danger btn-sm" type="button" (click)="openDeleteModal(plan)">
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
            <h5 class="modal-title">Eliminar plan</h5>
            <button type="button" class="btn-close" aria-label="Close" (click)="closeDeleteModal()"></button>
          </div>
          <div class="modal-body">
            <p *ngIf="planToDelete()">¿Seguro que deseas eliminar el plan "{{ planToDelete()?.nombre }}"?</p>
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
export class PlanPresupuestarioPage implements OnInit {
  protected readonly planes = signal<PlanPresupuestario[]>([]);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly divisas = signal<Divisa[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly displayForm = signal(false);
  protected readonly deleteModalOpen = signal(false);
  protected readonly planToDelete = signal<PlanPresupuestario | null>(null);
  protected readonly editingPlanId = signal<number | null>(null);

  protected readonly form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly planPresupuestarioService: PlanPresupuestarioService
  ) {
    this.form = this.fb.group({
      nombre: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(3)],
        nonNullable: true,
      }),
      usuario_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      divisa_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      descripcion: this.fb.control<string | null>('', { validators: [Validators.maxLength(500)] }),
      activo: this.fb.control(true, { nonNullable: true }),
    });
  }

  ngOnInit(): void {
    this.loadUsuarios();
    this.loadDivisas();
    this.loadPlanes();
  }

  protected showNewForm(): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
    this.displayForm.set(true);
    this.editingPlanId.set(null);
    this.resetForm();
  }

  protected startEdit(plan: PlanPresupuestario): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
    this.displayForm.set(true);
    this.editingPlanId.set(plan.id);
    this.form.reset({
      nombre: plan.nombre,
      usuario_id: plan.usuario?.id ?? null,
      divisa_id: plan.divisa?.id ?? null,
      descripcion: plan.descripcion ?? '',
      activo: plan.activo,
    });
  }

  protected cancelForm(): void {
    this.displayForm.set(false);
    this.editingPlanId.set(null);
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

    const payload = this.form.value as PlanPresupuestarioRequestDto;
    const planId = this.editingPlanId();

    this.saving.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    const request$ = planId
      ? this.planPresupuestarioService.update(planId, payload)
      : this.planPresupuestarioService.create(payload);

    request$.subscribe({
      next: () => {
        this.statusMessage.set(
          planId ? 'Plan actualizado correctamente.' : 'Plan creado correctamente.'
        );
        this.displayForm.set(false);
        this.editingPlanId.set(null);
        this.resetForm();
        this.loadPlanes();
      },
      error: () => {
        this.errorMessage.set(
          planId ? 'Ocurrió un error al actualizar el plan.' : 'Ocurrió un error al guardar el plan.'
        );
      },
      complete: () => this.saving.set(false),
    });
  }

  protected openDeleteModal(plan: PlanPresupuestario): void {
    this.planToDelete.set(plan);
    this.deleteModalOpen.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');
  }

  protected closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.planToDelete.set(null);
  }

  protected confirmDelete(): void {
    const plan = this.planToDelete();
    if (!plan) {
      return;
    }

    this.loading.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    this.planPresupuestarioService.delete(plan.id).subscribe({
      next: () => {
        this.statusMessage.set('Plan eliminado correctamente.');
        this.loadPlanes();
      },
      error: () => {
        this.errorMessage.set('No se pudo eliminar el plan.');
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
      usuario_id: null,
      divisa_id: null,
      descripcion: '',
      activo: true,
    });
  }

  private loadPlanes(): void {
    this.loading.set(true);
    this.planPresupuestarioService.getAll().subscribe({
      next: (response) => this.planes.set(response.data ?? []),
      error: () => {
        this.errorMessage.set('No se pudieron obtener los planes presupuestarios.');
        this.planes.set([]);
      },
      complete: () => this.loading.set(false),
    });
  }

  private loadUsuarios(): void {
    this.planPresupuestarioService.getUsuarios().subscribe({
      next: (response) => this.usuarios.set(response.data ?? []),
      error: () => this.errorMessage.set('No se pudieron obtener los usuarios.'),
    });
  }

  private loadDivisas(): void {
    this.planPresupuestarioService.getDivisas().subscribe({
      next: (response) => this.divisas.set(response.data ?? []),
      error: () => this.errorMessage.set('No se pudieron obtener las divisas.'),
    });
  }
}
