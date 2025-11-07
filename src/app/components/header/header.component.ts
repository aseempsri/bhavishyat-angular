import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, take } from 'rxjs';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputComponent } from '../../ui/input/input.component';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent, InputComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private document = inject(DOCUMENT);
  isMenuOpen = false;
  isScrolled = false;
  showLoginModal = false;
  activeTab: 'signin' | 'signup' = 'signin';
  name: string = '';
  password: string = '';
  loginError: string = '';
  isLoggedIn: boolean = false;
  loggedInName: string = '';

  navItems = [
    { label: 'About Us', href: '#about', isRoute: false },
    { label: 'Shinrin Yoku', href: '/shinrin-yoku', isRoute: true },
    { label: 'Escape Retreats', href: '/escape-retreats', isRoute: true },
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
      event.stopPropagation();

      const elementId = href.substring(1);
      if (!elementId) {
        this.closeMenu();
        return;
      }

      // Check if we're currently on the home page (route path without fragment)
      const currentUrl = this.router.url.split('#')[0]; // Remove fragment if present
      const isOnHomePage = currentUrl === '/' || currentUrl === '';

      if (isOnHomePage) {
        // If on home page, just scroll to the element
        setTimeout(() => {
          this.scrollToElement(elementId);
        }, 50);
      } else {
        // If on another page, navigate to home first, then scroll
        // Listen for navigation end event to ensure route change is complete
        this.router.events
          .pipe(
            filter(event => event instanceof NavigationEnd),
            take(1)
          )
          .subscribe(() => {
            // Wait for DOM to update after navigation
            setTimeout(() => {
              this.scrollToElement(elementId);
            }, 500);
          });

        // Navigate to home page
        this.router.navigate(['/'], {
          fragment: elementId,
          queryParamsHandling: 'preserve'
        }).catch((error) => {
          console.error('Navigation error:', error);
          // Fallback: try direct scroll after a delay
          setTimeout(() => {
            this.scrollToElement(elementId);
          }, 1000);
        });
      }
      this.closeMenu(); // Close mobile menu if open
    }
  }

  handleLogoClick(): void {
    // Navigate to home and scroll to top
    const currentUrl = this.router.url;
    const isOnHomePage = currentUrl === '/' || currentUrl === '';

    if (isOnHomePage) {
      // If already on home page, just scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to home and scroll to top after navigation
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      });
    }
    this.closeMenu();
  }

  handleRouteClick(event: Event, href: string): void {
    // For route links, scroll to top after navigation
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        take(1)
      )
      .subscribe(() => {
        // Scroll to top after navigation completes
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      });

    this.closeMenu();
  }

  private scrollToElement(elementId: string): void {
    if (!elementId) return;

    // Try multiple times in case DOM isn't ready
    let attempts = 0;
    const maxAttempts = 10;

    const tryScroll = () => {
      const element = this.document.getElementById(elementId);
      if (element) {
        const headerHeight = 80; // Fixed header height
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryScroll, 100);
      }
    };

    tryScroll();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollPosition = window.scrollY || this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;
    this.isScrolled = scrollPosition > 10;
  }

  ngOnInit(): void {
    // Check initial scroll position
    this.onWindowScroll();
    
    // Restore login state from localStorage
    const savedLoginState = localStorage.getItem('isLoggedIn');
    const savedName = localStorage.getItem('loggedInName');
    if (savedLoginState === 'true' && savedName) {
      this.isLoggedIn = true;
      this.loggedInName = savedName;
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  openLoginModal(): void {
    if (this.isLoggedIn) {
      return; // Don't open modal if already logged in
    }
    this.showLoginModal = true;
    this.activeTab = 'signin';
    this.name = '';
    this.password = '';
    this.loginError = '';
    this.closeMenu();
  }

  closeLoginModal(): void {
    this.showLoginModal = false;
    this.name = '';
    this.password = '';
    this.loginError = '';
  }

  handleSignIn(event: Event): void {
    event.preventDefault();
    this.loginError = '';

    if (this.name && this.password === 'admin') {
      this.isLoggedIn = true;
      this.loggedInName = this.name;
      // Save to localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('loggedInName', this.name);
      this.closeLoginModal();
      this.router.navigate(['/kundali']);
    } else {
      this.loginError = 'Invalid name or password';
    }
  }

  logout(): void {
    this.isLoggedIn = false;
    this.loggedInName = '';
    // Clear localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInName');
    if (this.router.url === '/kundali') {
      this.router.navigate(['/']);
    }
  }

  handleKundaliLinkClick(event: Event): void {
    // Scroll to top after navigation to kundali page
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        take(1)
      )
      .subscribe(() => {
        // Scroll to top after navigation completes
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      });
  }
}
