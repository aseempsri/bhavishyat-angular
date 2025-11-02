import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../lib/utils';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

@Component({
  selector: 'app-button',
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  host: {
    '[class]': 'buttonClasses',
    '[attr.type]': 'type',
    '[disabled]': 'disabled'
  }
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'default';
  @Input() size: ButtonSize = 'default';
  @Input() className: string = '';
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() click = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const baseClasses = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline'
    };

    const sizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-md px-8',
      icon: 'h-10 w-10'
    };

    return cn(
      baseClasses,
      variantClasses[this.variant],
      sizeClasses[this.size],
      this.className
    );
  }

  onClick(event: MouseEvent): void {
    if (!this.disabled) {
      this.click.emit(event);
    }
  }
}
