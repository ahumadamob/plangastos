import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RubroService, Rubro } from './rubro.service';

@Component({
  selector: 'app-rubros-page',
  standalone: true,
  imports: [CommonModule],
  template: `
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
                  <button class="btn btn-sm btn-outline-danger" type="button" (click)="remove(rubro)">
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class RubrosPage implements OnInit {
  protected readonly rubros = signal<Rubro[]>([]);
  protected readonly loading = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');

  constructor(private readonly rubroService: RubroService) {}

  ngOnInit(): void {
    this.loadRubros();
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
}
