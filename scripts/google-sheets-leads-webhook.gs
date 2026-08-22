/**
 * BHAVISHYAT — WhatsApp CTA click logger for Google Sheets.
 *
 * Setup:
 * 1. Create a Google Sheet with a tab named "Leads".
 * 2. Row 1 headers:
 *    Timestamp | CTA | Page | Message | Referrer | User Agent | Full URL | Device
 * 3. Paste this file into Extensions → Apps Script.
 * 4. Set SECRET below (same value as contact-leads.config.ts in the Angular app).
 * 5. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the deployment URL into GOOGLE_SHEETS_LEADS_WEBHOOK_URL in the Angular app.
 */

const SECRET = 'bhav7xK9mQ2pL4nR8wZ1';

function doGet(e) {
  const params = e.parameter;

  if (!params.secret || params.secret !== SECRET) {
    return jsonResponse({ ok: false, error: 'unauthorized' });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  if (!sheet) {
    return jsonResponse({ ok: false, error: 'missing Leads sheet tab' });
  }

  sheet.appendRow([
    new Date(),
    params.cta || '',
    params.page || '',
    params.message || '',
    params.referrer || '',
    params.userAgent || '',
    params.fullUrl || '',
    params.device || ''
  ]);

  return jsonResponse({ ok: true });
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
