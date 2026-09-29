import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  DOCUMENT,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button.component';
import {
  openWhatsApp,
  WHATSAPP_INTRO_OFFER_MESSAGE
} from '../../core/contact/contact.config';

const STORAGE_KEY = 'bhavishyat_intro_offer_dismissed';

@Component({
  selector: 'app-consultation-offer-modal',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './consultation-offer-modal.component.html',
  styleUrl: './consultation-offer-modal.component.css'
})
export class ConsultationOfferModalComponent implements OnInit, OnDestroy {
  private readonly document = inject(DOCUMENT);

  isOpen = false;
  private hasTriggered = false;
  private observer?: IntersectionObserver;
  private openTimer?: ReturnType<typeof setTimeout>;

  readonly tickerSegments = [
    'Limited Period Offer',
    'Short-Term Consultation',
    'Only ₹1,100',
    'Limited Slots'
  ];

  readonly perks = [
    'Express reading',
    'Personalised Vedic guidance',
    'Focused 1-on-1 session',
    'Clear next steps for your chart'
  ];

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      this.hasTriggered = true;
      return;
    }

    // Wait a tick so the hero is in the DOM
    queueMicrotask(() => this.watchHeroExit());
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.openTimer) {
      clearTimeout(this.openTimer);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  close(): void {
    this.isOpen = false;
    sessionStorage.setItem(STORAGE_KEY, '1');
    this.document.body.style.overflow = '';
  }

  claimOffer(): void {
    openWhatsApp(WHATSAPP_INTRO_OFFER_MESSAGE, 'intro-offer');
    this.close();
  }

  private watchHeroExit(): void {
    const hero = this.document.getElementById('hero');
    if (!hero || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || this.hasTriggered) {
          return;
        }

        // Hero fully scrolled past (no longer visible, bottom above viewport)
        const scrolledPast =
          !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;

        if (scrolledPast) {
          this.hasTriggered = true;
          this.observer?.disconnect();
          this.openTimer = setTimeout(() => this.open(), 280);
        }
      },
      { threshold: 0, rootMargin: '0px' }
    );

    this.observer.observe(hero);
  }

  private open(): void {
    this.isOpen = true;
    this.document.body.style.overflow = 'hidden';
  }
}
