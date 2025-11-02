import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

@Component({
  selector: 'app-card',
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
  host: {
    '[class]': 'cardClasses'
  }
})
export class CardComponent {
  @Input() className: string = '';

  get cardClasses(): string {
    return cn('rounded-lg border bg-card text-card-foreground shadow-sm', this.className);
  }
}

@Component({
  selector: 'app-card-header',
  imports: [CommonModule],
  templateUrl: './card-header.component.html',
  styleUrl: './card.component.css'
})
export class CardHeaderComponent {
  @Input() className: string = '';

  get headerClasses(): string {
    return cn('flex flex-col space-y-1.5 p-6', this.className);
  }
}

@Component({
  selector: 'app-card-title',
  imports: [CommonModule],
  templateUrl: './card-title.component.html',
  styleUrl: './card.component.css'
})
export class CardTitleComponent {
  @Input() className: string = '';

  get titleClasses(): string {
    return cn('text-2xl font-semibold leading-none tracking-tight', this.className);
  }
}

@Component({
  selector: 'app-card-description',
  imports: [CommonModule],
  templateUrl: './card-description.component.html',
  styleUrl: './card.component.css'
})
export class CardDescriptionComponent {
  @Input() className: string = '';

  get descriptionClasses(): string {
    return cn('text-sm text-muted-foreground', this.className);
  }
}

@Component({
  selector: 'app-card-content',
  imports: [CommonModule],
  templateUrl: './card-content.component.html',
  styleUrl: './card.component.css'
})
export class CardContentComponent {
  @Input() className: string = '';

  get contentClasses(): string {
    return cn('p-6 pt-0', this.className);
  }
}
