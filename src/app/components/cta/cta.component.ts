import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputComponent } from '../../ui/input/input.component';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-cta',
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  templateUrl: './cta.component.html',
  styleUrl: './cta.component.css'
})
export class CtaComponent implements AfterViewInit {
  email: string = '';
  name: string = '';

  constructor(private toastService: ToastService, private cdr: ChangeDetectorRef) {
    // Ensure values are explicitly empty strings on initialization
    this.email = '';
    this.name = '';
  }

  ngAfterViewInit(): void {
    // Force change detection after view initialization to ensure placeholders show
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    if (this.email) {
      this.toastService.toast({
        title: 'Thank you for subscribing!',
        description: 'We\'ll send you cosmic insights and special offers.',
        type: 'success'
      });
      this.email = '';
      this.name = '';
    }
  }
}
