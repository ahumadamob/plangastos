import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-crud-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './crud-card.component.html',
  styleUrls: ['./crud-card.component.scss'],
})
export class CrudCardComponent {
  @Input({ required: true }) title!: string;
  @Input() headerActions?: TemplateRef<unknown>;
  @Input() formTemplate?: TemplateRef<unknown>;
  @Input() contentTemplate?: TemplateRef<unknown>;
}
