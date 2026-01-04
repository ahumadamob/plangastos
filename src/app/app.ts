import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Leftbar } from './layout/leftbar/leftbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Leftbar],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class App {
  protected readonly title = signal('plangastos');
}
