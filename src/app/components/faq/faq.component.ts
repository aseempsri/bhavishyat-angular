import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent {
  readonly embedded = input(false);
  readonly openId = signal<string | null>(null);

  readonly items: FaqItem[] = [
    {
      id: 'what-is-bhavishyat',
      question: 'What is BHAVISHYAT?',
      answer:
        'BHAVISHYAT is a premium Vedic astrology practice focused on life planning and decision timing. Rather than generic predictions, the work centres on helping you think through the decisions that actually shape a life — career moves, marriage, business, property, and major transitions — with structured, chart-based guidance.'
    },
    {
      id: 'difference',
      question: 'How is this different from a typical astrology reading?',
      answer:
        'Most readings tell you what might happen. BHAVISHYAT focuses on when to act and when to wait. Consultations are detailed, conversational, and oriented around your real questions — not a scripted report. The goal is clarity on timing and direction, so you can decide with confidence instead of guesswork.'
    },
    {
      id: 'offerings',
      question: 'What consultations do you offer?',
      answer:
        'Three main formats are available: a Personal Consultation (from ₹5,100) for focused guidance on specific life areas; the Signature Kundali Experience (from ₹8,100), which includes in-depth chart analysis plus a digital and physical Kundali dossier; and Additional Kundali charts (₹3,100 per chart) for partners, family members, or others relevant to your questions.'
    },
    {
      id: 'birth-details',
      question: 'What birth details do I need to share?',
      answer:
        'Accurate date, time, and place of birth are essential for a meaningful reading. If your birth time is approximate, mention that when you reach out — Shubhram will advise whether rectification is needed before the consultation.'
    },
    {
      id: 'languages',
      question: 'Are consultations available in Hindi and English?',
      answer:
        'Yes. Consultations are offered in both Hindi and English, and often comfortably in a mix of both — whichever helps you express your questions most clearly.'
    },
    {
      id: 'booking',
      question: 'How do I book a consultation?',
      answer:
        'Use Connect With Us or Request a Slot on this website to reach Shubhram on WhatsApp. Share a brief note on what you would like guidance on, and you will receive a reply personally within 24 hours to discuss the right format and next steps.'
    },
    {
      id: 'online',
      question: 'Are sessions online or in person?',
      answer:
        'Consultations are conducted online, making them accessible wherever you are. You receive the same depth of analysis and conversation as an in-person session, with the flexibility to join from home or office.'
    },
    {
      id: 'family-charts',
      question: 'Can I include my partner or a family member\'s chart?',
      answer:
        'Yes. Additional Kundali charts can be added for spouses, partners, children, parents, or other family members when their charts are relevant to your questions — for example, marriage compatibility, family decisions, or joint planning.'
    },
    {
      id: 'varshfal',
      question: 'What is varshfal and how does it help with planning?',
      answer:
        'Varshfal is your annual chart — a map of the themes, windows, and priorities for your year ahead. Many clients use it the way they would a planning cycle at work: to understand when to push forward, when to consolidate, and how to channel effort in line with the year\'s timing.'
    },
    {
      id: 'privacy',
      question: 'Is my information kept confidential?',
      answer:
        'Absolutely. Birth details, personal questions, and everything discussed in a consultation are treated with complete confidentiality. Your chart and conversation are never shared with anyone without your explicit consent.'
    }
  ];

  toggle(id: string): void {
    this.openId.update((current) => (current === id ? null : id));
  }

  isOpen(id: string): boolean {
    return this.openId() === id;
  }
}
