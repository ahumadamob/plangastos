import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { PresupuestoDropdown, PresupuestoService } from '../presupuestos/presupuesto.service';

@Component({
  selector: 'app-periodos-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <span>Periodos</span>
        <button class="btn btn-outline-primary btn-sm" type="button" (click)="loadDropdown()" [disabled]="loading()">
          Recargar
        </button>
      </div>
      <div class="card-body">
        <div *ngIf="loading()" class="alert alert-info">Cargando periodos...</div>
        <div *ngIf="errorMessage()" class="alert alert-danger">{{ errorMessage() }}</div>
        <div class="mb-3">
          <label for="periodo" class="form-label">Selecciona un periodo</label>
          <select id="periodo" class="form-select" [disabled]="loading() || dropdown().length === 0">
            <option value="" *ngIf="dropdown().length === 0">No hay periodos disponibles</option>
            <option *ngFor="let periodo of dropdown()" [value]="periodo.id">{{ periodo.nombre }}</option>
          </select>
        </div>
      </div>
    </div>
  `,
})
export class PeriodosPage implements OnInit {
  protected readonly dropdown = signal<PresupuestoDropdown[]>([]);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal('');

  constructor(private readonly presupuestoService: PresupuestoService) {}

  ngOnInit(): void {
    this.loadDropdown();
  }

  protected loadDropdown(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.presupuestoService.getDropdown().subscribe({
      next: (response) => this.dropdown.set(response.data ?? []),
      error: () => {
        this.errorMessage.set('No se pudieron obtener los periodos.');
        this.dropdown.set([]);
      },
      complete: () => this.loading.set(false),
    });
  }
}
