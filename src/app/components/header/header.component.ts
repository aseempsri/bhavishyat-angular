import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, take } from 'rxjs';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputComponent } from '../../ui/input/input.component';
import { BirthDetailsModalComponent } from '../birth-details-modal/birth-details-modal.component';
import { AstrologyService } from '../../services/astrology.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent, InputComponent, BirthDetailsModalComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private document = inject(DOCUMENT);
  private astrologyService = inject(AstrologyService);
  isMenuOpen = false;
  isScrolled = false;
  showLoginModal = false;
  activeTab: 'signin' | 'signup' = 'signin';
  name: string = '';
  password: string = '';
  loginError: string = '';
  isLoggedIn: boolean = false;
  loggedInName: string = '';
  showBirthDetailsModal: boolean = false;
  openDropdown: string | null = null;
  intendedRedirect: string | null = null;

  navItems = [
    { 
      label: 'About Us', 
      href: '#about', 
      isRoute: false,
      hasDropdown: true,
      dropdownItems: [
        { label: 'About Us', href: '#about', isRoute: false },
        { label: 'Services', href: '#services', isRoute: false },
        { label: 'Contact Us', href: '#contact', isRoute: false }
      ]
    },
    { label: 'Shinrin Yoku', href: '/shinrin-yoku', isRoute: true },
    { label: 'Escape Retreats', href: '/escape-retreats', isRoute: true },
    { label: 'Remedies & Seva', href: '/remedies-seva', isRoute: true },
    { label: 'Aarohanam', href: '/aarohanam', isRoute: true },
    { label: 'Learn with Us', href: '/class-recordings', isRoute: true, requiresLogin: true },
  ];

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleDropdown(item: any, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (item.hasDropdown) {
      if (this.openDropdown === item.label) {
        this.openDropdown = null;
      } else {
        this.openDropdown = item.label;
      }
    }
  }

  closeDropdown(): void {
    this.openDropdown = null;
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
        this.closeDropdown();
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
      this.closeDropdown(); // Close dropdown if open
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

  handleRouteClick(event: Event, href: string, requiresLogin?: boolean): void {
    // Check if route requires login and user is not logged in
    if (requiresLogin && !this.isLoggedIn) {
      event.preventDefault();
      event.stopPropagation();
      // Store the intended destination for redirect after login
      this.intendedRedirect = href;
      this.closeMenu();
      this.closeDropdown();
      // Open login modal without clearing intendedRedirect
      this.showLoginModal = true;
      this.activeTab = 'signin';
      this.name = '';
      this.password = '';
      this.loginError = '';
      return;
    }

    // Clear intended redirect if user is already logged in
    this.intendedRedirect = null;

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
    this.closeDropdown();
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    // Close dropdown if clicking outside the dropdown menu
    if (this.openDropdown && !target.closest('.nav-dropdown')) {
      this.openDropdown = null;
    }
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
    // Clear intended redirect when opening login modal from login button
    // This ensures default redirect to kundali page
    this.intendedRedirect = null;
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
    // Clear intended redirect if modal is closed without logging in
    this.intendedRedirect = null;
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
      // Show birth details modal instead of navigating directly
      this.showBirthDetailsModal = true;
    } else {
      this.loginError = 'Invalid name or password';
    }
  }

  onBirthDetailsClose(): void {
    this.showBirthDetailsModal = false;
    // Logout and return to home screen
    this.logout();
    this.router.navigate(['/']);
  }

  onBirthDetailsSubmit(birthData: { dateOfBirth: string; timeOfBirth: string; placeOfBirth: string }): void {
    // Save birth details to localStorage
    localStorage.setItem('birthDetails', JSON.stringify({
      name: this.loggedInName,
      ...birthData
    }));

    // Calculate kundali and save
    this.astrologyService.calculateKundali({
      name: this.loggedInName,
      dateOfBirth: birthData.dateOfBirth,
      timeOfBirth: birthData.timeOfBirth,
      placeOfBirth: birthData.placeOfBirth
    }).subscribe(kundaliData => {
      localStorage.setItem('kundaliData', JSON.stringify(kundaliData));
      this.showBirthDetailsModal = false;
      
      // Redirect to intended destination if set, otherwise go to kundali
      const redirectTo = this.intendedRedirect || '/kundali';
      this.intendedRedirect = null; // Clear after use
      this.router.navigate([redirectTo]);
    });
  }

  logout(): void {
    this.isLoggedIn = false;
    this.loggedInName = '';
    // Clear localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInName');
    localStorage.removeItem('birthDetails');
    localStorage.removeItem('kundaliData');
    // Clear intended redirect
    this.intendedRedirect = null;
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
