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
    </div>
  `,
  styles: [],
})
export class Leftbar {}
