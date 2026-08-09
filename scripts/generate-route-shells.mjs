/**
 * Writes per-route index.html shells into the build output so crawlers
 * and social bots receive correct title/description/canonical without waiting for JS.
 * Keep in sync with src/app/core/seo/seo.config.ts
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '../dist/bhavishyat-angular/browser');
const SITE = 'https://bhavishyat.in';
const DEFAULT_IMAGE = `${SITE}/assets/new-hero.png`;

const ROUTES = [
  {
    segment: '',
    title: 'BHAVISHYAT | Vedic Astrology, Kundali & Cosmic Guidance',
    description:
      'BHAVISHYAT offers Vedic astrology, personalized kundali analysis, daily panchang, remedies, seva, and Gurukul class recordings to illuminate your cosmic path.',
    path: '/',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  },
  {
    segment: 'daily-panchang',
    title: 'Daily Panchang | Auspicious Timings & Cosmic Calendar | BHAVISHYAT',
    description:
      'Check today’s Vedic panchang with tithi, nakshatra, yoga, karana, and muhurat guidance from BHAVISHYAT — your daily cosmic calendar.',
    path: '/daily-panchang'
  },
  {
    segment: 'shinrin-yoku',
    title: 'Shinrin-Yoku Forest Bathing Retreats | BHAVISHYAT',
    description:
      'Experience Shinrin-Yoku forest bathing with BHAVISHYAT — nature immersion for calm, clarity, and reconnection with the living world.',
    path: '/shinrin-yoku'
  },
  {
    segment: 'escape-retreats',
    title: 'Escape Retreats | Sacred Getaways & Cosmic Renewal | BHAVISHYAT',
    description:
      'Join BHAVISHYAT Escape Retreats — restorative getaways blending stillness, nature, and Vedic wisdom for inner renewal.',
    path: '/escape-retreats'
  },
  {
    segment: 'kundali',
    title: 'Kundali Analysis | Birth Chart & Planetary Insights | BHAVISHYAT',
    description:
      'Explore personalized kundali and birth chart insights with BHAVISHYAT — planets, houses, dasha, and Vedic guidance for your life path.',
    path: '/kundali'
  },
  {
    segment: 'class-recordings',
    title: 'Gurukul Class Recordings | Learn Vedic Astrology | BHAVISHYAT',
    description:
      'Watch BHAVISHYAT Gurukul class recordings on Vedic astrology — free lessons covering charts, planets, houses, and cosmic wisdom.',
    path: '/class-recordings'
  },
  {
    segment: 'house-signification',
    title: 'House Signification in Vedic Astrology | BHAVISHYAT',
    description:
      'Learn the meaning of the twelve houses in Vedic astrology — significations for career, relationships, health, and destiny with BHAVISHYAT.',
    path: '/house-signification'
  },
  {
    segment: 'remedies-seva',
    title: 'Astrological Remedies & Seva | Naula, Gaushala, Temple | BHAVISHYAT',
    description:
      'Discover Vedic remedies and seva with BHAVISHYAT — naula dhara, gaushala, temple seva, tree plantation, and lagna-based guidance.',
    path: '/remedies-seva'
  },
  {
    segment: 'aarohanam',
    title: 'Aarohanam | Events, Articles & Ascending Path | BHAVISHYAT',
    description:
      'Explore Aarohanam with BHAVISHYAT — events, articles, and practices for spiritual ascent guided by Vedic insight.',
    path: '/aarohanam'
  }
];

function escapeAttr(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function replaceMeta(html, { title, description, path: pagePath, robots, image }) {
  const absoluteUrl = `${SITE}${pagePath === '/' ? '/' : pagePath}`;
  const robotsContent =
    robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const ogImage = image || DEFAULT_IMAGE;

  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(title)}</title>`);
  out = out.replace(
    /<meta name="description"\s+content="[^"]*">/,
    `<meta name="description" content="${escapeAttr(description)}">`
  );
  out = out.replace(
    /<meta name="robots"\s+content="[^"]*">/,
    `<meta name="robots" content="${escapeAttr(robotsContent)}">`
  );
  out = out.replace(
    /<meta name="googlebot"\s+content="[^"]*">/,
    `<meta name="googlebot" content="${escapeAttr(robotsContent)}">`
  );
  out = out.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${escapeAttr(absoluteUrl)}">`
  );
  out = out.replace(
    /<link rel="alternate" hreflang="en-IN" href="[^"]*">/,
    `<link rel="alternate" hreflang="en-IN" href="${escapeAttr(absoluteUrl)}">`
  );
  out = out.replace(
    /<link rel="alternate" hreflang="x-default" href="[^"]*">/,
    `<link rel="alternate" hreflang="x-default" href="${escapeAttr(absoluteUrl)}">`
  );
  out = out.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${escapeAttr(title)}">`
  );
  out = out.replace(
    /<meta property="og:description"\s+content="[^"]*">/,
    `<meta property="og:description" content="${escapeAttr(description)}">`
  );
  out = out.replace(
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${escapeAttr(absoluteUrl)}">`
  );
  out = out.replace(
    /<meta property="og:image" content="[^"]*">/,
    `<meta property="og:image" content="${escapeAttr(ogImage)}">`
  );
  out = out.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${escapeAttr(title)}">`
  );
  out = out.replace(
    /<meta name="twitter:description"\s+content="[^"]*">/,
    `<meta name="twitter:description" content="${escapeAttr(description)}">`
  );
  out = out.replace(
    /<meta name="twitter:image" content="[^"]*">/,
    `<meta name="twitter:image" content="${escapeAttr(ogImage)}">`
  );

  return out;
}

function main() {
  const indexPath = path.join(DIST, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(`Build output not found: ${indexPath}`);
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(indexPath, 'utf8');
  let written = 0;

  for (const route of ROUTES) {
    const html = replaceMeta(baseHtml, route);
    if (!route.segment) {
      fs.writeFileSync(indexPath, html);
    } else {
      const dir = path.join(DIST, route.segment);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html);
    }
    written += 1;
  }

  // Soft-404 fallback for unknown paths on GitHub Pages
  const notFoundHtml = replaceMeta(baseHtml, {
    title: 'Page Not Found | BHAVISHYAT',
    description:
      'This page could not be found. Return to BHAVISHYAT for Vedic astrology and cosmic guidance.',
    path: '/',
    robots: 'noindex, follow'
  });
  fs.writeFileSync(path.join(DIST, '404.html'), notFoundHtml);

  console.log(`Wrote ${written} route shells + 404.html in ${DIST}`);
}

main();
