import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { CrudCardComponent } from '../shared/crud-card/crud-card.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';
import { CatalogInputComponent } from '../shared/catalog-form/catalog-input.component';
import {
  CatalogSelectComponent,
  CatalogOption,
} from '../shared/catalog-form/catalog-select.component';
import { PresupuestoService, Presupuesto, PresupuestoRequestDto } from './presupuesto.service';

@Component({
  selector: 'app-presupuestos-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CrudCardComponent,
    ConfirmModalComponent,
    CatalogInputComponent,
    CatalogSelectComponent,
  ],
  templateUrl: './presupuestos-page.component.html',
  styleUrls: ['./presupuestos-page.component.scss'],
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
  protected readonly nombreError = 'El nombre es obligatorio y debe tener al menos 3 caracteres.';
  protected readonly codigoError = 'El código debe tener máximo 50 caracteres.';
  protected readonly origenError = 'Selecciona un presupuesto válido.';

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
      presupuestoOrigen_id: presupuesto.presupuestoOrigen?.id ?? presupuesto.presupuestoOrigen_id ?? null,
    });
  }

  protected cancelForm(): void {
    this.displayForm.set(false);
    this.editingPresupuestoId.set(null);
    this.resetForm();
  }

  protected getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
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
      next: (response) => {
        const presupuestos = response.data ?? [];
        const presupuestosPorId = new Map(presupuestos.map((presupuesto) => [presupuesto.id, presupuesto]));

        presupuestos.forEach((presupuesto) => {
          if (!presupuesto.presupuestoOrigen && presupuesto.presupuestoOrigen_id) {
            presupuesto.presupuestoOrigen = presupuestosPorId.get(presupuesto.presupuestoOrigen_id) ?? null;
          }
        });

        this.presupuestos.set(presupuestos);
      },
      error: () => {
        this.errorMessage.set('No se pudieron obtener los presupuestos.');
        this.presupuestos.set([]);
      },
      complete: () => this.loading.set(false),
    });
  }

  protected origenesOptions(): CatalogOption<number | null>[] {
    return [
      { label: 'Sin origen', value: null },
      ...this.origenesDisponibles().map((presupuesto) => ({
        label: presupuesto.nombre,
        value: presupuesto.id,
        disabled: presupuesto.id === this.editingPresupuestoId(),
      })),
    ];
  }
}
