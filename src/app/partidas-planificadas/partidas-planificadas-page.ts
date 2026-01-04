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
  templateUrl: './partidas-planificadas-page.component.html',
  styleUrls: ['./partidas-planificadas-page.component.scss'],
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
      cuota: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
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
      cuota: partida.cuota ?? null,
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
      cuota: null,
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
