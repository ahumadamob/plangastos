import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Leftbar } from './layout/leftbar/leftbar';
import { Header } from './layout/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Leftbar, Header],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class App {
  protected readonly title = signal('plangastos');
}
