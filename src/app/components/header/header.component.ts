import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isMenuOpen = false;

  navItems = [
    { label: 'About Us', href: '#about', isRoute: false },
    { label: 'Shinrin Yoku', href: '/shinrin-yoku', isRoute: true },
    { label: 'Services', href: '#services', isRoute: false },
    { label: 'Pages', href: '#', isRoute: false },
    { label: 'Blogs', href: '#', isRoute: false },
    { label: 'Contact Us', href: '#contact', isRoute: false },
  ];

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  handleHashClick(event: Event, href: string): void {
    if (href.startsWith('#')) {
      event.preventDefault();
      const elementId = href.substring(1);
      const element = document.getElementById(elementId);
      if (element) {
        const headerHeight = 80; // Fixed header height
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        this.closeMenu(); // Close mobile menu if open
      }
    }
  }
}
