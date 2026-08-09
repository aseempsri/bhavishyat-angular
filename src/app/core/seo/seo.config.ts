export interface PageSeo {
  title: string;
  description: string;
  keywords?: string;
  /** Path under site origin, e.g. /kundali — used for canonical & og:url */
  path: string;
  ogImage?: string;
  robots?: string;
  ogType?: string;
}

export const SITE_ORIGIN = 'https://bhavishyat.in';
export const SITE_NAME = 'BHAVISHYAT';
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/assets/new-hero.png`;
export const DEFAULT_LOGO = `${SITE_ORIGIN}/assets/main_logo-P.png`;

export const DEFAULT_SEO: PageSeo = {
  path: '/',
  title: 'BHAVISHYAT | Vedic Astrology, Kundali & Cosmic Guidance',
  description:
    'BHAVISHYAT offers Vedic astrology, personalized kundali analysis, daily panchang, remedies, seva, and Gurukul class recordings to illuminate your cosmic path.',
  keywords:
    'BHAVISHYAT, Vedic astrology, kundali, janam kundli, daily panchang, astrology classes, Gurukul, remedies, seva, shinrin yoku, aarohanam, birth chart',
  ogImage: DEFAULT_OG_IMAGE,
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  ogType: 'website'
};

/** Route path (Angular path string) → SEO. Empty string = home. */
export const ROUTE_SEO: Record<string, PageSeo> = {
  '': {
    ...DEFAULT_SEO,
    path: '/'
  },
  'daily-panchang': {
    path: '/daily-panchang',
    title: 'Daily Panchang | Auspicious Timings & Cosmic Calendar | BHAVISHYAT',
    description:
      'Check today’s Vedic panchang with tithi, nakshatra, yoga, karana, and muhurat guidance from BHAVISHYAT — your daily cosmic calendar.',
    keywords:
      'daily panchang, tithi, nakshatra, muhurat, Vedic calendar, Hindu calendar, BHAVISHYAT',
    ogImage: DEFAULT_OG_IMAGE
  },
  'shinrin-yoku': {
    path: '/shinrin-yoku',
    title: 'Shinrin-Yoku Forest Bathing Retreats | BHAVISHYAT',
    description:
      'Experience Shinrin-Yoku forest bathing with BHAVISHYAT — nature immersion for calm, clarity, and reconnection with the living world.',
    keywords: 'shinrin-yoku, forest bathing, nature retreat, wellness, BHAVISHYAT',
    ogImage: DEFAULT_OG_IMAGE
  },
  'escape-retreats': {
    path: '/escape-retreats',
    title: 'Escape Retreats | Sacred Getaways & Cosmic Renewal | BHAVISHYAT',
    description:
      'Join BHAVISHYAT Escape Retreats — restorative getaways blending stillness, nature, and Vedic wisdom for inner renewal.',
    keywords: 'astrology retreat, escape retreat, spiritual getaway, BHAVISHYAT',
    ogImage: DEFAULT_OG_IMAGE
  },
  kundali: {
    path: '/kundali',
    title: 'Kundali Analysis | Birth Chart & Planetary Insights | BHAVISHYAT',
    description:
      'Explore personalized kundali and birth chart insights with BHAVISHYAT — planets, houses, dasha, and Vedic guidance for your life path.',
    keywords:
      'kundali, janam kundli, birth chart, Vedic astrology chart, dasha, planetary positions, BHAVISHYAT',
    ogImage: DEFAULT_OG_IMAGE
  },
  'class-recordings': {
    path: '/class-recordings',
    title: 'Gurukul Class Recordings | Learn Vedic Astrology | BHAVISHYAT',
    description:
      'Watch BHAVISHYAT Gurukul class recordings on Vedic astrology — free lessons covering charts, planets, houses, and cosmic wisdom.',
    keywords:
      'astrology classes, Gurukul, Vedic astrology course, astrology YouTube, Bhavishyatastro, BHAVISHYAT',
    ogImage: DEFAULT_OG_IMAGE
  },
  'house-signification': {
    path: '/house-signification',
    title: 'House Signification in Vedic Astrology | BHAVISHYAT',
    description:
      'Learn the meaning of the twelve houses in Vedic astrology — significations for career, relationships, health, and destiny with BHAVISHYAT.',
    keywords: 'house signification, bhavas, twelve houses, Vedic astrology, BHAVISHYAT',
    ogImage: DEFAULT_OG_IMAGE
  },
  'remedies-seva': {
    path: '/remedies-seva',
    title: 'Astrological Remedies & Seva | Naula, Gaushala, Temple | BHAVISHYAT',
    description:
      'Discover Vedic remedies and seva with BHAVISHYAT — naula dhara, gaushala, temple seva, tree plantation, and lagna-based guidance.',
    keywords:
      'astrology remedies, upay, seva, gaushala, temple seva, naula, tree plantation, BHAVISHYAT',
    ogImage: DEFAULT_OG_IMAGE
  },
  aarohanam: {
    path: '/aarohanam',
    title: 'Aarohanam | Events, Articles & Ascending Path | BHAVISHYAT',
    description:
      'Explore Aarohanam with BHAVISHYAT — events, articles, and practices for spiritual ascent guided by Vedic insight.',
    keywords: 'aarohanam, spiritual events, Vedic articles, BHAVISHYAT',
    ogImage: DEFAULT_OG_IMAGE
  },
  '**': {
    path: '/',
    title: 'Page Not Found | BHAVISHYAT',
    description: 'This page could not be found. Return to BHAVISHYAT for Vedic astrology and cosmic guidance.',
    robots: 'noindex, follow',
    ogImage: DEFAULT_OG_IMAGE
  }
};

export function seoForUrl(url: string): PageSeo {
  const pathOnly = url.split('?')[0].split('#')[0].replace(/^\//, '').replace(/\/$/, '');
  const key = pathOnly === '' ? '' : pathOnly;
  return ROUTE_SEO[key] ?? { ...ROUTE_SEO['**'], path: `/${pathOnly}` };
}
