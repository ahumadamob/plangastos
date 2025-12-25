import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RubroService, NaturalezaMovimiento, Rubro, RubroRequestDto } from './rubro.service';

@Component({
  selector: 'app-rubros-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="row g-4">
      <div class="col-12 col-lg-5">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>{{ isEditing() ? 'Editar rubro' : 'Crear rubro' }}</span>
            <button
              *ngIf="isEditing()"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              (click)="resetForm()"
            >
              Cancelar
            </button>
          </div>
          <div class="card-body">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
              <div class="mb-3">
                <label for="nombre" class="form-label">Nombre</label>
                <input
                  id="nombre"
                  type="text"
                  class="form-control"
                  formControlName="nombre"
                  [class.is-invalid]="isInvalid('nombre')"
                  autocomplete="off"
                  maxlength="120"
                  required
                />
                <div class="invalid-feedback" *ngIf="isInvalid('nombre')">
                  El nombre es obligatorio y debe tener al menos 3 caracteres.
                </div>
              </div>

              <div class="mb-3">
                <label for="naturaleza" class="form-label">Naturaleza</label>
                <select
                  id="naturaleza"
                  class="form-select"
                  formControlName="naturalezaMovimiento_id"
                  [class.is-invalid]="isInvalid('naturalezaMovimiento_id')"
                  required
                >
                  <option [ngValue]="null" disabled>Selecciona una naturaleza</option>
                  <option *ngFor="let naturaleza of naturalezas()" [ngValue]="naturaleza.id">
                    {{ naturaleza.descripcion }} ({{ naturaleza.codigo }})
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="isInvalid('naturalezaMovimiento_id')">
                  Selecciona la naturaleza del rubro.
                </div>
              </div>

              <div class="form-check mb-3">
                <input
                  id="activo"
                  type="checkbox"
                  class="form-check-input"
                  formControlName="activo"
                />
                <label for="activo" class="form-check-label">Activo</label>
              </div>

              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                  {{ isEditing() ? 'Guardar cambios' : 'Crear rubro' }}
                </button>
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  (click)="resetForm()"
                  [disabled]="saving()"
                >
                  Limpiar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div class="col-12 col-lg-7">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>Rubros</span>
            <button type="button" class="btn btn-sm btn-outline-primary" (click)="refresh()" [disabled]="loading()">
              Actualizar
            </button>
          </div>
          <div class="card-body">
            <div *ngIf="loading()" class="alert alert-info mb-3">Cargando rubros...</div>
            <div *ngIf="statusMessage()" class="alert alert-success mb-3">{{ statusMessage() }}</div>
            <div *ngIf="errorMessage()" class="alert alert-danger mb-3">{{ errorMessage() }}</div>
            <div *ngIf="!loading() && rubros().length === 0" class="alert alert-secondary">
              No hay rubros registrados todavía.
            </div>

            <div class="table-responsive" *ngIf="rubros().length > 0">
              <table class="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Naturaleza</th>
                    <th>Estado</th>
                    <th class="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let rubro of rubros()">
                    <td>{{ rubro.nombre }}</td>
                    <td>
                      <span class="badge bg-secondary">{{ rubro.naturaleza }}</span>
                    </td>
                    <td>
                      <span class="badge" [class.bg-success]="rubro.activo" [class.bg-danger]="!rubro.activo">
                        {{ rubro.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="text-end">
                      <div class="btn-group btn-group-sm" role="group" aria-label="Acciones">
                        <button class="btn btn-outline-primary" type="button" (click)="startEdit(rubro)">
                          Editar
                        </button>
                        <button class="btn btn-outline-danger" type="button" (click)="remove(rubro)">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RubrosPage implements OnInit {
  protected readonly rubros = signal<Rubro[]>([]);
  protected readonly naturalezas = signal<NaturalezaMovimiento[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');

  protected readonly form: FormGroup;

  constructor(private readonly fb: FormBuilder, private readonly rubroService: RubroService) {
    this.form = this.fb.group({
      id: this.fb.control<number | null>(null),
      nombre: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(3)],
        nonNullable: true,
      }),
      naturalezaMovimiento_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      activo: this.fb.control(true, { nonNullable: true }),
    });
  }

  ngOnInit(): void {
    this.loadNaturalezas();
    this.loadRubros();
  }

  protected isEditing(): boolean {
    return this.form.get('id')?.value !== null;
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

    const { id, ...rest } = this.form.value as RubroRequestDto & { id: number | null };
    const payload: RubroRequestDto = {
      nombre: rest.nombre,
      naturalezaMovimiento_id: rest.naturalezaMovimiento_id,
      activo: rest.activo,
    };

    this.saving.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    const request$ = id
      ? this.rubroService.update(id, payload)
      : this.rubroService.create(payload);

    request$.subscribe({
      next: () => {
        this.statusMessage.set(id ? 'Rubro actualizado correctamente.' : 'Rubro creado correctamente.');
        this.loadRubros();
        this.resetForm();
      },
      error: () => {
        this.errorMessage.set('Ocurrió un error al guardar el rubro.');
      },
      complete: () => this.saving.set(false),
    });
  }

  protected startEdit(rubro: Rubro): void {
    const naturalezaId =
      this.naturalezas().find((naturaleza) => naturaleza.codigo === rubro.naturaleza)?.id ?? null;
    this.form.patchValue({
      id: rubro.id,
      nombre: rubro.nombre,
      naturalezaMovimiento_id: naturalezaId,
      activo: rubro.activo,
    });
    this.statusMessage.set('');
    this.errorMessage.set('');
  }

  protected resetForm(): void {
    this.form.reset({
      id: null,
      nombre: '',
      naturalezaMovimiento_id: null,
      activo: true,
    });
  }

  protected remove(rubro: Rubro): void {
    const confirmed = window.confirm(`¿Seguro que deseas eliminar el rubro "${rubro.nombre}"?`);
    if (!confirmed) {
      return;
    }

    this.loading.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    this.rubroService.delete(rubro.id).subscribe({
      next: () => {
        this.statusMessage.set('Rubro eliminado correctamente.');
        this.loadRubros();
      },
      error: () => {
        this.errorMessage.set('No se pudo eliminar el rubro.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  protected refresh(): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
    this.loadRubros();
  }

  private loadRubros(): void {
    this.loading.set(true);
    this.rubroService.getAll().subscribe({
      next: (response) => {
        this.rubros.set(response.data ?? []);
      },
      error: () => {
        this.errorMessage.set('No se pudieron obtener los rubros.');
        this.rubros.set([]);
      },
      complete: () => this.loading.set(false),
    });
  }

  private loadNaturalezas(): void {
    this.rubroService.getNaturalezasMovimiento().subscribe({
      next: (response) => this.naturalezas.set(response.data ?? []),
      error: () => this.errorMessage.set('No se pudieron obtener las naturalezas de movimiento.'),
    });
  }
}
