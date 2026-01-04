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
  templateUrl: './transacciones-page.component.html',
  styleUrls: ['./transacciones-page.component.scss'],
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
