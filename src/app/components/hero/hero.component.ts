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
  // Use absolute path with base href - works for both local dev and production
  galaxyBg = '/assets/galaxy-bg.jpg';
  zodiacCircle = '/assets/zodiac-circle.png';
}
