import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-hero',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {
  // Use base-href prefix for GitHub Pages deployment
  private baseHref = '/bhavishyat-angular/';
  galaxyBg = this.baseHref + 'assets/galaxy-bg.jpg';
  zodiacCircle = this.baseHref + 'assets/zodiac-circle.png';
}
