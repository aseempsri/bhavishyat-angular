import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../ui/button/button.component';
import {
  openWhatsApp,
  WHATSAPP_CONSULTATION_MESSAGE,
  WHATSAPP_SLOT_MESSAGE
} from '../../core/contact/contact.config';

interface ConsultationOffering {
  label: string;
  title: string;
  price: string;
  priceAmount: string;
  priceNote?: string;
  highlights: string[];
  bestFor: string[];
  featured?: boolean;
  badge?: string;
}

@Component({
  selector: 'app-services',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent {
  readonly launchTickerSegments = [
    '50% Off Launch Discount',
    'First 50 Customers Only',
    'Early-Bird Consultation Offer',
    'Limited Slots Available'
  ];

  readonly offerings: ConsultationOffering[] = [
    {
      label: 'Start Here',
      title: 'Personal Consultation',
      price: 'From ₹5,100',
      priceAmount: '₹5,100',
      highlights: [
        'Private 1-on-1 session',
        'Career, marriage, family & finances',
        'Specific questions & life transitions'
      ],
      bestFor: [
        'Focused guidance on one area',
        'Clear questions to resolve'
      ]
    },
    {
      label: 'Signature Experience',
      title: 'Signature Kundali Experience',
      price: 'From ₹8,100',
      priceAmount: '₹8,100',
      highlights: [
        'In-depth Kundali analysis',
        'Personalised guidance session',
        'Digital + physical dossier'
      ],
      bestFor: [
        'Deeper chart understanding',
        'Full consultation experience'
      ],
      featured: true,
      badge: 'Signature'
    },
    {
      label: 'Together',
      title: 'Additional Kundali',
      price: '₹3,100',
      priceAmount: '₹3,100',
      priceNote: 'per additional chart',
      highlights: [
        'Spouse, partner, or family chart',
        'When their chart matters to your question',
        'Added to your consultation'
      ],
      bestFor: [
        'Couples & families',
        'Multi-chart readings'
      ]
    }
  ];

  requestSlotViaWhatsApp(): void {
    openWhatsApp(WHATSAPP_SLOT_MESSAGE, 'request-slot');
  }

  chatViaWhatsApp(): void {
    openWhatsApp(WHATSAPP_CONSULTATION_MESSAGE, 'connect-with-us');
  }
}
