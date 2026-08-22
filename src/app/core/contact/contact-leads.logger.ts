import {
  GOOGLE_SHEETS_LEADS_SECRET,
  GOOGLE_SHEETS_LEADS_WEBHOOK_URL,
  WhatsAppCta
} from './contact-leads.config';

function summarizeUserAgent(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) {
    return /Mobile/i.test(userAgent) ? 'Edge on mobile' : 'Edge on desktop';
  }
  if (/Chrome\//i.test(userAgent) && !/Edg/i.test(userAgent)) {
    if (/Android/i.test(userAgent)) {
      return 'Chrome on Android';
    }
    if (/iPhone|iPad/i.test(userAgent)) {
      return 'Chrome on iOS';
    }
    return 'Chrome on desktop';
  }
  if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    if (/iPhone/i.test(userAgent)) {
      return 'Safari on iPhone';
    }
    if (/iPad/i.test(userAgent)) {
      return 'Safari on iPad';
    }
    return 'Safari on desktop';
  }
  if (/Firefox/i.test(userAgent)) {
    return /Mobile/i.test(userAgent) ? 'Firefox on mobile' : 'Firefox on desktop';
  }
  return userAgent.length > 120 ? `${userAgent.slice(0, 117)}...` : userAgent;
}

function detectDevice(): string {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const userAgent = navigator.userAgent;
  if (/iPad|Tablet/i.test(userAgent)) {
    return 'tablet';
  }
  if (/Mobi|Android/i.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

export function logWhatsAppCtaClick(cta: WhatsAppCta, message?: string): void {
  if (typeof window === 'undefined' || !GOOGLE_SHEETS_LEADS_WEBHOOK_URL) {
    return;
  }

  const params = new URLSearchParams({
    secret: GOOGLE_SHEETS_LEADS_SECRET,
    cta,
    page: window.location.pathname,
    message: message ?? '',
    referrer: document.referrer || '',
    userAgent: summarizeUserAgent(navigator.userAgent),
    fullUrl: window.location.href,
    device: detectDevice()
  });

  fetch(`${GOOGLE_SHEETS_LEADS_WEBHOOK_URL}?${params.toString()}`, {
    method: 'GET',
    mode: 'no-cors',
    keepalive: true
  }).catch(() => {});
}
