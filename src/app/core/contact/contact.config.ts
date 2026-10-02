import { WhatsAppCta } from './contact-leads.config';
import { logWhatsAppCtaClick } from './contact-leads.logger';

export const WHATSAPP_NUMBER = '919180281884';
export const WHATSAPP_DISPLAY = '+91 91802 81884';
export const CONTACT_EMAIL = 'connect@bhavishyat.in';

export const WHATSAPP_CONSULTATION_MESSAGE =
  'Hello Shubhram, I would like to enquire about a Vedic consultation.';

export const WHATSAPP_SLOT_MESSAGE =
  'Hello Shubhram, I would like to request a consultation slot.';

export const WHATSAPP_INTRO_OFFER_MESSAGE =
  'Hello Shubhram, I am interested in the limited-period consultation offer at ₹1,100. Please share the next available slot.';

export function mailtoUrl(): string {
  return `mailto:${CONTACT_EMAIL}`;
}
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(message)}`;
}

let lastWhatsAppOpenAt = 0;

export function openWhatsApp(message?: string, cta: WhatsAppCta = 'connect-with-us'): void {
  if (typeof window === 'undefined') {
    return;
  }

  const now = Date.now();
  if (now - lastWhatsAppOpenAt < 1500) {
    return;
  }
  lastWhatsAppOpenAt = now;

  logWhatsAppCtaClick(cta, message);
  window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer');
}
