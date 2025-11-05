import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-hero',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {
  private document = inject(DOCUMENT);
  
  // Get base href from document to work with both local dev and production
  private getBaseHref(): string {
    const baseTag = this.document.querySelector('base');
    return baseTag?.getAttribute('href') || '/';
  }

  galaxyBg = this.getBaseHref() + 'assets/galaxy-bg.jpg';
  zodiacCircle = this.getBaseHref() + 'assets/zodiac-circle.png';
}
