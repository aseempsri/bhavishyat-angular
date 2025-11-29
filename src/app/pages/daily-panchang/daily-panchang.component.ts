import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { filter } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { PanchangService, PanchangData } from '../../services/panchang.service';

@Component({
  selector: 'app-daily-panchang',
  imports: [CommonModule, HeaderComponent],
  templateUrl: './daily-panchang.component.html',
  styleUrl: './daily-panchang.component.css'
})
export class DailyPanchangComponent implements OnInit, AfterViewInit, OnDestroy {
  private panchangService = inject(PanchangService);
  private router = inject(Router);
  private viewportScroller = inject(ViewportScroller);
  private navigationSubscription: any;

  panchangData: PanchangData | null = null;
  isLoading = true;
  error: string | null = null;
  lastUpdated: Date | null = null;

  constructor() {
    // Scroll to top on navigation
    this.navigationSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        // Delay to ensure component is ready
        setTimeout(() => {
          this.scrollToTop();
        }, 0);
      });
  }

  ngOnInit(): void {
    // Scroll to top when component initializes
    this.scrollToTop();
    this.loadPanchangData();
  }

  ngAfterViewInit(): void {
    // Ensure scroll happens after view is fully initialized
    setTimeout(() => {
      this.scrollToTop();
    }, 0);
    setTimeout(() => {
      this.scrollToTop();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  private scrollToTop(): void {
    // Immediate scroll first (no smooth behavior)
    window.scrollTo(0, 0);
    this.viewportScroller.scrollToPosition([0, 0]);

    // Then smooth scroll after a delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);

    // Additional attempt after longer delay to ensure it sticks
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 200);
  }

  loadPanchangData(): void {
    this.isLoading = true;
    this.error = null;

    this.panchangService.getDailyPanchang().subscribe({
      next: (data) => {
        this.panchangData = data;
        this.lastUpdated = new Date();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load Panchang data. Please try again later.';
        this.isLoading = false;
        console.error('Error loading panchang data:', err);
      }
    });
  }

  refreshData(): void {
    this.panchangService.clearCache();
    this.loadPanchangData();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

