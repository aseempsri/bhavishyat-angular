import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeChart, currentTransits, isPastIsoDate, parseBirthDetails, resolvePlace } from './astro.mjs';
import { buildPdf, kundliReportBlocks } from './pdf.mjs';
import { maskPhone } from './bus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const INTENTS = ['general_faq', 'birth_chart', 'astrology_question', 'pricing_booking', 'payment_query', 'other'];
const BRANCH_BY_INTENT = {
  general_faq: 'faq',
  birth_chart: 'chart',
  astrology_question: 'question',
  pricing_booking: 'pricing',
  payment_query: 'payment',
  other: 'other'
};
const BRANCH_LABEL = {
  faq: 'General FAQ',
  chart: 'Birth Chart / Kundli',
  question: 'Astrology Question',
  pricing: 'Pricing / Booking',
  payment: 'Payment Query',
  other: 'Other / Fallback'
};
const LANGUAGE_LABEL = { en: 'English', hi: 'Hindi (Devanagari script)', hinglish: 'Hinglish (Hindi in Latin script)' };
const TEAM_REMINDER_MS = 10 * 60 * 1000;

const RX = {
  human: /\b(human|real person|agent|representative|talk to (?:shubhram|the astrologer|someone|a person)|speak to (?:shubhram|someone|a person)|call me|baat karni|baat karna|baat karao|insaan|kisi se baat)\b/i,
  paymentQuery: /\b(i(?:'ve| have)? paid|paid already|already paid|payment (?:done|failed|status|issue|pending)|transaction|refund|receipt|invoice|money deducted|booking status|my booking|payment (?:ho gaya|ho gya|hua|nahi hua|kar diya|kar di|fail)|pay kar (?:diya|di)|paise? (?:kat|cut) (?:gaye|gaya|gya|liye)|paisa (?:kat|cut) gaya|booking (?:ka|ki) status)\b/i,
  pricing: /\b(price|prices|pricing|cost|costs|fee|fees|charges?|kitna|rate|rates|packages?|book|booking|slot|appointment|consultation)\b/i,
  bookingIntent: /\b(book|booking|pay|payment link|slot|appointment|reserve)\b/i,
  chart: /\b(kundli|kundali|birth ?chart|janam|rashi|lagna|ascendant|nakshatra|moon sign|sun sign|my chart|horoscope|dasha|mahadasha)\b/i,
  question: /\b(career|job|naukri|promotion|marriage|shaadi|vivah|business|health|money|finance|wealth|relationship|love|child|children|property|house|foreign|abroad|visa|transit|saturn|shani|rahu|ketu|sade ?sati|mangal|manglik|muhurat|remedy|remedies|upay|gemstone|varshphal|varshfal|education|exam|study)\b/i,
  faq: /\b(hi|hello|hey|namaste|namaskar|pranam|good (?:morning|evening|afternoon)|who are you|about|what is|how does|how do|online|language|hindi|english|privacy|confidential|bhavishyat|thank|thanks|dhanyavad)\b/i,
  hinglish: /\b(kya|hai|hain|mera|meri|mere|mujhe|kab|kaise|kaisa|shaadi|naukri|batao|bataiye|kripya|aap|hoga|hogi|kitna|kitne|nahi|karna|chahiye)\b/i
};

const HI = {
  human: /इंसान|व्यक्ति से बात|किसी से बात|बात करनी|बात करना|कॉल करें/,
  paymentQuery: /भुगतान कर दिया|पेमेंट कर दिया|पेमेंट हो गया|रिफंड|पैसे कट|बुकिंग की स्थिति|मेरी बुकिंग/,
  pricing: /कीमत|शुल्क|फीस|दाम|बुक|बुकिंग|परामर्श|कितना|कितने|पैकेज/,
  chart: /कुंडली|कुण्डली|जन्मपत्री|जन्म कुंडली|राशि|लग्न|नक्षत्र|दशा/,
  question: /करियर|नौकरी|शादी|विवाह|व्यापार|व्यवसाय|स्वास्थ्य|धन|पैसा|प्रेम|संतान|बच्चे|घर|विदेश|गोचर|शनि|राहु|केतु|साढ़े ?साती|मंगल|मांगलिक|मुहूर्त|उपाय|रत्न|वर्षफल|पढ़ाई|परीक्षा/,
  faq: /नमस्ते|नमस्कार|प्रणाम|धन्यवाद|भविष्यत|आप कौन/
};

const matches = (key, text) => RX[key].test(text) || Boolean(HI[key]?.test(text));

function normalizeText(text) {
  return String(text || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 2000);
}

function detectLanguage(text) {
  const letters = text.replace(/[^\p{L}]/gu, '');
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (letters.length && devanagari / letters.length > 0.3) return 'hi';
  if (RX.hinglish.test(text)) return 'hinglish';
  return 'en';
}

function detectSpecialRequest(text) {
  if (/\b(match(?:ing)?|milan|guna|gun milan|compatib\w*|ashtakoot)\b|मिलान|गुण/i.test(text)) return 'matching';
  if (/\b(muhurat|muhurt|muhurtha|auspicious (?:date|time|day))\b|मुहूर्त|शुभ (?:समय|दिन|तिथि)/i.test(text)) return 'muhurat';
  return null;
}

function detectPackage(text) {
  if (/\bsignature\b/i.test(text)) return 'signature';
  if (/\b(additional|extra|family|partner|spouse|second chart)\b/i.test(text)) return 'additional';
  if (/\bpersonal\b/i.test(text)) return 'personal';
  return null;
}

function rulesClassify(text, customer, birth) {
  const base = { method: 'rules', birth, packageCode: detectPackage(text), wantsHuman: false, bookingIntent: false };
  if (matches('human', text)) return { ...base, intent: 'other', confidence: 0.9, wantsHuman: true };
  if (matches('paymentQuery', text)) return { ...base, intent: 'payment_query', confidence: 0.85 };
  if (matches('pricing', text)) {
    return { ...base, intent: 'pricing_booking', confidence: 0.8, bookingIntent: RX.bookingIntent.test(text) || /बुक/.test(text) };
  }
  if (detectSpecialRequest(text)) return { ...base, intent: 'astrology_question', confidence: 0.75 };
  if ((birth && birth.date) || matches('chart', text) || (customer?.stage === 'awaiting_birth' && birth)) {
    return { ...base, intent: 'birth_chart', confidence: 0.8 };
  }
  if (matches('question', text)) return { ...base, intent: 'astrology_question', confidence: 0.75 };
  if (matches('faq', text) || text.length < 25) return { ...base, intent: 'general_faq', confidence: 0.6 };
  return { ...base, intent: 'other', confidence: 0.4 };
}

const BIRTH_CUE = /\b(born|birth|dob|d\.o\.b|janm|janam|janma)\b|जन्म|पैदा/i;

function sanitizeBirth(candidate) {
  if (!candidate || typeof candidate !== 'object') return null;
  const date = isPastIsoDate(candidate.date) ? candidate.date : null;
  const time = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(candidate.time || '')) ? candidate.time : null;
  const place = typeof candidate.place === 'string' && candidate.place.trim().length >= 2 ? candidate.place.trim().slice(0, 80) : null;
  return date || time || place ? { date, time, place } : null;
}

function acceptBirth(text, customer, candidate, intent) {
  const clean = sanitizeBirth(candidate);
  if (!clean) return null;
  const cue = BIRTH_CUE.test(text);
  const stored = customer?.birth;
  if (stored?.date && stored?.time && stored?.place && !cue) return null;
  if (!cue && ['pricing_booking', 'payment_query', 'other'].includes(intent)) return null;
  const complete = clean.date && clean.time && clean.place;
  return cue || complete || customer?.stage === 'awaiting_birth' ? clean : null;
}

function bareplace(text, customer) {
  const missing = missingBirthFields(customer?.birth);
  if (customer?.stage !== 'awaiting_birth' || missing.length !== 1 || missing[0] !== 'place') return null;
  const value = text.trim().replace(/[.!]+$/, '');
  return /^[\p{L}][\p{L}\s,.'-]{1,40}$/u.test(value) ? { date: null, time: null, place: value } : null;
}

function mergeBirth(previous, ...candidates) {
  const merged = { date: previous?.date || null, time: previous?.time || null, place: previous?.place || null };
  let changed = false;
  for (const candidate of candidates) {
    if (!candidate) continue;
    for (const key of ['date', 'time', 'place']) {
      const value = candidate[key];
      if (value && value !== merged[key]) {
        merged[key] = value;
        changed = true;
      }
    }
  }
  return { birth: merged, changed };
}

function missingBirthFields(birth) {
  return ['date', 'time', 'place'].filter((key) => !birth?.[key]);
}

function formatForWhatsApp(text) {
  return String(text || '')
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/__(.+?)__/g, '_$1_')
    .replace(/^#{1,6}\s*(.+)$/gm, '*$1*')
    .replace(/^\s*[-•]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 3800);
}

function joinAnd(items) {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items.join('');
}

function inr(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

function chartFacts(chart, place) {
  if (!chart) return null;
  return {
    place: place?.name,
    lagna: `${chart.lagna.name} (${chart.lagna.english}) ${chart.lagna.degree}°`,
    moonSign: `${chart.moonSign.name} (${chart.moonSign.english})`,
    sunSign: `${chart.sunSign.name} (${chart.sunSign.english})`,
    nakshatra: `${chart.nakshatra.name} pada ${chart.nakshatra.pada}, lord ${chart.nakshatra.lord}`,
    runningMahadasha: chart.dasha.current ? `${chart.dasha.current.lord} until ${chart.dasha.current.end}` : null,
    runningAntardasha: chart.dasha.antardasha ? `${chart.dasha.antardasha.lord} until ${chart.dasha.antardasha.end}` : null,
    nextMahadasha: chart.dasha.next ? `${chart.dasha.next.lord} from ${chart.dasha.next.start}` : null,
    todayTransit: `Sun in ${chart.transits.sun.english}, Moon in ${chart.transits.moon.english} (${chart.transits.moonNakshatra.name})`
  };
}

export function createAssistant({ db, bus, config, llm, whatsapp, razorpay, notifier, kb }) {
  const customers = db.collection('assistant_customers');
  const messages = db.collection('assistant_messages');
  const bookings = db.collection('assistant_bookings');
  const reports = db.collection('assistant_reports');
  const queues = new Map();
  const brandVoice = fs.readFileSync(path.join(__dirname, 'brand-voice.md'), 'utf8').trim();
  const publicOrigin = (process.env.PUBLIC_ORIGIN || 'https://bhavishyat.in').replace(/\/$/, '');

  async function ensureIndexes() {
    await messages.createIndex(
      { waMessageId: 1 },
      { unique: true, partialFilterExpression: { waMessageId: { $type: 'string' } } }
    );
    await messages.createIndex({ phone: 1, createdAt: -1 });
    await bookings.createIndex({ phone: 1, createdAt: -1 });
    await bookings.createIndex({ paymentLinkId: 1 }, { sparse: true });
    await db.collection('assistant_runs').createIndex({ startedAt: -1 });
    await db.collection('assistant_runs').createIndex({ endedAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });
    await kb.seed();
  }

  function enqueue(phone, task) {
    const previous = queues.get(phone) || Promise.resolve();
    const next = previous.catch(() => {}).then(task);
    queues.set(phone, next);
    next.finally(() => {
      if (queues.get(phone) === next) queues.delete(phone);
    });
    return next;
  }

  function publicMessage(doc) {
    return {
      id: doc._id.toString(),
      phone: doc.phone,
      direction: doc.direction,
      author: doc.author,
      channel: doc.channel,
      text: doc.text,
      attachment: doc.attachment || null,
      runId: doc.runId || null,
      demo: Boolean(doc.demo),
      createdAt: doc.createdAt
    };
  }

  async function saveMessage(doc) {
    const full = { ...doc, createdAt: doc.createdAt || new Date() };
    const result = await messages.insertOne(full);
    full._id = result.insertedId;
    bus.emitEvent({ kind: 'chat', message: publicMessage(full) });
    return full;
  }

  async function history(phone, excludeId) {
    const docs = await messages
      .find({ phone, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(config.historyLimit)
      .toArray();
    return docs.reverse();
  }

  async function llmClassify(text, recent, customer) {
    const system =
      'You classify WhatsApp messages for a Vedic astrology practice. Return JSON only with keys: ' +
      '"intent" (one of general_faq, birth_chart, astrology_question, pricing_booking, payment_query, other), ' +
      '"confidence" (0-1), "language" (en, hi or hinglish), "wantsHuman" (boolean), ' +
      '"bookingIntent" (boolean, true if they want to book or pay now), ' +
      '"packageCode" (personal, signature, additional or null), ' +
      '"birth" ({"date":"YYYY-MM-DD"|null,"time":"HH:mm" 24h|null,"place":string|null} or null).\n' +
      'general_faq: greetings, questions about the practice, how it works. birth_chart: wants their kundli, rashi, lagna, ' +
      'nakshatra, dasha, or is sharing birth details. astrology_question: life questions (career, marriage, business, ' +
      'transits, remedies, varshphal). pricing_booking: prices, packages, wants to book. payment_query: about a payment ' +
      'they made or a booking status. other: out of scope, complaints, or asks for a human.';
    const context = recent
      .slice(-4)
      .map((m) => `${m.author === 'customer' ? 'Customer' : 'Assistant'}: ${m.text}`)
      .join('\n');
    const { content, usage, model } = await llm.chat({
      model: config.llm.classifierModel,
      json: true,
      temperature: 0,
      maxTokens: 250,
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content:
            `Known birth details: ${JSON.stringify(customer?.birth || null)}\n` +
            `Conversation stage: ${customer?.stage || 'none'}\nRecent conversation:\n${context || '(none)'}\n\n` +
            `New message:\n${text}`
        }
      ]
    });
    const intent = INTENTS.includes(content.intent) ? content.intent : 'other';
    return {
      method: 'llm',
      model,
      usage,
      intent,
      confidence: Math.max(0, Math.min(1, Number(content.confidence) || 0.5)),
      language: ['en', 'hi', 'hinglish'].includes(content.language) ? content.language : null,
      wantsHuman: Boolean(content.wantsHuman),
      bookingIntent: Boolean(content.bookingIntent),
      packageCode: ['personal', 'signature', 'additional'].includes(content.packageCode) ? content.packageCode : null,
      birth: content.birth && typeof content.birth === 'object' ? content.birth : null
    };
  }

  function packageFor(code) {
    return config.packages.find((p) => p.code === code) || config.packages[0];
  }

  async function buildReport({ customer, chart, place, booking }) {
    const pdf = buildPdf(
      kundliReportBlocks({
        name: customer.name,
        birth: customer.birth,
        place,
        chart,
        booking,
        astrologerName: config.astrologerName
      })
    );
    const filename = `Bhavishyat-Kundli-${(customer.name || 'Summary').replace(/[^A-Za-z0-9]+/g, '-')}.pdf`;
    const { insertedId } = await reports.insertOne({
      phone: customer.phone,
      bookingId: booking?._id || null,
      filename,
      data: pdf,
      createdAt: new Date()
    });
    if (booking) await bookings.updateOne({ _id: booking._id }, { $set: { reportId: insertedId } });
    return { id: insertedId, filename, buffer: pdf, bytes: pdf.length };
  }

  async function chartFor(customer) {
    const birth = customer.birth;
    if (missingBirthFields(birth).length) return { missing: missingBirthFields(birth) };
    const place = await resolvePlace(birth.place, { userAgent: config.geocodeUserAgent });
    if (!place) return { missing: ['place'], placeNotFound: true };
    if (place.tzOffsetMinutes === null) return { missing: ['timezone'], place };
    const chart = computeChart({
      date: birth.date,
      time: birth.time,
      lat: place.lat,
      lon: place.lon,
      tzOffsetMinutes: place.tzOffsetMinutes
    });
    return { chart, place };
  }

  async function confirmBooking(run, booking, { paymentId = null, via }) {
    let report = null;
    const output = await run.step('booking', { reference: booking._id, via }, async () => {
      const paidAt = new Date();
      await bookings.updateOne(
        { _id: booking._id },
        { $set: { status: 'confirmed', paidAt, paymentId, confirmedVia: via, slot: 'To be scheduled by the team' } }
      );
      const customer = await customers.findOne({ _id: booking.phone });
      const fresh = { ...booking, status: 'confirmed', paidAt, paymentId };
      let missing = missingBirthFields(customer?.birth);
      if (!missing.length) {
        const result = await chartFor(customer);
        if (result.chart) report = await buildReport({ customer, chart: result.chart, place: result.place, booking: fresh });
        else missing = result.missing;
      }
      await customers.updateOne(
        { _id: booking.phone },
        { $set: { stage: missing.length ? 'awaiting_birth' : 'booked', updatedAt: new Date() } }
      );
      const team = await notifier.notify(
        `✅ New paid booking ${booking._id}\n${booking.packageName} – ${inr(booking.amountInr)}\n` +
          `Client: ${customer?.name || 'Unknown'} (+${booking.phone})\n` +
          `Birth details: ${missing.length ? `missing ${missing.join(', ')}` : `${customer.birth.date} ${customer.birth.time} ${customer.birth.place}`}\n` +
          'Please schedule the consultation.'
      );
      const updated = { ...fresh, reportId: report?.id || null };
      bus.emitEvent({ kind: 'booking', booking: publicBooking(updated) });
      return {
        summary: `Booking ${booking._id} confirmed${report ? ', Kundli PDF generated' : ''}; team notified`,
        output: { reference: booking._id, status: 'confirmed', missingBirth: missing, report: report && { filename: report.filename, bytes: report.bytes }, team }
      };
    });
    return { ...output, report };
  }

  function publicBooking(doc) {
    return {
      reference: doc._id,
      phone: doc.phone,
      phoneMasked: maskPhone(doc.phone),
      name: doc.name || '',
      packageName: doc.packageName,
      amountInr: doc.amountInr,
      status: doc.status,
      paymentUrl: doc.paymentUrl,
      demo: Boolean(doc.demo),
      createdAt: doc.createdAt,
      paidAt: doc.paidAt || null,
      reportId: doc.reportId ? doc.reportId.toString() : null
    };
  }

  async function generateReply({ run, ctx, branch, facts, customer, recent }) {
    return run.step('generate', { branch, language: ctx.language, method: llm.enabled ? 'llm' : 'template' }, async () => {
      if (llm.enabled) {
        try {
          const system =
            `You are the WhatsApp assistant of ${config.brandName}, the Vedic astrology practice of ${config.astrologerName}.\n` +
            `${brandVoice}\n\nRules:\n` +
            `- Reply in ${LANGUAGE_LABEL[ctx.language] || 'English'}.\n` +
            '- WhatsApp style: short paragraphs, *single asterisks* for bold, at most 140 words, no headings or tables.\n' +
            '- Use only the FACTS below. Never invent planetary positions, dates, prices, links or policies.\n' +
            '- Never promise outcomes or give medical, legal or financial certainty.\n' +
            `- For detailed personal predictions, recommend a consultation with ${config.astrologerName}.\n` +
            '- If FACTS include a paymentUrl, include it exactly once.\n' +
            '- If FACTS list missing birth details, ask only for those.\n' +
            '- End with one short suggested next step.\n\n' +
            `FACTS (JSON):\n${JSON.stringify(facts)}`;
          const { content, usage, model } = await llm.chat({
            maxTokens: 450,
            messages: [
              { role: 'system', content: system },
              ...recent.slice(-8).map((m) => ({ role: m.author === 'customer' ? 'user' : 'assistant', content: m.text })),
              { role: 'user', content: ctx.text }
            ]
          });
          if (content) {
            return { summary: `Reply generated by ${model} (${usage?.total_tokens ?? '?'} tokens)`, output: { text: content, method: 'llm', usage } };
          }
        } catch (error) {
          run.log('warn', `LLM reply failed, using template: ${error.message}`, 'generate');
        }
      }
      const text = templateReply(branch, facts, customer, ctx);
      return { summary: 'Reply generated from template (demo mode)', output: { text, method: 'template' } };
    });
  }

  function templateReply(branch, facts, customer, ctx) {
    const first = (customer?.name || '').split(' ')[0];
    const hello = first ? `Namaste ${first} 🙏` : 'Namaste 🙏';
    const prices = config.packages.map((p) => `• *${p.name}* – ${inr(p.amountInr)}: ${p.summary}`).join('\n');
    const kbLine = facts.knowledge?.[0]?.text;
    const ask = (missing) =>
      `To prepare your chart I need your ${joinAnd(missing.map((m) => ({ date: 'date of birth', time: 'exact time of birth', place: 'place of birth', timezone: 'birth time zone (for births outside India)' })[m] || m))}.\n` +
      'Example: _12 Aug 1990, 10:30 am, Lucknow_';

    if (facts.specialRequest && ['faq', 'chart', 'question'].includes(branch)) {
      return `${hello}\n\n${facts.specialRequest.split(';')[0]}.\n\n${branch === 'chart' || /matching/i.test(facts.specialRequest) ? 'Reply *BOOK ADDITIONAL* to add your partner’s chart, or *BOOK PERSONAL* for a consultation.' : 'Reply *BOOK PERSONAL* to book a consultation.'}`;
    }
    if (branch === 'faq') {
      return kbLine
        ? `${hello}\n\n${kbLine}`
        : `${hello}\n\nWelcome to ${config.brandName}. I can share your basic Kundli (Lagna, Rashi, Nakshatra, dasha), answer questions about consultations, or help you book a session with ${config.astrologerName}.`;
    }
    if (branch === 'chart') {
      if (facts.missingBirthDetails?.length) return `${hello}\n\n${ask(facts.missingBirthDetails)}`;
      const c = facts.chart;
      return (
        `${hello}\n\nHere is your basic Kundli:\n` +
        `• *Lagna:* ${c.lagna}\n• *Rashi (Moon sign):* ${c.moonSign}\n• *Sun sign:* ${c.sunSign}\n• *Nakshatra:* ${c.nakshatra}\n` +
        (c.runningMahadasha ? `• *Mahadasha:* ${c.runningMahadasha}\n` : '') +
        (c.runningAntardasha ? `• *Antardasha:* ${c.runningAntardasha}\n` : '') +
        `\nThis is the foundation. ${config.astrologerName} reads it together with divisional charts and transits in a consultation.` +
        (facts.reportAttached ? '\n\nYour Kundli summary PDF is attached.' : '')
      );
    }
    if (branch === 'question') {
      const parts = [hello];
      if (kbLine) parts.push(kbLine);
      if (facts.chart?.runningMahadasha) {
        parts.push(`You are currently in *${facts.chart.runningMahadasha.split(' until')[0]} mahadasha*${facts.chart.runningAntardasha ? ` with *${facts.chart.runningAntardasha.split(' until')[0]} antardasha*` : ''}, which colours the timing of this question.`);
      } else if (facts.missingBirthDetails?.length) {
        parts.push(`For a personal answer, share your birth details. ${ask(facts.missingBirthDetails)}`);
      }
      parts.push(`A question like this deserves a proper reading of your chart. ${config.astrologerName} can guide you in a consultation.`);
      return parts.join('\n\n');
    }
    if (branch === 'pricing') {
      if (facts.booking?.paymentUrl) {
        return `${hello}\n\nHere is your secure payment link for *${facts.booking.packageName}* (${inr(facts.booking.amountInr)}):\n${facts.booking.paymentUrl}\n\nOnce paid, your booking is confirmed automatically and the team will share your slot.`;
      }
      return `${hello}\n\nConsultations with ${config.astrologerName}:\n${prices}\n\nAll sessions are online, in Hindi or English.`;
    }
    if (branch === 'payment') {
      const b = facts.booking;
      if (!b) return `${hello}\n\nI could not find a booking for this number yet. Reply *BOOK PERSONAL* or *BOOK SIGNATURE* to get a payment link, or *HUMAN* to reach the team.`;
      if (b.status === 'confirmed') return `${hello}\n\nYour booking *${b.reference}* for *${b.packageName}* is confirmed ✅. The team will share your consultation slot here.`;
      return `${hello}\n\nYour booking *${b.reference}* for *${b.packageName}* is awaiting payment.\nPay here: ${b.paymentUrl}\n\nIf you already paid, it can take a minute to reflect. Reply *HUMAN* if it does not update.`;
    }
    return `${hello}\n\nI have shared your message with ${config.astrologerName}'s team. A person will reply here shortly.`;
  }

  function suggestionFooter(branch, facts, text) {
    if (/\bBOOK\b|\bReply\b/i.test(text)) return '';
    if (branch === 'faq' || branch === 'question') return '\n\nReply *PRICE* to see consultation options.';
    if (branch === 'chart' && facts.chart && !facts.reportAttached) return '\n\nReply *BOOK SIGNATURE* for the full Kundali reading with Varshphal.';
    if (branch === 'pricing' && !facts.booking) return '\n\nReply *BOOK PERSONAL*, *BOOK SIGNATURE* or *BOOK ADDITIONAL* to get a payment link.';
    return '';
  }

  async function formatAndSend({ run, ctx, branch, facts, replyText, attachments = [] }) {
    const formatted = await run.step('format', { chars: replyText.length }, async () => {
      let text = formatForWhatsApp(replyText);
      text += suggestionFooter(branch, facts, text);
      const blog = facts.knowledge?.find((k) => k.url);
      if (blog && !text.includes(blog.url)) text += `\n\nRead more: ${blog.url}`;
      return { summary: `Formatted for WhatsApp (${text.length} chars${attachments.length ? `, ${attachments.length} attachment` : ''})`, output: { text, language: ctx.language } };
    });

    await run.step('send', { to: maskPhone(ctx.phone), channel: ctx.channel }, async () => {
      const live = ctx.channel === 'whatsapp' && whatsapp.enabled;
      const sent = live ? await whatsapp.sendText(ctx.phone, formatted.text) : { demo: true, id: null };
      await saveMessage({
        phone: ctx.phone,
        direction: 'out',
        author: 'bot',
        channel: ctx.channel,
        text: formatted.text,
        runId: run.id,
        waMessageId: sent.id || undefined,
        demo: !live
      });
      for (const file of attachments) {
        const doc = live
          ? await whatsapp.sendDocument(ctx.phone, file.buffer, file.filename, 'Your BHAVISHYAT Kundli summary')
          : { demo: true, id: null };
        await saveMessage({
          phone: ctx.phone,
          direction: 'out',
          author: 'bot',
          channel: ctx.channel,
          text: `📄 ${file.filename}`,
          attachment: { reportId: file.id.toString(), filename: file.filename, bytes: file.bytes },
          runId: run.id,
          waMessageId: doc.id || undefined,
          demo: !live
        });
      }
      return {
        summary: live ? `Sent on WhatsApp to ${maskPhone(ctx.phone)}` : `Delivered to simulator (demo – not sent to WhatsApp)`,
        output: { live, messageId: sent.id, attachments: attachments.map((a) => a.filename) }
      };
    });
  }

  async function escalate(run, ctx, customer, reason) {
    return run.step('handoff', { reason }, async () => {
      const now = new Date();
      await customers.updateOne(
        { _id: ctx.phone },
        { $set: { handoff: { active: true, reason, at: now, lastTeamAlertAt: now }, updatedAt: now } }
      );
      const recent = await history(ctx.phone);
      const transcript = recent.slice(-6).map((m) => `${m.author === 'customer' ? '👤' : '🤖'} ${m.text}`).join('\n');
      const team = await notifier.notify(
        `🙋 Human handoff needed\nClient: ${customer?.name || 'Unknown'} (+${ctx.phone})\nReason: ${reason}\n\nRecent chat:\n${transcript}`
      );
      bus.emitEvent({ kind: 'handoff', phone: ctx.phone, active: true, reason });
      return { summary: `Escalated to team: ${reason}`, output: { reason, team } };
    });
  }

  async function processInbound(msg, source) {
    const channel = source === 'whatsapp' ? 'whatsapp' : 'simulator';
    const run = bus.startRun({ phone: msg.from, name: msg.name, source, text: msg.text });
    const ctx = { phone: msg.from, channel, text: '', language: 'en' };
    try {
      const received = await run.step(
        'receive',
        { from: maskPhone(msg.from), type: msg.type, waMessageId: msg.waMessageId },
        async () => {
          const dup = msg.waMessageId && (await messages.findOne({ waMessageId: msg.waMessageId }, { projection: { _id: 1 } }));
          if (dup) return { status: 'skipped', summary: 'Duplicate webhook delivery ignored', output: { duplicate: true } };
          if (channel === 'whatsapp') whatsapp.markRead(msg.waMessageId).catch(() => {});
          return {
            summary: `Message received from ${maskPhone(msg.from)} via ${channel === 'whatsapp' ? 'WhatsApp webhook (signature verified)' : 'live simulator'}`,
            output: { duplicate: false, type: msg.type, waMessageId: msg.waMessageId }
          };
        }
      );
      if (received.duplicate) {
        await run.finish('done');
        return;
      }

      const parsed = await run.step('parse', { raw: msg.text, type: msg.type }, async () => {
        const media = msg.type && msg.type !== 'text' ? { type: msg.type, mimeType: msg.mimeType, filename: msg.filename, mediaId: msg.mediaId } : null;
        let text = normalizeText(msg.text);
        if (!text && media) text = `[${media.type} received${media.filename ? `: ${media.filename}` : ''}]`;
        const language = detectLanguage(text);
        return {
          summary: `Parsed ${text.length} chars, language ${language}${media ? `, media ${media.type}` : ''}`,
          output: { text, language, media, sender: { phone: maskPhone(msg.from), name: msg.name || null } }
        };
      });
      ctx.text = parsed.text;
      ctx.language = parsed.language;

      let loaded = null;
      const contextOut = await run.step('context', { phone: maskPhone(msg.from) }, async () => {
        const now = new Date();
        const existing = await customers.findOne({ _id: msg.from });
        const set = { lastSeenAt: now, updatedAt: now, channel, language: ctx.language };
        if (msg.name) set.name = msg.name;
        await customers.updateOne(
          { _id: msg.from },
          {
            $set: set,
            $setOnInsert: { phone: msg.from, createdAt: now, birth: null, stage: null, handoff: { active: false } },
            $inc: { messageCount: 1 }
          },
          { upsert: true }
        );
        let saved;
        try {
          saved = await saveMessage({
            phone: msg.from,
            direction: 'in',
            author: 'customer',
            channel,
            text: ctx.text,
            type: msg.type,
            waMessageId: msg.waMessageId || undefined,
            runId: run.id,
            createdAt: msg.timestamp instanceof Date ? msg.timestamp : now
          });
        } catch (error) {
          if (error?.code === 11000) return { status: 'skipped', summary: 'Duplicate message ignored', output: { duplicate: true } };
          throw error;
        }
        const customer = await customers.findOne({ _id: msg.from });
        const recent = await history(msg.from, saved._id);
        loaded = { customer, recent };
        return {
          summary: `${existing ? 'Returning' : 'New'} customer, ${recent.length} past messages loaded`,
          output: {
            duplicate: false,
            isNew: !existing,
            name: customer.name || null,
            messageCount: customer.messageCount,
            birth: customer.birth,
            stage: customer.stage,
            handoffActive: Boolean(customer.handoff?.active),
            historyCount: recent.length,
            lastMessages: recent.slice(-3).map((m) => `${m.author}: ${m.text}`)
          }
        };
      });
      if (contextOut.duplicate) {
        await run.finish('done');
        return;
      }
      let customer = loaded.customer;
      const recent = loaded.recent;

      if (customer.handoff?.active) {
        await run.step('handoff', { reason: customer.handoff.reason }, async () => {
          const last = customer.handoff.lastTeamAlertAt ? new Date(customer.handoff.lastTeamAlertAt).getTime() : 0;
          let team = null;
          if (Date.now() - last > TEAM_REMINDER_MS) {
            team = await notifier.notify(`💬 ${customer.name || 'Client'} (+${ctx.phone}) wrote while waiting for the team:\n${ctx.text}`);
            await customers.updateOne({ _id: ctx.phone }, { $set: { 'handoff.lastTeamAlertAt': new Date() } });
          }
          return { status: 'warn', summary: 'Conversation is with the team – bot paused', output: { team } };
        });
        await run.finish('paused');
        return;
      }

      const cls = await run.step('classify', { text: ctx.text }, async () => {
        let result = null;
        if (llm.enabled) {
          try {
            result = await llmClassify(ctx.text, recent, customer);
          } catch (error) {
            run.log('warn', `LLM classifier failed, using rules: ${error.message}`, 'classify');
          }
        }
        const heuristic = parseBirthDetails(ctx.text) || bareplace(ctx.text, customer);
        if (!result) result = rulesClassify(ctx.text, customer, acceptBirth(ctx.text, customer, heuristic, null));
        const candidate = result.method === 'llm' ? sanitizeBirth(result.birth) || heuristic : heuristic;
        const { birth, changed } = mergeBirth(customer.birth, acceptBirth(ctx.text, customer, candidate, result.intent));
        if (changed) {
          await customers.updateOne({ _id: ctx.phone }, { $set: { birth, updatedAt: new Date() } });
          customer = { ...customer, birth };
        }
        if (customer.stage === 'awaiting_birth' && changed && result.intent !== 'other') result.intent = 'birth_chart';
        if (result.language) ctx.language = result.language;
        run.setIntent(result.intent);
        return {
          summary: `Intent ${result.intent} (${Math.round(result.confidence * 100)}%) via ${result.method === 'llm' ? 'LLM' : 'rules'}${changed ? '; birth details updated' : ''}`,
          output: { ...result, birthUpdated: changed, birth: customer.birth }
        };
      });

      let branch = BRANCH_BY_INTENT[cls.intent] || 'other';
      if (cls.wantsHuman) branch = 'other';
      await run.step('route', { intent: cls.intent, wantsHuman: cls.wantsHuman }, async () => ({
        summary: `Routed to ${BRANCH_LABEL[branch]}`,
        output: { branch }
      }));
      await run.step(`br_${branch}`, { intent: cls.intent }, async () => ({ summary: `${BRANCH_LABEL[branch]} branch`, output: { branch } }));
      await customers.updateOne({ _id: ctx.phone }, { $set: { lastIntent: cls.intent } });

      const facts = {
        customerName: customer.name || null,
        intent: cls.intent,
        prices: config.packages.map((p) => ({ name: p.name, amount: inr(p.amountInr), summary: p.summary })),
        bookCommands: 'Reply BOOK PERSONAL, BOOK SIGNATURE or BOOK ADDITIONAL to get a payment link.',
        contactEmail: config.contactEmail
      };
      const special = detectSpecialRequest(ctx.text);
      if (special) {
        facts.specialRequest =
          special === 'matching'
            ? `Kundli matching (Guna Milan) is prepared personally by ${config.astrologerName} from both charts; it is not calculated automatically. Suggest the Additional Kundali Chart for the partner with a consultation.`
            : `Muhurat (auspicious timing) is selected personally by ${config.astrologerName} for the specific event; it is not calculated automatically. Suggest a Personal Consultation.`;
      }
      const attachments = [];

      const runKb = async () => {
        const hits = await run.step('kb', { query: ctx.text }, async () => {
          const results = await kb.search(ctx.text);
          return {
            status: results.length ? 'done' : 'warn',
            summary: results.length ? `Retrieved ${results.length} passages: ${results.map((r) => r.title).join(' · ')}` : 'No relevant passage found',
            output: results.map((r) => ({ title: r.title, source: r.source, score: r.score, url: r.url ? `${publicOrigin}${r.url}` : null, text: r.body.slice(0, 700) }))
          };
        });
        facts.knowledge = hits;
      };

      const runCalc = async ({ optional = false } = {}) => {
        const out = await run.step('calc', { birth: customer.birth }, async () => {
          const result = await chartFor(customer);
          if (!result.chart) {
            if (result.placeNotFound) {
              await customers.updateOne({ _id: ctx.phone }, { $set: { 'birth.place': null } });
              customer = { ...customer, birth: { ...customer.birth, place: null } };
            }
            return {
              status: 'warn',
              summary: result.placeNotFound ? `Could not locate "${customer.birth?.place}"` : `Birth details missing: ${result.missing.join(', ')}`,
              output: { missing: result.missing, transits: currentTransits() }
            };
          }
          const pendingBooking = await bookings.findOne(
            { phone: ctx.phone, status: 'confirmed', reportId: { $exists: false } },
            { sort: { createdAt: -1 } }
          );
          let report = null;
          if (pendingBooking) {
            report = await buildReport({ customer, chart: result.chart, place: result.place, booking: pendingBooking });
            attachments.push(report);
            await customers.updateOne({ _id: ctx.phone }, { $set: { stage: 'booked' } });
          }
          return {
            summary: `Chart computed: Lagna ${result.chart.lagna.english}, Rashi ${result.chart.moonSign.english}, ${result.chart.nakshatra.name}${report ? '; Kundli PDF generated for booking' : ''}`,
            output: { chart: result.chart, place: result.place, report: report && { filename: report.filename, bytes: report.bytes } }
          };
        });
        if (out.chart) {
          facts.chart = chartFacts(out.chart, out.place);
          facts.reportAttached = attachments.length > 0;
        } else {
          facts.transitsToday = out.transits && `Sun in ${out.transits.sun.english}, Moon in ${out.transits.moon.english}`;
          if (!optional || out.missing?.length < 3) facts.missingBirthDetails = out.missing;
          if (!optional) await customers.updateOne({ _id: ctx.phone }, { $set: { stage: 'awaiting_birth' } });
        }
      };

      if (branch === 'faq') {
        await runKb();
      } else if (branch === 'chart') {
        await runCalc();
      } else if (branch === 'question') {
        await runKb();
        await runCalc({ optional: true });
      } else if (branch === 'pricing') {
        await runKb();
        if (cls.bookingIntent && (cls.packageCode || /\bbook\b|बुक/i.test(ctx.text))) {
          const pkg = packageFor(cls.packageCode);
          const booking = await run.step('pay_link', { package: pkg.code }, async () => {
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const existing = await bookings.findOne(
              { phone: ctx.phone, packageCode: pkg.code, status: 'pending', createdAt: { $gte: since } },
              { sort: { createdAt: -1 } }
            );
            if (existing) {
              return { summary: `Reusing pending link for ${existing._id}`, output: publicBooking(existing) };
            }
            const reference = `BHV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
            const link = await razorpay.createPaymentLink({
              amountInr: pkg.amountInr,
              description: `${config.brandName} – ${pkg.name}`,
              name: customer.name,
              phone: ctx.phone,
              referenceId: reference,
              notes: { phone: ctx.phone, package: pkg.code }
            });
            const doc = {
              _id: reference,
              phone: ctx.phone,
              name: customer.name || '',
              packageCode: pkg.code,
              packageName: pkg.name,
              amountInr: pkg.amountInr,
              status: 'pending',
              paymentLinkId: link.id,
              paymentUrl: link.shortUrl,
              demo: link.demo,
              createdAt: new Date()
            };
            await bookings.insertOne(doc);
            bus.emitEvent({ kind: 'booking', booking: publicBooking(doc) });
            return {
              summary: `${link.demo ? 'Demo' : 'Razorpay'} payment link created for ${pkg.name} (${inr(pkg.amountInr)})`,
              output: publicBooking(doc)
            };
          });
          facts.booking = booking;
        }
      } else if (branch === 'payment') {
        let paidNow = null;
        const booking = await run.step('pay_verify', { phone: maskPhone(ctx.phone) }, async () => {
          const latest = await bookings.findOne({ phone: ctx.phone }, { sort: { createdAt: -1 } });
          if (!latest) return { status: 'warn', summary: 'No booking found for this number', output: null };
          if (latest.status === 'pending' && latest.paymentLinkId) {
            const remote = await razorpay.fetchPaymentLink(latest.paymentLinkId).catch((error) => {
              run.log('warn', `Could not check Razorpay: ${error.message}`, 'pay_verify');
              return null;
            });
            if (remote?.status === 'paid') {
              paidNow = { booking: latest, paymentId: remote.paymentId };
              return { summary: `Razorpay reports ${latest._id} as paid`, output: { ...publicBooking(latest), status: 'paid' } };
            }
          }
          return { summary: `Booking ${latest._id} is ${latest.status}`, output: publicBooking(latest) };
        });
        if (paidNow) {
          const confirmed = await confirmBooking(run, paidNow.booking, { paymentId: paidNow.paymentId, via: 'status check' });
          if (confirmed.report) attachments.push(confirmed.report);
          facts.booking = { ...booking, status: 'confirmed' };
          facts.missingBirthDetails = confirmed.missingBirth;
        } else {
          facts.booking = booking;
        }
      } else {
        const reason = cls.wantsHuman ? 'Customer asked for a human' : 'Out-of-scope or unclear request';
        await escalate(run, ctx, customer, reason);
        facts.handoff = true;
      }

      const reply = await generateReply({ run, ctx, branch, facts, customer, recent });
      await formatAndSend({ run, ctx, branch, facts, replyText: reply.text, attachments });
      await run.finish('done');
    } catch (error) {
      run.log('error', `Pipeline failed: ${error.message}`);
      await run.finish('error');
      if (ctx.text && ctx.channel === 'whatsapp' && whatsapp.enabled) {
        whatsapp
          .sendText(ctx.phone, `Sorry, something went wrong on our side. ${config.astrologerName}'s team has been notified and will reply here.`)
          .catch(() => {});
      }
      notifier.notify(`⚠️ Assistant error for +${ctx.phone}: ${error.message}`).catch(() => {});
    }
  }

  async function processPayment(reference, { paymentId = null, via }) {
    const booking = await bookings.findOne({ _id: reference });
    if (!booking) throw new Error('Booking not found.');
    const customer = await customers.findOne({ _id: booking.phone });
    const run = bus.startRun({ phone: booking.phone, name: customer?.name, source: 'payment', text: `Payment for ${reference}` });
    const ctx = { phone: booking.phone, channel: customer?.channel || 'simulator', text: '', language: customer?.language || 'en' };
    run.setIntent('payment_received');
    try {
      const check = await run.step('pay_verify', { reference, via }, async () => {
        if (booking.status === 'confirmed') {
          return { status: 'skipped', summary: `${reference} already confirmed – ignoring repeat event`, output: { already: true } };
        }
        return { summary: `Payment verified for ${reference} via ${via}`, output: { already: false, reference, paymentId } };
      });
      if (check.already) {
        await run.finish('done');
        return { already: true };
      }
      const confirmed = await confirmBooking(run, booking, { paymentId, via });
      const fresh = await customers.findOne({ _id: booking.phone });
      const first = (fresh?.name || '').split(' ')[0];
      const missing = confirmed.missingBirth || [];
      const text =
        `Namaste${first ? ` ${first}` : ''} 🙏\n\nPayment received – your *${booking.packageName}* booking *${reference}* is confirmed ✅\n\n` +
        (missing.length
          ? `Please share your ${joinAnd(missing)} of birth so ${config.astrologerName} can prepare your chart. Example: _12 Aug 1990, 10:30 am, Lucknow_\n\n`
          : 'Your Kundli summary PDF is attached.\n\n') +
        'Also share 2–3 preferred time windows for the consultation and the team will confirm your slot here.';
      await run.step('generate', { template: 'booking-confirmation' }, async () => ({ summary: 'Booking confirmation prepared', output: { text } }));
      await formatAndSend({ run, ctx, branch: 'payment', facts: {}, replyText: text, attachments: confirmed.report ? [confirmed.report] : [] });
      await run.finish('done');
      return { already: false };
    } catch (error) {
      run.log('error', `Payment flow failed: ${error.message}`);
      await run.finish('error');
      throw error;
    }
  }

  return {
    ensureIndexes,
    handleInbound(msg, { source }) {
      return enqueue(msg.from, () => processInbound(msg, source));
    },
    async markBookingPaid(reference, options) {
      const booking = await bookings.findOne({ _id: reference }, { projection: { phone: 1 } });
      if (!booking) throw new Error('Booking not found.');
      return enqueue(booking.phone, () => processPayment(reference, options));
    },
    async bookingByPaymentLink(linkId) {
      return bookings.findOne({ paymentLinkId: linkId });
    },
    async staffReply(phone, text) {
      const customer = await customers.findOne({ _id: phone });
      if (!customer) throw new Error('Customer not found.');
      const body = normalizeText(text);
      if (!body) throw new Error('Message is empty.');
      const live = customer.channel === 'whatsapp' && whatsapp.enabled;
      const sent = live ? await whatsapp.sendText(phone, body) : { demo: true, id: null };
      bus.log('info', `Team replied to ${maskPhone(phone)}${live ? ' on WhatsApp' : ' (simulator)'}`, { step: 'handoff' });
      return publicMessage(
        await saveMessage({ phone, direction: 'out', author: 'team', channel: customer.channel || 'simulator', text: body, waMessageId: sent.id || undefined, demo: !live })
      );
    },
    async setHandoff(phone, active) {
      const update = active
        ? { handoff: { active: true, reason: 'Taken over by team', at: new Date(), lastTeamAlertAt: new Date() } }
        : { 'handoff.active': false, 'handoff.resolvedAt': new Date() };
      const result = await customers.updateOne({ _id: phone }, { $set: update });
      if (!result.matchedCount) throw new Error('Customer not found.');
      bus.emitEvent({ kind: 'handoff', phone, active });
      bus.log('info', `Handoff ${active ? 'started' : 'resolved'} for ${maskPhone(phone)}`, { step: 'handoff' });
    },
    publicBooking,
    publicMessage
  };
}
