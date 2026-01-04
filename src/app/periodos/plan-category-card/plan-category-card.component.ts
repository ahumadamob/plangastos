import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { PartidaPlanificada } from '../../partidas-planificadas/partida-planificada.service';

export type PlanCategory = 'ingreso' | 'gasto' | 'ahorro';

@Component({
  selector: 'app-plan-category-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-category-card.component.html',
  styleUrls: ['./plan-category-card.component.scss'],
})
export class PlanCategoryCardComponent {
  @Input({ required: true }) category!: PlanCategory;
  @Input({ required: true }) items: PartidaPlanificada[] = [];
  @Input({ required: true }) totals!: { comprometido: number; transacciones: number };
  @Input({ required: true }) inlineFormPartidaId: number | null = null;
  @Input({ required: true }) viewingTransactionsPartidaId: number | null = null;
  @Input({ required: true }) consolidatingPartidaId: number | null = null;
  @Input({ required: true }) deletingPartidaId: number | null = null;
  @Input({ required: true }) canConsolidate!: (partida: PartidaPlanificada) => boolean;
  @Input({ required: true }) hasTransacciones!: (partida: PartidaPlanificada) => boolean;
  @Input({ required: true }) getRowClasses!: (partida: PartidaPlanificada) => Record<string, boolean>;
  @Input({ required: true }) getTransaccionesSum!: (partida: PartidaPlanificada) => number;
  @Input({ required: true }) getCuotasLabel!: (partida: PartidaPlanificada) => string;
  @Input() disableNewPlan = false;
  @Input() showNewPlan = false;
  @Input() newPlanTemplate?: TemplateRef<any>;
  @Input() transactionsTemplate?: TemplateRef<any>;
  @Input() inlineFormTemplate?: TemplateRef<any>;
  @Output() newPlan = new EventEmitter<PlanCategory>();
  @Output() toggleTransactions = new EventEmitter<PartidaPlanificada>();
  @Output() toggleInlineForm = new EventEmitter<PartidaPlanificada>();
  @Output() consolidate = new EventEmitter<PartidaPlanificada>();
  @Output() delete = new EventEmitter<PartidaPlanificada>();

  protected readonly categoryLabels: Record<PlanCategory, string> = {
    ingreso: 'Ingresos',
    gasto: 'Gastos',
    ahorro: 'Ahorro',
  };

  protected readonly buttonLabels: Record<PlanCategory, string> = {
    ingreso: 'Nuevo Ingreso',
    gasto: 'Nuevo Gasto',
    ahorro: 'Nuevo Ahorro',
  };

  protected readonly emptyMessages: Record<PlanCategory, string> = {
    ingreso: 'Sin ingresos.',
    gasto: 'Sin gastos.',
    ahorro: 'Sin ahorro.',
  };

  protected onNewPlan(): void {
    this.newPlan.emit(this.category);
  }

  protected onToggleTransactions(item: PartidaPlanificada): void {
    this.toggleTransactions.emit(item);
  }

  protected onToggleInlineForm(item: PartidaPlanificada): void {
    this.toggleInlineForm.emit(item);
  }

  protected onConsolidate(item: PartidaPlanificada): void {
    this.consolidate.emit(item);
  }

  protected onDelete(item: PartidaPlanificada): void {
    this.delete.emit(item);
  }
}
