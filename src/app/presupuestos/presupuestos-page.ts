import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PresupuestoService, Presupuesto, PresupuestoRequestDto } from './presupuesto.service';

@Component({
  selector: 'app-presupuestos-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>Presupuestos</span>
        <button type="button" class="btn btn-success btn-sm" (click)="showNewForm()">
          Nuevo presupuesto
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
                <label for="codigo" class="form-label">Código</label>
                <input
                  id="codigo"
                  type="text"
                  class="form-control"
                  formControlName="codigo"
                  [class.is-invalid]="isInvalid('codigo')"
                  autocomplete="off"
                  maxlength="50"
                  placeholder="Opcional"
                />
                <div class="invalid-feedback" *ngIf="isInvalid('codigo')">
                  El código debe tener máximo 50 caracteres.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label for="presupuestoOrigen" class="form-label">Presupuesto de origen</label>
                <select
                  id="presupuestoOrigen"
                  class="form-select"
                  formControlName="presupuestoOrigen_id"
                  [class.is-invalid]="isInvalid('presupuestoOrigen_id')"
                >
                  <option [ngValue]="null">Sin origen</option>
                  <option
                    *ngFor="let presupuesto of origenesDisponibles()"
                    [ngValue]="presupuesto.id"
                    [disabled]="presupuesto.id === editingPresupuestoId()"
                  >
                    {{ presupuesto.nombre }}
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="isInvalid('presupuestoOrigen_id')">
                  Selecciona un presupuesto válido.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label for="fechaDesde" class="form-label">Fecha desde</label>
                <input
                  id="fechaDesde"
                  type="date"
                  class="form-control"
                  formControlName="fechaDesde"
                />
              </div>

              <div class="col-12 col-md-6">
                <label for="fechaHasta" class="form-label">Fecha hasta</label>
                <input
                  id="fechaHasta"
                  type="date"
                  class="form-control"
                  formControlName="fechaHasta"
                />
              </div>

              <div class="col-12 d-flex gap-2">
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                  {{ editingPresupuestoId() ? 'Guardar cambios' : 'Crear presupuesto' }}
                </button>
                <button type="button" class="btn btn-outline-secondary" (click)="cancelForm()" [disabled]="saving()">
                  Cancelar
                </button>
              </div>
            </div>
          </form>
          <hr />
        </div>

        <div *ngIf="loading()" class="alert alert-info mb-3">Cargando presupuestos...</div>
        <div *ngIf="statusMessage()" class="alert alert-success mb-3">{{ statusMessage() }}</div>
        <div *ngIf="errorMessage()" class="alert alert-danger mb-3">{{ errorMessage() }}</div>
        <div *ngIf="!loading() && presupuestos().length === 0" class="alert alert-secondary">
          No hay presupuestos registrados todavía.
        </div>

        <div class="table-responsive" *ngIf="presupuestos().length > 0">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Vigencia</th>
                <th>Origen</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let presupuesto of presupuestos()">
                <td>{{ presupuesto.nombre }}</td>
                <td>{{ presupuesto.codigo || '—' }}</td>
                <td>
                  <span *ngIf="presupuesto.fechaDesde || presupuesto.fechaHasta; else sinVigencia">
                    {{ presupuesto.fechaDesde || '—' }} - {{ presupuesto.fechaHasta || '—' }}
                  </span>
                  <ng-template #sinVigencia>—</ng-template>
                </td>
                <td>{{ presupuesto.presupuestoOrigen?.nombre || '—' }}</td>
                <td class="text-end">
                  <div class="d-inline-flex gap-2 justify-content-end">
                    <button
                      class="btn btn-primary btn-sm rounded-circle icon-btn"
                      type="button"
                      (click)="startEdit(presupuesto)"
                      aria-label="Editar presupuesto"
                      title="Editar presupuesto"
                    >
                      <i aria-hidden="true" class="fa-solid fa-pen"></i>
                    </button>
                    <button
                      class="btn btn-danger btn-sm rounded-circle icon-btn"
                      type="button"
                      (click)="openDeleteModal(presupuesto)"
                      aria-label="Eliminar presupuesto"
                      title="Eliminar presupuesto"
                    >
                      <i aria-hidden="true" class="fa-solid fa-trash"></i>
                    </button>
                  </div>
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
            <h5 class="modal-title">Eliminar presupuesto</h5>
            <button type="button" class="btn-close" aria-label="Close" (click)="closeDeleteModal()"></button>
          </div>
          <div class="modal-body">
            <p *ngIf="presupuestoToDelete()">
              ¿Seguro que deseas eliminar el presupuesto "{{ presupuestoToDelete()?.nombre }}"?
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
export class PresupuestosPage implements OnInit {
  protected readonly presupuestos = signal<Presupuesto[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly displayForm = signal(false);
  protected readonly deleteModalOpen = signal(false);
  protected readonly presupuestoToDelete = signal<Presupuesto | null>(null);
  protected readonly editingPresupuestoId = signal<number | null>(null);

  protected readonly origenesDisponibles = computed(() =>
    this.presupuestos().filter((presupuesto) => presupuesto.id !== this.editingPresupuestoId())
  );

  protected readonly form: FormGroup;

  constructor(private readonly fb: FormBuilder, private readonly presupuestoService: PresupuestoService) {
    this.form = this.fb.group({
      nombre: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(3)],
        nonNullable: true,
      }),
      codigo: this.fb.control<string | null>('', { validators: [Validators.maxLength(50)] }),
      fechaDesde: this.fb.control<string | null>(null),
      fechaHasta: this.fb.control<string | null>(null),
      presupuestoOrigen_id: this.fb.control<number | null>(null),
    });
  }

  ngOnInit(): void {
    this.loadPresupuestos();
  }

  protected showNewForm(): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
    this.displayForm.set(true);
    this.editingPresupuestoId.set(null);
    this.resetForm();
  }

  protected startEdit(presupuesto: Presupuesto): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
    this.displayForm.set(true);
    this.editingPresupuestoId.set(presupuesto.id);
    this.form.reset({
      nombre: presupuesto.nombre,
      codigo: presupuesto.codigo ?? '',
      fechaDesde: presupuesto.fechaDesde ?? null,
      fechaHasta: presupuesto.fechaHasta ?? null,
      presupuestoOrigen_id: presupuesto.presupuestoOrigen?.id ?? null,
    });
  }

  protected cancelForm(): void {
    this.displayForm.set(false);
    this.editingPresupuestoId.set(null);
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

    const payload = this.form.value as PresupuestoRequestDto;
    const presupuestoId = this.editingPresupuestoId();

    this.saving.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    const request$ = presupuestoId
      ? this.presupuestoService.update(presupuestoId, payload)
      : this.presupuestoService.create(payload);

    request$.subscribe({
      next: () => {
        this.statusMessage.set(
          presupuestoId
            ? 'Presupuesto actualizado correctamente.'
            : 'Presupuesto creado correctamente.'
        );
        this.displayForm.set(false);
        this.editingPresupuestoId.set(null);
        this.resetForm();
        this.loadPresupuestos();
      },
      error: () => {
        this.errorMessage.set(
          presupuestoId
            ? 'Ocurrió un error al actualizar el presupuesto.'
            : 'Ocurrió un error al guardar el presupuesto.'
        );
      },
      complete: () => this.saving.set(false),
    });
  }

  protected openDeleteModal(presupuesto: Presupuesto): void {
    this.presupuestoToDelete.set(presupuesto);
    this.deleteModalOpen.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');
  }

  protected closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.presupuestoToDelete.set(null);
  }

  protected confirmDelete(): void {
    const presupuesto = this.presupuestoToDelete();
    if (!presupuesto) {
      return;
    }

    this.loading.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    this.presupuestoService.delete(presupuesto.id).subscribe({
      next: () => {
        this.statusMessage.set('Presupuesto eliminado correctamente.');
        this.loadPresupuestos();
      },
      error: () => {
        this.errorMessage.set('No se pudo eliminar el presupuesto.');
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
      codigo: '',
      fechaDesde: null,
      fechaHasta: null,
      presupuestoOrigen_id: null,
    });
  }

  private loadPresupuestos(): void {
    this.loading.set(true);
    this.presupuestoService.getAll().subscribe({
      next: (response) => this.presupuestos.set(response.data ?? []),
      error: () => {
        this.errorMessage.set('No se pudieron obtener los presupuestos.');
        this.presupuestos.set([]);
      },
      complete: () => this.loading.set(false),
    });
  }
}
