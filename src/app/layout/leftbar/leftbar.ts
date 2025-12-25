import { Component } from '@angular/core';

@Component({
  selector: 'app-leftbar',
  standalone: true,
  template: `
    <div class="list-group">
      <a href="#" class="list-group-item list-group-item-action active" aria-current="true">
        Panel principal
      </a>
      <a href="#" class="list-group-item list-group-item-action">Gastos</a>
      <a href="#" class="list-group-item list-group-item-action">Ingresos</a>
      <a href="#" class="list-group-item list-group-item-action disabled" aria-disabled="true">
        Reportes
      </a>
    </div>
  `,
  styles: [],
})
export class Leftbar {}
