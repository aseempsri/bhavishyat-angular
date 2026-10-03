const STOPWORDS = new Set(
  ('a an and are as at be by can do does for from has have how i in is it its me my of on or our so ' +
    'that the this to was what when where which who why will with you your yours about kya hai ka ki ke ' +
    'mera meri mujhe se aur please tell know want would like है का की के में मेरी मेरा मुझे क्या कब होगी होगा और से को')
    .split(' ')
);

const SEED = [
  {
    key: 'what-is-bhavishyat',
    title: 'What is BHAVISHYAT?',
    tags: ['about', 'bhavishyat', 'practice'],
    body:
      'BHAVISHYAT is a premium Vedic astrology practice by B S Shubhram focused on life planning and decision timing: career moves, marriage, business, property and major transitions, with structured chart-based guidance.'
  },
  {
    key: 'difference',
    title: 'How is this different from a typical astrology reading?',
    tags: ['different', 'approach'],
    body:
      'BHAVISHYAT focuses on when to act and when to wait. Consultations are detailed, conversational and built around your real questions, not a scripted report.'
  },
  {
    key: 'offerings',
    title: 'Consultations and prices',
    tags: ['price', 'pricing', 'cost', 'fees', 'charges', 'package', 'consultation', 'kitna', 'paisa'],
    body:
      'Personal Consultation from ₹5,100 for focused guidance on specific life areas. Signature Kundali Experience from ₹8,100 with in-depth chart analysis plus a digital and physical Kundali dossier and Varshphal. Additional Kundali charts at ₹3,100 per chart for partners or family members.'
  },
  {
    key: 'birth-details',
    title: 'Birth details needed',
    tags: ['birth', 'details', 'time', 'date', 'place', 'rectification'],
    body:
      'Accurate date, time and place of birth are essential. If the birth time is approximate, mention it; Shubhram will advise whether rectification is needed before the consultation.'
  },
  {
    key: 'languages',
    title: 'Languages',
    tags: ['hindi', 'english', 'language'],
    body: 'Consultations are offered in Hindi, English, or a comfortable mix of both.'
  },
  {
    key: 'booking',
    title: 'How to book',
    tags: ['book', 'booking', 'slot', 'appointment', 'schedule'],
    body:
      'Reply BOOK PERSONAL, BOOK SIGNATURE or BOOK ADDITIONAL on WhatsApp to receive a secure payment link. After payment the booking is confirmed and the team shares the consultation slot.'
  },
  {
    key: 'online',
    title: 'Online or in person',
    tags: ['online', 'video', 'call', 'person', 'offline', 'visit'],
    body: 'Consultations are conducted online, with the same depth as an in-person session.'
  },
  {
    key: 'family-charts',
    title: 'Partner or family charts',
    tags: ['family', 'partner', 'spouse', 'child', 'matching', 'compatibility', 'marriage'],
    body:
      'Additional Kundali charts can be added for spouses, partners, children or parents when relevant, for example marriage compatibility or family decisions.'
  },
  {
    key: 'varshphal',
    title: 'What is Varshphal?',
    tags: ['varshphal', 'varshfal', 'annual', 'yearly', 'birthday', 'solar', 'return'],
    body:
      'Varshphal is the yearly chart cast for the moment the Sun returns to its birth position around your birthday. The birth chart is the long-term plan; Varshphal is a closer look at the year ahead for career, business, relationships and personal goals. It offers perspective for reflection and does not guarantee outcomes.'
  },
  {
    key: 'dasha',
    title: 'What is a dasha?',
    tags: ['dasha', 'mahadasha', 'antardasha', 'period', 'vimshottari'],
    body:
      'Vimshottari dasha divides life into planetary periods based on the Moon nakshatra at birth. The running mahadasha and antardasha colour the themes of that time; a consultation reads them together with the full chart and transits.'
  },
  {
    key: 'remedies',
    title: 'Remedies',
    tags: ['remedy', 'remedies', 'upay', 'gemstone', 'mantra', 'puja', 'seva'],
    body:
      'Remedies such as mantra, seva and lifestyle practices are suggested only after reading the full chart. Gemstones are never recommended without a proper chart analysis.'
  },
  {
    key: 'privacy',
    title: 'Confidentiality',
    tags: ['privacy', 'private', 'confidential', 'data', 'safe'],
    body: 'Birth details and everything discussed are confidential and never shared without explicit consent.'
  }
];

const HINDI_TAGS = {
  offerings: ['कीमत', 'फीस', 'शुल्क', 'परामर्श', 'दाम'],
  'birth-details': ['जन्म', 'समय', 'स्थान', 'कुंडली'],
  languages: ['हिंदी', 'भाषा'],
  booking: ['बुक', 'बुकिंग', 'समय'],
  'family-charts': ['शादी', 'विवाह', 'मिलान', 'परिवार'],
  varshphal: ['वर्षफल', 'साल'],
  dasha: ['दशा', 'महादशा', 'अंतर्दशा'],
  remedies: ['उपाय', 'रत्न', 'मंत्र'],
  privacy: ['गोपनीय']
};

function tokens(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function inr(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export function createKnowledgeBase(db, config) {
  const kb = db.collection('assistant_knowledge');
  const posts = db.collection('blog_posts');
  let cache = { at: 0, docs: [] };

  async function seed() {
    const now = new Date();
    for (const doc of SEED) {
      const body =
        doc.key === 'offerings'
          ? config.packages.map((p) => `${p.name}: ${inr(p.amountInr)}. ${p.summary}`).join(' ')
          : doc.body;
      await kb.updateOne(
        { key: doc.key },
        {
          $set: { ...doc, body, tags: [...doc.tags, ...(HINDI_TAGS[doc.key] || [])], source: 'faq', updatedAt: now },
          $setOnInsert: { createdAt: now }
        },
        { upsert: true }
      );
    }
  }

  async function load() {
    if (Date.now() - cache.at < 60_000) return cache.docs;
    const [kbDocs, blogDocs] = await Promise.all([
      kb.find({}).toArray(),
      posts.find({ published: true }, { projection: { headline: 1, body: 1, slug: 1 } }).toArray()
    ]);
    const docs = [
      ...kbDocs.map((d) => ({
        id: d.key,
        source: 'faq',
        title: d.title,
        body: d.body,
        tags: d.tags || []
      })),
      ...blogDocs.map((d) => ({
        id: d.slug,
        source: 'blog',
        title: d.headline,
        body: String(d.body || '').slice(0, 2400),
        url: `/blog/${d.slug}`,
        tags: []
      }))
    ].map((d) => ({ ...d, terms: tokens(`${d.title} ${d.title} ${d.tags.join(' ')} ${d.tags.join(' ')} ${d.body}`) }));
    cache = { at: Date.now(), docs };
    return docs;
  }

  async function search(query, limit = 3) {
    const docs = await load();
    const q = [...new Set(tokens(query))];
    if (q.length === 0) return [];
    const df = new Map();
    for (const term of q) df.set(term, docs.filter((d) => d.terms.includes(term)).length);
    const scored = docs.map((d) => {
      let score = 0;
      let matched = 0;
      for (const term of q) {
        const tf = d.terms.filter((t) => t === term).length;
        if (!tf) continue;
        matched += 1;
        const idf = Math.log(1 + docs.length / (df.get(term) || 1));
        score += (tf / (tf + 1.2)) * idf;
      }
      return { ...d, score, matched };
    });
    return scored
      .filter((d) => (d.matched >= 2 && d.score > 0.9) || d.score > 1.4 || (q.length === 1 && d.score > 0.6))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ terms, matched, ...rest }) => ({ ...rest, score: Number(rest.score.toFixed(2)) }));
  }

  function invalidate() {
    cache = { at: 0, docs: [] };
  }

  return { seed, search, invalidate };
}
