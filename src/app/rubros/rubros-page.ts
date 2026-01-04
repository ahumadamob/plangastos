import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RubroService, NaturalezaMovimiento, Rubro, RubroRequestDto } from './rubro.service';

@Component({
  selector: 'app-rubros-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rubros-page.component.html',
  styleUrls: ['./rubros-page.component.scss'],
})
export class RubrosPage implements OnInit {
  protected readonly rubros = signal<Rubro[]>([]);
  protected readonly naturalezas = signal<NaturalezaMovimiento[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly displayForm = signal(false);
  protected readonly deleteModalOpen = signal(false);
  protected readonly rubroToDelete = signal<Rubro | null>(null);

  protected readonly form: FormGroup;

  constructor(private readonly fb: FormBuilder, private readonly rubroService: RubroService) {
    this.form = this.fb.group({
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

  protected showNewForm(): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
    this.displayForm.set(true);
    this.form.reset({
      nombre: '',
      naturalezaMovimiento_id: null,
      activo: true,
    });
  }

  protected cancelForm(): void {
    this.displayForm.set(false);
    this.form.reset({
      nombre: '',
      naturalezaMovimiento_id: null,
      activo: true,
    });
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

    const payload = this.form.value as RubroRequestDto;
    this.saving.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');

    this.rubroService.create(payload).subscribe({
      next: () => {
        this.statusMessage.set('Rubro creado correctamente.');
        this.displayForm.set(false);
        this.loadRubros();
      },
      error: () => {
        this.errorMessage.set('Ocurrió un error al guardar el rubro.');
      },
      complete: () => this.saving.set(false),
    });
  }

  protected openDeleteModal(rubro: Rubro): void {
    this.rubroToDelete.set(rubro);
    this.deleteModalOpen.set(true);
    this.statusMessage.set('');
    this.errorMessage.set('');
  }

  protected closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.rubroToDelete.set(null);
  }

  protected confirmDelete(): void {
    const rubro = this.rubroToDelete();
    if (!rubro) {
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
      complete: () => {
        this.loading.set(false);
        this.closeDeleteModal();
      },
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
