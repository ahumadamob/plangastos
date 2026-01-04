import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-catalog-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './catalog-input.component.html',
  styleUrls: ['./catalog-input.component.scss'],
})
export class CatalogInputComponent {
  @Input() label = '';
  @Input({ required: true }) control!: FormControl;
  @Input() id?: string;
  @Input() type: 'text' | 'number' | 'date' = 'text';
  @Input() placeholder?: string;
  @Input() autocomplete = 'off';
  @Input() required = false;
  @Input() maxLength?: number;
  @Input() min?: number;
  @Input() step?: number;
  @Input() hint?: string;
  @Input() errorMessage = 'Campo inválido.';

  protected get fieldId(): string {
    return this.id ?? this.label.toLowerCase().replace(/\s+/g, '-');
  }

  protected get invalid(): boolean {
    const control = this.control;
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
