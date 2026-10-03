function env(name, fallback = '') {
  return (process.env[name] ?? fallback).toString().trim();
}

function list(name) {
  return env(name)
    .split(',')
    .map((item) => item.replace(/\D/g, ''))
    .filter(Boolean);
}

function int(name, fallback) {
  const value = Number.parseInt(env(name), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function loadAssistantConfig() {
  const whatsapp = {
    token: env('WHATSAPP_ACCESS_TOKEN'),
    phoneNumberId: env('WHATSAPP_PHONE_NUMBER_ID'),
    appSecret: env('WHATSAPP_APP_SECRET'),
    verifyToken: env('WHATSAPP_VERIFY_TOKEN'),
    graphVersion: env('WHATSAPP_GRAPH_VERSION', 'v21.0'),
    templateName: env('WHATSAPP_TEMPLATE_NAME'),
    templateLang: env('WHATSAPP_TEMPLATE_LANG', 'en')
  };

  const llm = {
    apiKey: env('LLM_API_KEY'),
    baseUrl: env('LLM_BASE_URL', 'https://api.openai.com/v1').replace(/\/$/, ''),
    model: env('LLM_MODEL', 'gpt-4o-mini'),
    classifierModel: env('LLM_CLASSIFIER_MODEL') || env('LLM_MODEL', 'gpt-4o-mini')
  };

  const razorpay = {
    keyId: env('RAZORPAY_KEY_ID'),
    keySecret: env('RAZORPAY_KEY_SECRET'),
    webhookSecret: env('RAZORPAY_WEBHOOK_SECRET')
  };

  const team = {
    whatsappNumbers: list('TEAM_WHATSAPP_NUMBERS'),
    webhookUrl: env('TEAM_WEBHOOK_URL')
  };

  const packages = [
    {
      code: 'personal',
      name: 'Personal Consultation',
      amountInr: int('PRICE_PERSONAL_INR', 5100),
      summary: 'Focused guidance on specific life areas.'
    },
    {
      code: 'signature',
      name: 'Signature Kundali Experience',
      amountInr: int('PRICE_SIGNATURE_INR', 8100),
      summary: 'In-depth chart analysis with a digital and physical Kundali dossier, including Varshphal.'
    },
    {
      code: 'additional',
      name: 'Additional Kundali Chart',
      amountInr: int('PRICE_ADDITIONAL_INR', 3100),
      summary: 'An extra chart for a partner or family member.'
    }
  ];

  return {
    whatsapp,
    llm,
    razorpay,
    team,
    packages,
    brandName: env('ASSISTANT_BRAND_NAME', 'BHAVISHYAT'),
    astrologerName: env('ASSISTANT_ASTROLOGER_NAME', 'B S Shubhram'),
    contactEmail: env('ASSISTANT_CONTACT_EMAIL', 'connect@bhavishyat.in'),
    geocodeUserAgent: env('GEOCODE_USER_AGENT', 'bhavishyat-assistant/1.0 (connect@bhavishyat.in)'),
    historyLimit: int('ASSISTANT_HISTORY_LIMIT', 12),
    enabled: {
      whatsapp: Boolean(whatsapp.token && whatsapp.phoneNumberId),
      whatsappWebhook: Boolean(whatsapp.verifyToken && whatsapp.appSecret),
      llm: Boolean(llm.apiKey),
      razorpay: Boolean(razorpay.keyId && razorpay.keySecret),
      razorpayWebhook: Boolean(razorpay.webhookSecret),
      teamWhatsApp: team.whatsappNumbers.length > 0,
      teamWebhook: Boolean(team.webhookUrl)
    }
  };
}

export function integrationStatus(config) {
  const e = config.enabled;
  return [
    {
      id: 'whatsapp',
      label: 'WhatsApp Cloud API',
      live: e.whatsapp && e.whatsappWebhook,
      detail: e.whatsapp && e.whatsappWebhook
        ? 'Receiving and sending real WhatsApp messages.'
        : 'Demo mode: use the simulator. Replies are shown here, not sent.'
    },
    {
      id: 'llm',
      label: 'LLM (intent + replies)',
      live: e.llm,
      detail: e.llm
        ? `Using ${config.llm.model}.`
        : 'Demo mode: keyword classifier and English template replies. Hindi/Hinglish replies need the LLM.'
    },
    {
      id: 'razorpay',
      label: 'Razorpay payments',
      live: e.razorpay && e.razorpayWebhook,
      detail: e.razorpay && e.razorpayWebhook
        ? 'Creating real payment links and verifying webhooks.'
        : 'Demo mode: payment links are simulated. Use "Mark paid" to test.'
    },
    {
      id: 'team',
      label: 'Team handoff alerts',
      live: e.teamWhatsApp || e.teamWebhook,
      detail: e.teamWhatsApp || e.teamWebhook
        ? 'Alerts go to the team on escalation and booking.'
        : 'Demo mode: alerts appear in the logs only.'
    },
    {
      id: 'mongodb',
      label: 'MongoDB (customer context)',
      live: true,
      detail: 'Customers, chat history, runs and bookings are stored.'
    },
    {
      id: 'astro',
      label: 'Calculation engine',
      live: true,
      detail: 'Built-in sidereal (Lahiri) Lagna, Rashi, Nakshatra and Vimshottari dasha.'
    }
  ];
}
