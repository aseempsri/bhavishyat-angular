import crypto from 'node:crypto';

const MAX_TEXT = 4000;
const OUTSIDE_WINDOW = 131047;

export function createWhatsApp(config) {
  const { token, phoneNumberId, appSecret, verifyToken, graphVersion, templateName, templateLang } = config.whatsapp;
  const base = `https://graph.facebook.com/${graphVersion}`;
  const enabled = Boolean(token && phoneNumberId);

  function verifyChallenge(query) {
    if (!verifyToken) return null;
    const mode = query['hub.mode'];
    const sent = String(query['hub.verify_token'] || '');
    if (mode !== 'subscribe' || sent.length !== verifyToken.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(verifyToken))) return null;
    return String(query['hub.challenge'] || '');
  }

  function verifySignature(rawBody, header) {
    if (!appSecret) return false;
    const value = String(header || '');
    if (!value.startsWith('sha256=')) return false;
    const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const given = value.slice(7);
    if (given.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  }

  function parseWebhook(body) {
    const messages = [];
    for (const entry of body?.entry || []) {
      for (const change of entry?.changes || []) {
        const value = change?.value || {};
        const names = new Map((value.contacts || []).map((c) => [c.wa_id, c.profile?.name || '']));
        for (const msg of value.messages || []) {
          const type = msg.type;
          const media = msg[type] && typeof msg[type] === 'object' ? msg[type] : {};
          messages.push({
            waMessageId: msg.id,
            from: String(msg.from || '').replace(/\D/g, ''),
            name: names.get(msg.from) || '',
            timestamp: msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date(),
            type,
            text:
              msg.text?.body ||
              msg.button?.text ||
              msg.interactive?.button_reply?.title ||
              msg.interactive?.list_reply?.title ||
              media.caption ||
              '',
            mediaId: media.id || null,
            mimeType: media.mime_type || null,
            filename: media.filename || null
          });
        }
      }
    }
    return messages;
  }

  async function graph(pathname, init) {
    const res = await fetch(`${base}/${pathname}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
      signal: AbortSignal.timeout(20_000)
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = new Error(`WhatsApp API error: ${payload?.error?.message || `HTTP ${res.status}`}`);
      error.code = payload?.error?.code;
      throw error;
    }
    return payload;
  }

  async function sendTemplate(to, text) {
    const param = String(text || '')
      .replace(/\s*\n+\s*/g, ' · ')
      .replace(/\s{2,}/g, ' ')
      .slice(0, 1000);
    const payload = await graph(`${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [{ type: 'body', parameters: [{ type: 'text', text: param }] }]
        }
      })
    });
    return { demo: false, id: payload?.messages?.[0]?.id || null, template: true };
  }

  async function sendText(to, text) {
    const body = String(text || '').slice(0, MAX_TEXT);
    if (!enabled) return { demo: true, id: null };
    try {
      const payload = await graph(`${phoneNumberId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: true, body }
        })
      });
      return { demo: false, id: payload?.messages?.[0]?.id || null };
    } catch (error) {
      if (error.code === OUTSIDE_WINDOW && templateName) return sendTemplate(to, body);
      throw error;
    }
  }

  async function sendDocument(to, buffer, filename, caption) {
    if (!enabled) return { demo: true, id: null };
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', 'application/pdf');
    form.append('file', new Blob([buffer], { type: 'application/pdf' }), filename);
    const uploaded = await graph(`${phoneNumberId}/media`, { method: 'POST', body: form });
    const payload = await graph(`${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: { id: uploaded.id, filename, caption: String(caption || '').slice(0, 1000) }
      })
    });
    return { demo: false, id: payload?.messages?.[0]?.id || null };
  }

  async function markRead(waMessageId) {
    if (!enabled || !waMessageId) return;
    await graph(`${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: waMessageId })
    });
  }

  return { enabled, verifyChallenge, verifySignature, parseWebhook, sendText, sendDocument, markRead };
}
