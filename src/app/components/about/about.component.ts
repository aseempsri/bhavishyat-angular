import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-about',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  private document = inject(DOCUMENT);
  
  // Get base href from document to work with both local dev and production
  private getBaseHref(): string {
    const baseTag = this.document.querySelector('base');
    return baseTag?.getAttribute('href') || '/';
  }

  zodiacWheel = this.getBaseHref() + 'assets/zodiac-wheel.png';
}
