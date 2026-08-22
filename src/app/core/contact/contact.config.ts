import { WhatsAppCta } from './contact-leads.config';
import { logWhatsAppCtaClick } from './contact-leads.logger';

export const WHATSAPP_NUMBER = '917007229788';
export const WHATSAPP_DISPLAY = '+91 70072 29788';

export const WHATSAPP_CONSULTATION_MESSAGE =
  'Hello Shubhram, I would like to enquire about a Vedic consultation.';

export const WHATSAPP_SLOT_MESSAGE =
  'Hello Shubhram, I would like to request a consultation slot.';

export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  if (!message) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(message?: string, cta: WhatsAppCta = 'connect-with-us'): void {
  if (typeof window === 'undefined') {
    return;
  }
  logWhatsAppCtaClick(cta, message);
  window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer');
}
