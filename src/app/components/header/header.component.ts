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
    { label: 'About Us', href: '/#about', isRoute: false },
    { label: 'Shinrin Yoku', href: '/shinrin-yoku', isRoute: true },
    { label: 'Services', href: '/#services', isRoute: false },
    { label: 'Pages', href: '#', isRoute: false },
    { label: 'Blogs', href: '#', isRoute: false },
    { label: 'Contact Us', href: '/#contact', isRoute: false },
  ];

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
