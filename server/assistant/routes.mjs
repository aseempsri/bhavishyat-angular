import crypto from 'node:crypto';
import express from 'express';
import { ObjectId } from 'mongodb';
import { AssistantBus, maskPhone, runSummary } from './bus.mjs';
import { integrationStatus, loadAssistantConfig } from './config.mjs';
import { createKnowledgeBase } from './knowledge.mjs';
import { createLlm } from './llm.mjs';
import { createTeamNotifier } from './notify.mjs';
import { createAssistant } from './pipeline.mjs';
import { createRazorpay } from './razorpay.mjs';
import { createWhatsApp } from './whatsapp.mjs';

const DEMO_PHONE = '919999900001';

function cleanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export async function mountAssistant(app, { db, requireAdmin, requestOrigin }) {
  const config = loadAssistantConfig();
  const bus = new AssistantBus(db.collection('assistant_runs'));
  const whatsapp = createWhatsApp(config);
  const llm = createLlm(config);
  const razorpay = createRazorpay(config);
  const notifier = createTeamNotifier(config, whatsapp);
  const kb = createKnowledgeBase(db, config);
  const assistant = createAssistant({ db, bus, config, llm, whatsapp, razorpay, notifier, kb });
  await assistant.ensureIndexes();

  const customers = db.collection('assistant_customers');
  const messages = db.collection('assistant_messages');
  const bookings = db.collection('assistant_bookings');
  const reports = db.collection('assistant_reports');
  const runs = db.collection('assistant_runs');

  const raw = express.raw({ type: '*/*', limit: '1mb' });
  const json = express.json({ limit: '16kb' });

  app.get('/api/assistant/webhooks/whatsapp', (req, res) => {
    const challenge = whatsapp.verifyChallenge(req.query);
    if (challenge === null) {
      bus.log('warn', 'WhatsApp webhook verification rejected', { step: 'receive' });
      res.sendStatus(403);
      return;
    }
    bus.log('info', 'WhatsApp webhook verified by Meta', { step: 'receive' });
    res.type('text/plain').send(challenge);
  });

  app.post('/api/assistant/webhooks/whatsapp', raw, (req, res) => {
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!whatsapp.verifySignature(body, req.get('x-hub-signature-256'))) {
      bus.log('warn', 'WhatsApp webhook signature invalid – request rejected', { step: 'receive' });
      res.sendStatus(401);
      return;
    }
    let payload;
    try {
      payload = JSON.parse(body.toString('utf8'));
    } catch {
      res.sendStatus(400);
      return;
    }
    res.sendStatus(200);
    for (const msg of whatsapp.parseWebhook(payload)) {
      if (!msg.from) continue;
      assistant.handleInbound(msg, { source: 'whatsapp' }).catch((error) => {
        bus.log('error', `Inbound handling failed: ${error.message}`);
      });
    }
  });

  app.post('/api/assistant/webhooks/razorpay', raw, async (req, res) => {
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!razorpay.verifyWebhook(body, req.get('x-razorpay-signature'))) {
      bus.log('warn', 'Razorpay webhook signature invalid – request rejected', { step: 'pay_verify' });
      res.sendStatus(401);
      return;
    }
    let payload;
    try {
      payload = JSON.parse(body.toString('utf8'));
    } catch {
      res.sendStatus(400);
      return;
    }
    res.sendStatus(200);
    const link = payload?.payload?.payment_link?.entity;
    const payment = payload?.payload?.payment?.entity;
    if (!link) return;
    try {
      const booking =
        (link.reference_id && (await bookings.findOne({ _id: link.reference_id }))) ||
        (await assistant.bookingByPaymentLink(link.id));
      if (!booking) {
        bus.log('warn', `Razorpay event ${payload.event} for unknown link ${link.id}`, { step: 'pay_verify' });
        return;
      }
      if (payload.event === 'payment_link.paid') {
        const paidPaise = Number(link.amount_paid ?? payment?.amount ?? 0);
        if (paidPaise < Math.round(booking.amountInr * 100)) {
          bus.log('warn', `Payment for ${booking._id} is ₹${paidPaise / 100}, expected ₹${booking.amountInr} – not confirmed`, { step: 'pay_verify' });
          await notifier.notify(`⚠️ Payment amount mismatch for ${booking._id}: received ₹${paidPaise / 100}, expected ₹${booking.amountInr}. Please check Razorpay.`);
          return;
        }
        await assistant.markBookingPaid(booking._id, { paymentId: payment?.id || null, via: 'Razorpay webhook' });
      } else if (['payment_link.expired', 'payment_link.cancelled'].includes(payload.event) && booking.status === 'pending') {
        const status = payload.event.split('.')[1];
        await bookings.updateOne({ _id: booking._id }, { $set: { status } });
        bus.emitEvent({ kind: 'booking', booking: assistant.publicBooking({ ...booking, status }) });
        bus.log('info', `Payment link for ${booking._id} ${status}`, { step: 'pay_verify' });
      }
    } catch (error) {
      bus.log('error', `Razorpay webhook handling failed: ${error.message}`, { step: 'pay_verify' });
    }
  });

  const admin = express.Router();
  admin.use(requireAdmin, json);
  for (const method of ['get', 'post']) {
    const register = admin[method].bind(admin);
    admin[method] = (route, handler) =>
      register(route, (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next));
  }

  admin.get('/status', async (req, res) => {
    const origin = requestOrigin(req);
    const [customerCount, runCount, bookingCount, handoffCount] = await Promise.all([
      customers.countDocuments(),
      runs.countDocuments(),
      bookings.countDocuments({ status: 'confirmed' }),
      customers.countDocuments({ 'handoff.active': true })
    ]);
    res.json({
      integrations: integrationStatus(config),
      packages: config.packages,
      webhooks: {
        whatsapp: `${origin}/api/assistant/webhooks/whatsapp`,
        razorpay: `${origin}/api/assistant/webhooks/razorpay`
      },
      stats: { customers: customerCount, runs: runCount, confirmedBookings: bookingCount, openHandoffs: handoffCount },
      demoPhone: DEMO_PHONE
    });
  });

  admin.get('/stream', (req, res) => {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.flushHeaders();
    const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);
    send({
      kind: 'hello',
      ts: new Date().toISOString(),
      logs: bus.liveLogs.slice(-200),
      runs: [...bus.liveRuns.values()].map(runSummary)
    });
    bus.on('event', send);
    const heartbeat = setInterval(() => res.write(': ping\n\n'), 20_000);
    req.on('close', () => {
      clearInterval(heartbeat);
      bus.off('event', send);
    });
  });

  admin.get('/runs', async (req, res) => {
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 30, 100);
    const stored = await runs.find({}, { projection: { logs: 0 } }).sort({ startedAt: -1 }).limit(limit).toArray();
    const byId = new Map(stored.map((doc) => [doc._id, doc]));
    for (const doc of bus.liveRuns.values()) byId.set(doc._id, doc);
    const list = [...byId.values()]
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, limit)
      .map(runSummary);
    res.json({ runs: list });
  });

  admin.get('/runs/:id', async (req, res) => {
    const doc = bus.liveRuns.get(req.params.id) || (await runs.findOne({ _id: req.params.id }));
    if (!doc) {
      res.status(404).json({ error: 'Run not found.' });
      return;
    }
    res.json({ run: { ...runSummary(doc), steps: doc.steps, logs: doc.logs } });
  });

  admin.post('/simulate', (req, res) => {
    const text = String(req.body?.text || '').trim().slice(0, 1500);
    const phone = cleanPhone(req.body?.phone) || DEMO_PHONE;
    const name = String(req.body?.name || '').trim().slice(0, 60) || 'Demo Client';
    if (!text) {
      res.status(400).json({ error: 'Message text is required.' });
      return;
    }
    const waMessageId = `sim_${crypto.randomUUID()}`;
    assistant
      .handleInbound({ waMessageId, from: phone, name, timestamp: new Date(), type: 'text', text }, { source: 'simulator' })
      .catch((error) => bus.log('error', `Simulated message failed: ${error.message}`));
    res.status(202).json({ ok: true, waMessageId, phone });
  });

  admin.get('/conversations', async (_req, res) => {
    const list = await customers.find({}).sort({ lastSeenAt: -1 }).limit(60).toArray();
    res.json({
      conversations: list.map((c) => ({
        phone: c._id,
        phoneMasked: maskPhone(c._id),
        name: c.name || '',
        channel: c.channel || 'simulator',
        lastIntent: c.lastIntent || null,
        stage: c.stage || null,
        messageCount: c.messageCount || 0,
        hasBirth: Boolean(c.birth?.date && c.birth?.time && c.birth?.place),
        handoff: Boolean(c.handoff?.active),
        handoffReason: c.handoff?.active ? c.handoff.reason : null,
        lastSeenAt: c.lastSeenAt
      }))
    });
  });

  admin.get('/conversations/:phone', async (req, res) => {
    const phone = cleanPhone(req.params.phone);
    const customer = phone && (await customers.findOne({ _id: phone }));
    if (!customer) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }
    const [msgs, bookingDocs] = await Promise.all([
      messages.find({ phone }).sort({ createdAt: -1, _id: -1 }).limit(100).toArray(),
      bookings.find({ phone }).sort({ createdAt: -1 }).limit(20).toArray()
    ]);
    res.json({
      customer: {
        phone,
        name: customer.name || '',
        channel: customer.channel || 'simulator',
        language: customer.language || 'en',
        birth: customer.birth,
        stage: customer.stage,
        lastIntent: customer.lastIntent || null,
        handoff: customer.handoff || { active: false },
        createdAt: customer.createdAt,
        lastSeenAt: customer.lastSeenAt
      },
      messages: msgs.reverse().map(assistant.publicMessage),
      bookings: bookingDocs.map(assistant.publicBooking)
    });
  });

  admin.post('/conversations/:phone/reply', async (req, res) => {
    try {
      const message = await assistant.staffReply(cleanPhone(req.params.phone), req.body?.text);
      res.json({ message });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  admin.post('/conversations/:phone/handoff', async (req, res) => {
    try {
      await assistant.setHandoff(cleanPhone(req.params.phone), Boolean(req.body?.active));
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  admin.get('/bookings', async (_req, res) => {
    const list = await bookings.find({}).sort({ createdAt: -1 }).limit(60).toArray();
    res.json({ bookings: list.map(assistant.publicBooking) });
  });

  admin.post('/bookings/:ref/mark-paid', async (req, res) => {
    const booking = await bookings.findOne({ _id: String(req.params.ref) });
    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }
    if (!booking.demo) {
      res.status(400).json({ error: 'Live bookings are confirmed only by the Razorpay webhook.' });
      return;
    }
    assistant
      .markBookingPaid(booking._id, { paymentId: `pay_demo_${crypto.randomBytes(5).toString('hex')}`, via: 'demo payment' })
      .catch((error) => bus.log('error', `Demo payment failed: ${error.message}`));
    res.status(202).json({ ok: true });
  });

  admin.get('/reports/:id', async (req, res) => {
    const id = String(req.params.id);
    const doc = ObjectId.isValid(id) ? await reports.findOne({ _id: new ObjectId(id) }) : null;
    if (!doc) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }
    const data = Buffer.isBuffer(doc.data) ? doc.data : Buffer.from(doc.data.buffer);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${doc.filename.replace(/[^A-Za-z0-9._-]/g, '')}"`
    });
    res.send(data);
  });

  admin.post('/reset-demo', async (_req, res) => {
    const demo = await customers.find({ channel: { $ne: 'whatsapp' } }, { projection: { _id: 1 } }).toArray();
    const phones = demo.map((c) => c._id);
    await Promise.all([
      customers.deleteMany({ _id: { $in: phones } }),
      messages.deleteMany({ phone: { $in: phones } }),
      bookings.deleteMany({ phone: { $in: phones } }),
      reports.deleteMany({ phone: { $in: phones } }),
      runs.deleteMany({ source: { $in: ['simulator', 'payment'] }, phone: { $in: phones } })
    ]);
    for (const [id, doc] of bus.liveRuns) if (phones.includes(doc.phone)) bus.liveRuns.delete(id);
    bus.log('info', `Demo data cleared (${phones.length} simulator conversations)`);
    bus.emitEvent({ kind: 'reset' });
    res.json({ ok: true, cleared: phones.length });
  });

  admin.use((error, _req, res, _next) => {
    bus.log('error', `Admin API error: ${error.message}`);
    if (!res.headersSent) res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });
  app.use('/api/admin/assistant', admin);
  bus.log(
    'info',
    `Assistant ready – WhatsApp ${config.enabled.whatsapp ? 'live' : 'demo'}, LLM ${config.enabled.llm ? 'live' : 'demo'}, Razorpay ${config.enabled.razorpay ? 'live' : 'demo'}`
  );
}
