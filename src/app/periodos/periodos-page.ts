import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  PartidaPlanificada,
  PartidaPlanificadaTransaccion,
  PartidaPlanificadaRequestDto,
  PartidaPlanificadaService,
  ActualizarMontoComprometidoRequestDto,
} from '../partidas-planificadas/partida-planificada.service';
import { Rubro } from '../rubros/rubro.service';
import { PresupuestoDropdown, PresupuestoService } from '../presupuestos/presupuesto.service';
import { TransaccionRequestDto, TransaccionService } from '../transacciones/transaccion.service';
import { CuentaFinanciera } from '../cuentas-financieras/cuenta-financiera.service';
import { RubroService } from '../rubros/rubro.service';
import { PlanCategory, PlanCategoryCardComponent } from './plan-category-card/plan-category-card.component';
import { TransactionInlineFormComponent } from './transaction-inline-form/transaction-inline-form.component';
import { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-periodos-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PlanCategoryCardComponent,
    TransactionInlineFormComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './periodos-page.component.html',
  styleUrls: ['./periodos-page.component.scss'],
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
  protected readonly viewingTransactionsPartidaId = signal<number | null>(null);
  protected readonly inlineFormPartidaId = signal<number | null>(null);
  protected readonly deleteModalOpen = signal(false);
  protected readonly partidaToDelete = signal<PartidaPlanificada | null>(null);
  protected readonly deletingPartidaId = signal<number | null>(null);
  protected readonly consolidateModalOpen = signal(false);
  protected readonly partidaToConsolidate = signal<PartidaPlanificada | null>(null);
  protected readonly consolidatingPartidaId = signal<number | null>(null);
  protected readonly cuentasFinancieras = signal<CuentaFinanciera[]>([]);
  protected readonly savingTransaction = signal(false);
  protected readonly inlineStatusMessage = signal('');
  protected readonly inlineErrorMessage = signal('');
  protected readonly deleteTransactionModalOpen = signal(false);
  protected readonly transaccionToDelete = signal<PartidaPlanificadaTransaccion | null>(null);
  protected readonly deletingTransactionId = signal<number | null>(null);
  protected readonly newTransactionForm: FormGroup;
  protected readonly newPlanCategory = signal<PlanCategory | null>(null);
  protected readonly newPlanForm: FormGroup;
  protected readonly updateMontoForm: FormGroup;
  protected readonly newPlanSaving = signal(false);
  protected readonly newPlanStatusMessage = signal('');
  protected readonly newPlanErrorMessage = signal('');
  protected readonly rubros = signal<Rubro[]>([]);
  protected readonly updateMontoModalOpen = signal(false);
  protected readonly partidaToUpdateMonto = signal<PartidaPlanificada | null>(null);
  protected readonly updatingMontoPartidaId = signal<number | null>(null);
  protected readonly updateMontoError = signal('');
  protected readonly newPlanTitles: Record<PlanCategory, string> = {
    ingreso: 'Nueva partida planificada de ingreso',
    gasto: 'Nueva partida planificada de gasto',
    ahorro: 'Nueva partida planificada de ahorro',
  };
  protected readonly getTransaccionesSumFn = (partida: PartidaPlanificada) => this.getTransaccionesSum(partida);
  protected readonly getCuotasLabelFn = (partida: PartidaPlanificada) => this.getCuotasLabel(partida);
  protected readonly getRowClassesFn = (partida: PartidaPlanificada) => this.getRowClasses(partida);
  protected readonly hasTransaccionesFn = (partida: PartidaPlanificada) => this.hasTransacciones(partida);
  protected readonly canConsolidateFn = (partida: PartidaPlanificada) => this.canConsolidate(partida);

  constructor(
    private readonly presupuestoService: PresupuestoService,
    private readonly partidaPlanificadaService: PartidaPlanificadaService,
    private readonly transaccionService: TransaccionService,
    private readonly fb: FormBuilder,
    private readonly rubroService: RubroService
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
      partidaPlanificada_id: this.fb.control<number | null>(null),
    });

    this.newPlanForm = this.fb.group({
      presupuesto_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      rubro_id: this.fb.control<number | null>(null, { validators: [Validators.required] }),
      descripcion: this.fb.control('', {
        validators: [Validators.required, Validators.minLength(3)],
        nonNullable: true,
      }),
      montoComprometido: this.fb.control<number | null>(null, { validators: [Validators.required, Validators.min(0)] }),
      fechaObjetivo: this.fb.control<string | null>(null),
      cuota: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
      cantidadCuotas: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
    });

    this.updateMontoForm = this.fb.group({
      modo: this.fb.control<'valor' | 'porcentaje'>('valor', { nonNullable: true }),
      montoComprometido: this.fb.control<number | null>(null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      porcentaje: this.fb.control<number | null>(null),
    });

    this.applyUpdateModeValidators('valor');
  }

  ngOnInit(): void {
    this.loadDropdown();
    this.loadCuentasFinancieras();
    this.loadRubros();
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
    this.closeNewPlanForm();
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

  protected getCuotasLabel(partida: PartidaPlanificada): string {
    if (partida.cuota === null || partida.cuota === undefined || partida.cantidadCuotas === null || partida.cantidadCuotas === undefined) {
      return '—';
    }

    return `${partida.cuota} de ${partida.cantidadCuotas}`;
  }

  protected getRowClasses(partida: PartidaPlanificada): Record<string, boolean> {
    const status = this.getRowStatus(partida);
    return {
      'table-success': status === 'success',
      'table-danger': status === 'danger',
      'table-warning': status === 'warning',
    };
  }

  protected toggleTransactionsView(partida: PartidaPlanificada): void {
    if (this.viewingTransactionsPartidaId() === partida.id) {
      this.closeTransactionsView();
      return;
    }

    this.closeInlineForm();
    this.viewingTransactionsPartidaId.set(partida.id);
  }

  protected closeTransactionsView(): void {
    this.viewingTransactionsPartidaId.set(null);
  }

  protected toggleNewTransactionForm(partida: PartidaPlanificada): void {
    this.closeTransactionsView();

    if (this.inlineFormPartidaId() === partida.id) {
      this.closeInlineForm();
      return;
    }

    this.inlineFormPartidaId.set(partida.id);
    this.inlineStatusMessage.set('');
    this.inlineErrorMessage.set('');
    this.prepareInlineForm(partida);
  }

  protected canConsolidate(partida: PartidaPlanificada): boolean {
    return this.hasTransacciones(partida) && partida.consolidado !== true;
  }

  protected confirmConsolidatePartida(partida: PartidaPlanificada): void {
    if (!this.canConsolidate(partida)) {
      return;
    }

    this.partidaToConsolidate.set(partida);
    this.consolidateModalOpen.set(true);
  }

  protected closeConsolidateModal(): void {
    if (this.consolidatingPartidaId() !== null) {
      return;
    }

    this.consolidateModalOpen.set(false);
    this.partidaToConsolidate.set(null);
  }

  protected consolidatePartida(): void {
    const partida = this.partidaToConsolidate();
    if (!partida) {
      this.closeConsolidateModal();
      return;
    }

    this.consolidatingPartidaId.set(partida.id);
    this.errorMessage.set('');

    this.partidaPlanificadaService.consolidate(partida.id).subscribe({
      next: (response) => {
        if (!response.success) {
          this.errorMessage.set(response.message || 'No se pudo consolidar la partida planificada.');
          this.consolidatingPartidaId.set(null);
          return;
        }

        this.loadData();
        this.consolidatingPartidaId.set(null);
        this.consolidateModalOpen.set(false);
        this.partidaToConsolidate.set(null);
      },
      error: () => {
        this.errorMessage.set('No se pudo consolidar la partida planificada.');
        this.consolidatingPartidaId.set(null);
      },
    });
  }

  protected closeInlineForm(): void {
    this.inlineFormPartidaId.set(null);
    this.prepareInlineForm(null);
    this.inlineStatusMessage.set('');
    this.inlineErrorMessage.set('');
  }

  protected openUpdateMontoModal(partida: PartidaPlanificada): void {
    this.partidaToUpdateMonto.set(partida);
    this.updateMontoModalOpen.set(true);
    this.updateMontoError.set('');
    this.updateMontoForm.reset({
      modo: 'valor',
      montoComprometido: partida.montoComprometido ?? null,
      porcentaje: null,
    });
    this.applyUpdateModeValidators('valor');
  }

  protected closeUpdateMontoModal(): void {
    if (this.updatingMontoPartidaId() !== null) {
      return;
    }

    this.updateMontoModalOpen.set(false);
    this.partidaToUpdateMonto.set(null);
    this.updateMontoError.set('');
    this.updateMontoForm.reset({
      modo: 'valor',
      montoComprometido: null,
      porcentaje: null,
    });
    this.applyUpdateModeValidators('valor');
  }

  protected onUpdateModeChange(mode: 'valor' | 'porcentaje'): void {
    this.updateMontoForm.patchValue({ modo: mode });
    this.applyUpdateModeValidators(mode);
  }

  protected isPorcentajeMode(): boolean {
    return this.updateMontoForm.get('modo')?.value === 'porcentaje';
  }

  protected isUpdateMontoInvalid(controlName: string): boolean {
    const control = this.updateMontoForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  protected submitUpdateMonto(): void {
    const mode = this.updateMontoForm.get('modo')?.value as 'valor' | 'porcentaje';

    if (this.updateMontoForm.invalid) {
      this.updateMontoForm.markAllAsTouched();
      return;
    }

    const partida = this.partidaToUpdateMonto();
    if (!partida) {
      this.closeUpdateMontoModal();
      return;
    }

    const payload: ActualizarMontoComprometidoRequestDto =
      mode === 'valor'
        ? { montoComprometido: this.updateMontoForm.value.montoComprometido, solicitudValida: true }
        : { porcentaje: this.updateMontoForm.value.porcentaje, solicitudValida: true };

    this.updatingMontoPartidaId.set(partida.id);
    this.updateMontoError.set('');

    this.partidaPlanificadaService.updateMontoComprometido(partida.id, payload).subscribe({
      next: (response) => {
        if (!response.success) {
          this.updateMontoError.set(
            response.message || 'No se pudo actualizar el monto comprometido.'
          );
          this.updatingMontoPartidaId.set(null);
          return;
        }

        this.loadData();
        this.updatingMontoPartidaId.set(null);
        this.closeUpdateMontoModal();
      },
      error: () => {
        this.updateMontoError.set('No se pudo actualizar el monto comprometido.');
        this.updatingMontoPartidaId.set(null);
      },
    });
  }

  private applyUpdateModeValidators(mode: 'valor' | 'porcentaje'): void {
    const montoControl = this.updateMontoForm.get('montoComprometido');
    const porcentajeControl = this.updateMontoForm.get('porcentaje');

    if (!montoControl || !porcentajeControl) {
      return;
    }

    if (mode === 'valor') {
      montoControl.setValidators([Validators.required, Validators.min(0)]);
      porcentajeControl.setValidators([]);
    } else {
      montoControl.setValidators([]);
      porcentajeControl.setValidators([Validators.required, Validators.min(-100)]);
    }

    montoControl.updateValueAndValidity();
    porcentajeControl.updateValueAndValidity();
  }

  protected openNewPlanForm(category: PlanCategory): void {
    this.newPlanCategory.set(category);
    this.newPlanStatusMessage.set('');
    this.newPlanErrorMessage.set('');
    this.prepareNewPlanForm();
  }

  protected closeNewPlanForm(): void {
    this.newPlanCategory.set(null);
    this.newPlanForm.reset({
      presupuesto_id: this.selectedPresupuestoId(),
      rubro_id: null,
      descripcion: '',
      montoComprometido: null,
      fechaObjetivo: null,
      cuota: null,
      cantidadCuotas: null,
    });
  }

  protected submitNewPlanForm(): void {
    if (this.newPlanForm.invalid) {
      this.newPlanForm.markAllAsTouched();
      return;
    }

    const payload = this.newPlanForm.value as PartidaPlanificadaRequestDto;
    this.newPlanSaving.set(true);
    this.newPlanStatusMessage.set('');
    this.newPlanErrorMessage.set('');

    this.partidaPlanificadaService.create(payload).subscribe({
      next: (response) => {
        if (!response.success) {
          this.newPlanErrorMessage.set(response.message || 'No se pudo crear la partida planificada.');
          return;
        }

        this.newPlanStatusMessage.set(response.message || 'Partida planificada creada correctamente.');
        this.closeNewPlanForm();
        this.loadData();
      },
      error: () => {
        this.newPlanErrorMessage.set('No se pudo crear la partida planificada.');
      },
      complete: () => this.newPlanSaving.set(false),
    });
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.newTransactionForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  protected isNewPlanInvalid(controlName: string): boolean {
    const control = this.newPlanForm.get(controlName);
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
      next: (response) => {
        if (!response.success) {
          this.inlineErrorMessage.set(response.message || 'No se pudo crear la transacción.');
          return;
        }

        this.inlineStatusMessage.set(response.message || 'Transacción creada correctamente.');
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

  private loadRubros(): void {
    this.rubroService.getAll().subscribe({
      next: (response) => this.rubros.set(response.data ?? []),
      error: () => this.newPlanErrorMessage.set('No se pudieron obtener los rubros.'),
    });
  }

  protected getRubrosByCategory(category: PlanCategory): Rubro[] {
    const naturalezaMap: Record<PlanCategory, string[]> = {
      ingreso: ['INGRESO'],
      gasto: ['GASTO', 'EGRESO'],
      ahorro: ['AHORRO', 'RESERVA_AHORRO'],
    };

    const allowedNaturalezas = naturalezaMap[category];

    return this.rubros().filter((rubro) => {
      const naturaleza = (rubro.naturaleza || '').toUpperCase();
      return allowedNaturalezas.includes(naturaleza);
    });
  }

  protected getSelectedPeriodoNombre(): string | undefined {
    const selectedId = this.selectedPresupuestoId();
    if (!selectedId) {
      return undefined;
    }

    const periodo = this.dropdown().find((item) => item.id === selectedId);
    return periodo?.nombre;
  }

  private prepareNewPlanForm(): void {
    this.newPlanForm.reset({
      presupuesto_id: this.selectedPresupuestoId(),
      rubro_id: null,
      descripcion: '',
      montoComprometido: null,
      fechaObjetivo: null,
      cuota: null,
      cantidadCuotas: null,
    });
  }

  private prepareInlineForm(partida: PartidaPlanificada | null): void {
    const today = this.getTodayDateString();
    const montoPredeterminado = partida ? this.getSaldoPartida(partida) : null;

    this.newTransactionForm.reset({
      presupuesto_id: partida?.presupuesto?.id ?? this.selectedPresupuestoId(),
      rubro_id: partida?.rubro?.id ?? null,
      cuentaFinanciera_id: null,
      descripcion: '',
      fecha: today,
      monto: montoPredeterminado,
      partidaPlanificada_id: partida?.id ?? null,
    });
  }

  private getPartidaById(id: number | null): PartidaPlanificada | undefined {
    if (id === null) {
      return undefined;
    }

    return [...this.ingresos(), ...this.gastos(), ...this.ahorro()].find((partida) => partida.id === id);
  }

  private getSaldoPartida(partida: PartidaPlanificada): number {
    return (partida.montoComprometido ?? 0) - this.getTransaccionesSum(partida);
  }

  private getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private getRowStatus(partida: PartidaPlanificada): 'success' | 'danger' | 'warning' | null {
    if (this.isEightyPercentOrMore(partida)) {
      return 'success';
    }

    if (this.hasTransacciones(partida)) {
      return null;
    }

    const fechaObjetivo = this.getFechaObjetivoDate(partida.fechaObjetivo);
    if (!fechaObjetivo) {
      return null;
    }

    const today = this.getTodayAtMidnight();
    if (fechaObjetivo <= today) {
      return 'danger';
    }

    const tenDaysAhead = new Date(today);
    tenDaysAhead.setDate(today.getDate() + 10);
    if (fechaObjetivo > today && fechaObjetivo <= tenDaysAhead) {
      return 'warning';
    }

    return null;
  }

  private isEightyPercentOrMore(partida: PartidaPlanificada): boolean {
    const comprometido = partida.montoComprometido ?? 0;
    if (comprometido <= 0) {
      return false;
    }

    const transacciones = this.getTransaccionesSum(partida);
    return transacciones / comprometido >= 0.8;
  }

  protected hasTransacciones(partida: PartidaPlanificada): boolean {
    return (partida.transacciones?.length ?? 0) > 0;
  }

  protected getNewPlanTitle(category: PlanCategory): string {
    return this.newPlanTitles[category];
  }

  protected confirmDeleteTransaccion(transaccion: PartidaPlanificadaTransaccion): void {
    this.transaccionToDelete.set(transaccion);
    this.deleteTransactionModalOpen.set(true);
  }

  protected closeDeleteTransactionModal(): void {
    if (this.deletingTransactionId() !== null) {
      return;
    }

    this.deleteTransactionModalOpen.set(false);
    this.transaccionToDelete.set(null);
  }

  protected deleteTransaccion(): void {
    const transaccion = this.transaccionToDelete();
    if (!transaccion) {
      this.closeDeleteTransactionModal();
      return;
    }

    this.deleteTransactionModalOpen.set(false);
    this.deletingTransactionId.set(transaccion.id);
    this.errorMessage.set('');
    this.transaccionService.delete(transaccion.id).subscribe({
      next: () => this.loadData(),
      error: () => {
        this.errorMessage.set('No se pudo eliminar la transacción.');
        this.deletingTransactionId.set(null);
        this.transaccionToDelete.set(null);
      },
      complete: () => {
        this.deletingTransactionId.set(null);
        this.transaccionToDelete.set(null);
        this.deleteTransactionModalOpen.set(false);
      },
    });
  }

  protected confirmDeletePartida(partida: PartidaPlanificada): void {
    this.partidaToDelete.set(partida);
    this.deleteModalOpen.set(true);
    this.closeInlineForm();
    this.closeTransactionsView();
  }

  protected closeDeleteModal(): void {
    if (this.deletingPartidaId() !== null) {
      return;
    }

    this.deleteModalOpen.set(false);
    this.partidaToDelete.set(null);
  }

  protected deletePartida(): void {
    const partida = this.partidaToDelete();
    if (!partida) {
      this.closeDeleteModal();
      return;
    }

    this.deleteModalOpen.set(false);
    this.deletingPartidaId.set(partida.id);
    this.errorMessage.set('');
    this.partidaPlanificadaService.delete(partida.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: () => this.errorMessage.set('No se pudo eliminar la partida planificada.'),
      complete: () => {
        this.deletingPartidaId.set(null);
        this.partidaToDelete.set(null);
        this.deleteModalOpen.set(false);
      },
    });
  }

  private getFechaObjetivoDate(fechaObjetivo?: string | null): Date | null {
    if (!fechaObjetivo) {
      return null;
    }

    const parsed = new Date(fechaObjetivo);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  private getTodayAtMidnight(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
