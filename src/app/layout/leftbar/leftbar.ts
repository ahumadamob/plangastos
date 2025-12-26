import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-leftbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="list-group">
      <a
        class="list-group-item list-group-item-action"
        routerLink="/rubros"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Rubros
      </a>
      <a
        class="list-group-item list-group-item-action"
        routerLink="/presupuestos"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Presupuestos
      </a>
      <a
        class="list-group-item list-group-item-action"
        routerLink="/partidas-planificadas"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Partidas planificadas
      </a>
      <a
        class="list-group-item list-group-item-action"
        routerLink="/planes-presupuestarios"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Planes presupuestarios
      </a>
      <a
        class="list-group-item list-group-item-action"
        routerLink="/cuentas-financieras"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
      >
        Cuentas financieras
      </a>
    </div>
  `,
  styles: [],
})
export class Leftbar {}
