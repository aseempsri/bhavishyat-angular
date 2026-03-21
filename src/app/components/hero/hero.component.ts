import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../ui/button/button.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-hero',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {
  private document = inject(DOCUMENT);
  private router = inject(Router);
  authService = inject(AuthService);

  handleLearnWithUsClick(event: Event): void {
    event.preventDefault();
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/class-recordings']);
    } else {
      this.authService.requestLogin('/class-recordings');
    }
  }
  
  // Get base href from document to work with both local dev and production
  private getBaseHref(): string {
    const baseTag = this.document.querySelector('base');
    return baseTag?.getAttribute('href') || '/';
  }

  galaxyBg = this.getBaseHref() + 'assets/galaxy-bg.jpg';
  zodiacCircle = this.getBaseHref() + 'assets/zodiac-circle.png';

  // Floating star particles for cosmic ambiance
  stars = [
    { id: 1, x: 10, y: 15, size: 5, delay: 0, duration: 2 },
    { id: 2, x: 85, y: 20, size: 7, delay: 0.5, duration: 2.5 },
    { id: 3, x: 25, y: 45, size: 5, delay: 1, duration: 2.2 },
    { id: 4, x: 70, y: 35, size: 5, delay: 0.3, duration: 2.8 },
    { id: 5, x: 50, y: 25, size: 4, delay: 0.8, duration: 2 },
    { id: 6, x: 15, y: 70, size: 5, delay: 0.2, duration: 2.4 },
    { id: 7, x: 90, y: 60, size: 7, delay: 0.6, duration: 2.6 },
    { id: 8, x: 35, y: 85, size: 5, delay: 0.4, duration: 2.3 },
    { id: 9, x: 75, y: 80, size: 5, delay: 0.7, duration: 2.1 },
    { id: 10, x: 5, y: 50, size: 4, delay: 0.1, duration: 2.7 },
    { id: 11, x: 95, y: 45, size: 5, delay: 0.9, duration: 2.5 },
    { id: 12, x: 60, y: 65, size: 4, delay: 0.5, duration: 2.2 },
  ];
}
