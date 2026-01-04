import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface CatalogOption<T = unknown> {
  label: string;
  value: T;
  disabled?: boolean;
}

@Component({
  selector: 'app-catalog-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './catalog-select.component.html',
  styleUrls: ['./catalog-select.component.scss'],
})
export class CatalogSelectComponent<T = unknown> {
  @Input() label = '';
  @Input({ required: true }) control!: FormControl;
  @Input() id?: string;
  @Input() placeholder?: string;
  @Input() required = false;
  @Input() options: CatalogOption<T>[] = [];
  @Input() errorMessage = 'Selecciona una opción.';

  protected get fieldId(): string {
    return this.id ?? this.label.toLowerCase().replace(/\s+/g, '-');
  }

  protected get invalid(): boolean {
    const control = this.control;
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
