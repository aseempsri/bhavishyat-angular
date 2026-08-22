/**
 * Google Sheets lead logging (Option A).
 *
 * Setup:
 * 1. Create a Google Sheet with a tab named "Leads".
 * 2. Add header row:
 *    Timestamp | CTA | Page | Message | Referrer | User Agent | Full URL | Device
 * 3. Extensions → Apps Script → paste scripts/google-sheets-leads-webhook.gs
 * 4. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone
 * 5. Copy the Web app URL into GOOGLE_SHEETS_LEADS_WEBHOOK_URL below.
 * 6. Set the same secret in GOOGLE_SHEETS_LEADS_SECRET and in the Apps Script SECRET constant.
 *
 * Leave WEBHOOK_URL empty to disable logging (local dev).
 */
export const GOOGLE_SHEETS_LEADS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxxoiKzIoJ__RkFJoRT0ok2nvW8wfn8IPCMeLb79rLIuQ4bImzBbuGcCnTj_2XyIQCo4A/exec';
export const GOOGLE_SHEETS_LEADS_SECRET = 'bhav7xK9mQ2pL4nR8wZ1';

export type WhatsAppCta = 'connect-with-us' | 'request-slot';
