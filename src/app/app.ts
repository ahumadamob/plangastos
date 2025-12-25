import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Leftbar } from './layout/leftbar/leftbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Leftbar],
  template: `
    <header>
      <nav class="navbar navbar-expand-lg bg-dark" data-bs-theme="dark">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">{{ title() }}</a>
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarColor02"
            aria-controls="navbarColor02"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarColor02">
            <ul class="navbar-nav me-auto">
              <li class="nav-item">
                <a class="nav-link active" aria-current="page" href="#">
                  Inicio
                  <span class="visually-hidden">(actual)</span>
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">Características</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">Precios</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">Acerca de</a>
              </li>
              <li class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle"
                  data-bs-toggle="dropdown"
                  href="#"
                  role="button"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  Más
                </a>
                <div class="dropdown-menu">
                  <a class="dropdown-item" href="#">Acción</a>
                  <a class="dropdown-item" href="#">Otra acción</a>
                  <a class="dropdown-item" href="#">Algo más aquí</a>
                  <div class="dropdown-divider"></div>
                  <a class="dropdown-item" href="#">Enlace separado</a>
                </div>
              </li>
            </ul>
            <form class="d-flex" role="search">
              <input class="form-control me-sm-2" type="search" placeholder="Buscar" />
              <button class="btn btn-secondary my-2 my-sm-0" type="submit">Buscar</button>
            </form>
          </div>
        </div>
      </nav>
    </header>

    <main class="container py-4">
      <div class="row">
        <aside class="col-12 col-md-4 col-lg-3 mb-3 mb-md-0">
          <app-leftbar />
        </aside>
        <section class="col">
          <h1 class="mb-3">Bienvenido a {{ title() }}!</h1>
          <router-outlet />
        </section>
      </div>
    </main>
  `,
  styles: [],
})
export class App {
  protected readonly title = signal('plangastos');
}
