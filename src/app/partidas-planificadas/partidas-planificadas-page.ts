import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Presupuesto } from '../presupuestos/presupuesto.service';
import { Rubro } from '../rubros/rubro.service';
import {
  PartidaPlanificada,
  PartidaPlanificadaRequestDto,
  PartidaPlanificadaService,
} from './partida-planificada.service';

@Component({
  selector: 'app-partidas-planificadas-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>Partidas planificadas</span>
        <button type="button" class="btn btn-success btn-sm" (click)="showNewForm()">
          Nueva partida
        </button>
      </div>
      <div class="card-body">
        <div *ngIf="displayForm()" class="mb-4">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="row g-3">
              <div class="col-12 col-md-6">
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
                  Selecciona el presupuesto asociado.
                </div>
              </div>

              <div class="col-12 col-md-6">
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
                    {{ rubro.nombre }}
                  </option>
                </select>
                <div class="invalid-feedback" *ngIf="isInvalid('rubro_id')">
                  Selecciona el rubro de la partida.
                </div>
              </div>

              <div class="col-12">
                <label for="descripcion" class="form-label">Descripción</label>
                <input
                  id="descripcion"
                  type="text"
                  class="form-control"
                  formControlName="descripcion"
                  [class.is-invalid]="isInvalid('descripcion')"
                  autocomplete="off"
                  maxlength="200"
                  required
                />
                <div class="invalid-feedback" *ngIf="isInvalid('descripcion')">
                  La descripción es obligatoria y debe tener al menos 3 caracteres.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label for="montoComprometido" class="form-label">Monto comprometido</label>
                <input
                  id="montoComprometido"
                  type="number"
                  class="form-control"
                  formControlName="montoComprometido"
                  [class.is-invalid]="isInvalid('montoComprometido')"
                  step="0.01"
                  min="0"
                  required
                />
                <div class="invalid-feedback" *ngIf="isInvalid('montoComprometido')">
                  Ingresa un monto comprometido válido.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label for="fechaObjetivo" class="form-label">Fecha objetivo</label>
                <input
                  id="fechaObjetivo"
                  type="date"
                  class="form-control"
                  formControlName="fechaObjetivo"
                />
              </div>

              <div class="col-12 col-md-6">
                <label for="cuotas" class="form-label">Cuotas</label>
                <input
                  id="cuotas"
                  type="number"
                  class="form-control"
                  formControlName="cuotas"
                  [class.is-invalid]="isInvalid('cuotas')"
                  min="1"
                />
                <div class="invalid-feedback" *ngIf="isInvalid('cuotas')">
                  Ingresa un número de cuotas válido (1 o más).
                </div>
              </div>

              <div class="col-12 col-md-6">
                <label for="cantidadCuotas" class="form-label">Cantidad de cuotas</label>
                <input
                  id="cantidadCuotas"
                  type="number"
                  class="form-control"
                  formControlName="cantidadCuotas"
                  [class.is-invalid]="isInvalid('cantidadCuotas')"
                  min="1"
                />
                <div class="invalid-feedback" *ngIf="isInvalid('cantidadCuotas')">
                  Ingresa una cantidad de cuotas válida (1 o más).
                </div>
              </div>

              <div class="col-12 d-flex gap-2">
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                  {{ editingPartidaId() ? 'Guardar cambios' : 'Crear partida' }}
                </button>
                <button type="button" class="btn btn-outline-secondary" (click)="cancelForm()" [disabled]="saving()">
                  Cancelar
                </button>
              </div>
            </div>
          </form>
          <hr />
        </div>

        <div *ngIf="loading()" class="alert alert-info mb-3">Cargando partidas planificadas...</div>
        <div *ngIf="statusMessage()" class="alert alert-success mb-3">{{ statusMessage() }}</div>
        <div *ngIf="errorMessage()" class="alert alert-danger mb-3">{{ errorMessage() }}</div>
        <div *ngIf="!loading() && partidas().length === 0" class="alert alert-secondary">
          No hay partidas planificadas registradas todavía.
        </div>

        <div class="table-responsive" *ngIf="partidas().length > 0">
          <table class="table table-hover align-middle">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Presupuesto</th>
                <th>Rubro</th>
                <th class="text-end">Monto comprometido</th>
                <th>Fecha objetivo</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let partida of partidas()">
                <td>{{ partida.descripcion }}</td>
                <td>{{ partida.presupuesto.nombre }}</td>
                <td>{{ partida.rubro.nombre }}</td>
                <td class="text-end">{{ partida.montoComprometido | number : '1.2-2' }}</td>
                <td>{{ partida.fechaObjetivo || '—' }}</td>
                <td class="text-end d-flex gap-2 justify-content-end">
                  <button class="btn btn-outline-primary btn-sm" type="button" (click)="startEdit(partida)">
                    Editar
                  </button>
                  <button class="btn btn-danger btn-sm" type="button" (click)="openDeleteModal(partida)">
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
            <h5 class="modal-title">Eliminar partida</h5>
            <button type="button" class="btn-close" aria-label="Close" (click)="closeDeleteModal()"></button>
          </div>
          <div class="modal-body">
            <p *ngIf="partidaToDelete()">
              ¿Seguro que deseas eliminar la partida "{{ partidaToDelete()?.descripcion }}"?
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
export class PartidasPlanificadasPage implements OnInit {
  protected readonly partidas = signal<PartidaPlanificada[]>([]);
  protected readonly presupuestos = signal<Presupuesto[]>([]);
  protected readonly rubros = signal<Rubro[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly displayForm = signal(false);
  protected readonly deleteModalOpen = signal(false);
  protected readonly partidaToDelete = signal<PartidaPlanificada | null>(null);
  protected readonly editingPartidaId = signal<number | null>(null);

  protected readonly form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly partidaService: PartidaPlanificadaService
  ) {
    this.form = this.fb.group({
      presupuesto_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      rubro_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      descripcion: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(3)],
        nonNullable: true,
      }),
      montoComprometido: this.fb.control<number | null>(null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      fechaObjetivo: this.fb.control<string | null>(null),
      cuotas: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
      cantidadCuotas: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
    });
  }

  ngOnInit(): void {
    this.loadPresupuestos();
    this.loadRubros();
    this.loadPartidas();
  }

  protected showNewForm(): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
    this.displayForm.set(true);
    this.editingPartidaId.set(null);
    this.resetForm();
  }

  protected startEdit(partida: PartidaPlanificada): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
    this.displayForm.set(true);
    this.editingPartidaId.set(partida.id);
    this.form.reset({
      presupuesto_id: partida.presupuesto?.id ?? null,
      rubro_id: partida.rubro?.id ?? null,
      descripcion: partida.descripcion,
      montoComprometido: partida.montoComprometido,
      fechaObjetivo: partida.fechaObjetivo ?? null,
      cuotas: partida.cuotas ?? null,
      cantidadCuotas: partida.cantidadCuotas ?? null,
    });
  }

  protected cancelForm(): void {
    this.displayForm.set(false);
    this.editingPartidaId.set(null);
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

    const payload = this.form.value as PartidaPlanificadaRequestDto;
    const partidaId = this.editingPartidaId();

    this.saving.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    const request$ = partidaId
      ? this.partidaService.update(partidaId, payload)
      : this.partidaService.create(payload);

    request$.subscribe({
      next: () => {
        this.statusMessage.set(
          partidaId
            ? 'Partida planificada actualizada correctamente.'
            : 'Partida planificada creada correctamente.'
        );
        this.displayForm.set(false);
        this.editingPartidaId.set(null);
        this.resetForm();
        this.loadPartidas();
      },
      error: () => {
        this.errorMessage.set(
          partidaId
            ? 'Ocurrió un error al actualizar la partida planificada.'
            : 'Ocurrió un error al guardar la partida planificada.'
        );
      },
      complete: () => this.saving.set(false),
    });
  }

  protected openDeleteModal(partida: PartidaPlanificada): void {
    this.partidaToDelete.set(partida);
    this.deleteModalOpen.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');
  }

  protected closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.partidaToDelete.set(null);
  }

  protected confirmDelete(): void {
    const partida = this.partidaToDelete();
    if (!partida) {
      return;
    }

    this.loading.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    this.partidaService.delete(partida.id).subscribe({
      next: () => {
        this.statusMessage.set('Partida planificada eliminada correctamente.');
        this.loadPartidas();
      },
      error: () => {
        this.errorMessage.set('No se pudo eliminar la partida planificada.');
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
      descripcion: '',
      montoComprometido: null,
      fechaObjetivo: null,
      cuotas: null,
      cantidadCuotas: null,
    });
  }

  private loadPartidas(): void {
    this.loading.set(true);
    this.partidaService.getAll().subscribe({
      next: (response) => this.partidas.set(response.data ?? []),
      error: () => {
        this.errorMessage.set('No se pudieron obtener las partidas planificadas.');
        this.partidas.set([]);
      },
      complete: () => this.loading.set(false),
    });
  }

  private loadPresupuestos(): void {
    this.partidaService.getPresupuestos().subscribe({
      next: (response) => this.presupuestos.set(response.data ?? []),
      error: () => this.errorMessage.set('No se pudieron obtener los presupuestos.'),
    });
  }

  private loadRubros(): void {
    this.partidaService.getRubros().subscribe({
      next: (response) => this.rubros.set(response.data ?? []),
      error: () => this.errorMessage.set('No se pudieron obtener los rubros.'),
    });
  }
}
