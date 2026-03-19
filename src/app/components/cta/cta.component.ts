import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cta',
  imports: [CommonModule],
  templateUrl: './cta.component.html',
  styleUrl: './cta.component.css'
})
export class CtaComponent {
  stars = [
    { id: 1, x: 8, y: 12, size: 4, delay: 0, duration: 2.2 },
    { id: 2, x: 92, y: 18, size: 5, delay: 0.4, duration: 2.5 },
    { id: 3, x: 15, y: 55, size: 3, delay: 0.8, duration: 2 },
    { id: 4, x: 88, y: 48, size: 4, delay: 0.2, duration: 2.8 },
    { id: 5, x: 45, y: 22, size: 3, delay: 0.6, duration: 2.3 },
    { id: 6, x: 72, y: 78, size: 4, delay: 0.3, duration: 2.1 },
    { id: 7, x: 28, y: 85, size: 3, delay: 0.5, duration: 2.6 },
    { id: 8, x: 95, y: 65, size: 4, delay: 0.7, duration: 2.4 },
  ];
}
