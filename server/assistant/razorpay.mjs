import crypto from 'node:crypto';

const API = 'https://api.razorpay.com/v1';

export function createRazorpay(config) {
  const { keyId, keySecret, webhookSecret } = config.razorpay;
  const enabled = Boolean(keyId && keySecret);
  const auth = enabled ? `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}` : '';

  async function call(pathname, init = {}) {
    const res = await fetch(`${API}${pathname}`, {
      ...init,
      headers: { Authorization: auth, 'Content-Type': 'application/json', ...(init.headers || {}) },
      signal: AbortSignal.timeout(20_000)
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Razorpay error: ${payload?.error?.description || `HTTP ${res.status}`}`);
    }
    return payload;
  }

  async function createPaymentLink({ amountInr, description, name, phone, referenceId, notes }) {
    if (!enabled) {
      const id = `plink_demo_${crypto.randomBytes(6).toString('hex')}`;
      return { demo: true, id, shortUrl: `https://rzp.io/demo/${id}`, status: 'created' };
    }
    const payload = await call('/payment_links', {
      method: 'POST',
      body: JSON.stringify({
        amount: Math.round(amountInr * 100),
        currency: 'INR',
        accept_partial: false,
        reference_id: referenceId,
        description: description.slice(0, 2048),
        customer: { name: name || 'BHAVISHYAT client', contact: `+${phone}` },
        notify: { sms: false, email: false },
        reminder_enable: true,
        notes
      })
    });
    return { demo: false, id: payload.id, shortUrl: payload.short_url, status: payload.status };
  }

  async function fetchPaymentLink(id) {
    if (!enabled || id.startsWith('plink_demo_')) return null;
    const payload = await call(`/payment_links/${encodeURIComponent(id)}`);
    return {
      id: payload.id,
      status: payload.status,
      amountPaid: (payload.amount_paid || 0) / 100,
      paymentId: payload.payments?.[0]?.payment_id || null
    };
  }

  function verifyWebhook(rawBody, signature) {
    if (!webhookSecret) return false;
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    const given = String(signature || '');
    if (given.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  }

  return { enabled, createPaymentLink, fetchPaymentLink, verifyWebhook };
}
