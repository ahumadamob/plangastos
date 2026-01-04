import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

type NavLink = {
  label: string;
  path: string;
  exact?: boolean;
  showCurrentIndicator?: boolean;
};

type DropdownLink = {
  label: string;
  path: string;
};

type DropdownDivider = { divider: true };
type DropdownEntry = DropdownLink | DropdownDivider;

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class Header {
  @Input() brandTitle = 'plangastos';

  protected readonly navLinks: NavLink[] = [
    {
      label: 'Inicio',
      path: '/',
      exact: true,
      showCurrentIndicator: true,
    },
    {
      label: 'Características',
      path: '/caracteristicas',
    },
    {
      label: 'Precios',
      path: '/precios',
    },
    {
      label: 'Acerca de',
      path: '/acerca-de',
    },
  ];

  protected readonly dropdownEntries: DropdownEntry[] = [
    {
      label: 'Acción',
      path: '/accion',
    },
    {
      label: 'Otra acción',
      path: '/otra-accion',
    },
    {
      label: 'Algo más aquí',
      path: '/algo-mas',
    },
    { divider: true },
    {
      label: 'Enlace separado',
      path: '/enlace-separado',
    },
  ];

  protected readonly exactActiveOptions = { exact: true };
  protected readonly nonExactActiveOptions = { exact: false };
  protected searchTerm = '';

  protected onSearch(event: Event): void {
    event.preventDefault();

    // Un punto central para manejar la búsqueda en el futuro (navegación o filtros).
    this.searchTerm = this.searchTerm.trim();
  }

  protected isLink(entry: DropdownEntry): entry is DropdownLink {
    return !('divider' in entry);
  }
}
