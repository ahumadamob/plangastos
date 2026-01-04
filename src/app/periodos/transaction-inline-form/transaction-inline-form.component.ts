import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CuentaFinanciera } from '../../cuentas-financieras/cuenta-financiera.service';
import { PartidaPlanificada } from '../../partidas-planificadas/partida-planificada.service';

@Component({
  selector: 'app-transaction-inline-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-inline-form.component.html',
  styleUrls: ['./transaction-inline-form.component.scss'],
})
export class TransactionInlineFormComponent {
  @Input({ required: true }) partida!: PartidaPlanificada;
  @Input({ required: true }) form!: FormGroup;
  @Input({ required: true }) cuentasFinancieras: CuentaFinanciera[] = [];
  @Input() saving = false;
  @Input() statusMessage = '';
  @Input() errorMessage = '';
  @Output() cancel = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();

  protected onSubmit(): void {
    this.submitForm.emit();
  }

  protected onCancel(): void {
    this.cancel.emit();
  }

  protected isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  protected getControlId(control: string): string {
    const id = this.partida?.id ?? 'partida';
    return `${control}-${id}`;
  }
}
