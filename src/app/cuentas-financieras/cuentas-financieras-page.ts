import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CuentaFinancieraService, CuentaFinanciera, CuentaFinancieraRequestDto, Divisa, TipoCuenta, Usuario } from './cuenta-financiera.service';

@Component({
  selector: 'app-cuentas-financieras-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cuentas-financieras-page.component.html',
  styleUrls: ['./cuentas-financieras-page.component.scss'],
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
