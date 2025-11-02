import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonComponent } from '../../ui/button/button.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
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
      
      // Check if we're currently on the home page
      const currentUrl = this.router.url;
      const isOnHomePage = currentUrl === '/' || currentUrl === '' || !currentUrl.includes('/shinrin-yoku');
      
      if (isOnHomePage) {
        // If on home page, just scroll to the element
        this.scrollToElement(elementId);
      } else {
        // If on another page, navigate to home first, then scroll
        this.router.navigate(['/'], { fragment: elementId }).then(() => {
          // Wait for navigation and DOM update, then scroll
          setTimeout(() => {
            this.scrollToElement(elementId);
          }, 300); // Increased timeout to ensure DOM is ready after route change
        });
      }
      this.closeMenu(); // Close mobile menu if open
    }
  }

  private scrollToElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      const headerHeight = 80; // Fixed header height
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
