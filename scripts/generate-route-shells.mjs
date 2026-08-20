/**
 * Writes per-route index.html shells into the build output so crawlers
 * and social bots receive correct title/description/canonical and crawlable
 * body copy without waiting for JS.
 *
 * SEO copy comes from src/app/core/seo/seo-data.json (single source of truth).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '../dist/bhavishyat-angular/browser');
const SEO_DATA_PATH = path.join(__dirname, '../src/app/core/seo/seo-data.json');
const YOUTUBE_JSON = path.join(__dirname, '../public/youtube-videos.json');

const seoData = JSON.parse(fs.readFileSync(SEO_DATA_PATH, 'utf8'));
const SITE = seoData.siteOrigin;
const DEFAULT_IMAGE = seoData.defaultOgImage;
const DEFAULT_ROBOTS = seoData.defaultRobots;
const OG_W = seoData.ogImageWidth;
const OG_H = seoData.ogImageHeight;
const TWITTER_SITE = seoData.twitterSite;

const NAV_LINKS = Object.entries(seoData.routes)
  .filter(([key, route]) => key !== '**' && !route.robots?.includes('noindex'))
  .map(([key, route]) => ({
    href: `${SITE}${route.path === '/' ? '/' : route.path}`,
    label: key === '' ? 'Home' : route.title.split('|')[0].trim()
  }));

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Safe JSON for inline <script> tags — neutralize </script> breakout. */
function jsonForHtmlScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function absoluteUrl(pagePath) {
  return `${SITE}${pagePath === '/' ? '/' : pagePath}`;
}

function readVideos() {
  try {
    const payload = JSON.parse(fs.readFileSync(YOUTUBE_JSON, 'utf8'));
    return Array.isArray(payload.videos) ? payload.videos : [];
  } catch {
    return [];
  }
}

function buildEntitySchema(route, url, image) {
  const schemaType = route.schemaType || 'WebPage';
  const name = route.title.split('|')[0].trim();
  const base = {
    '@context': 'https://schema.org',
    '@id': `${url}#entity`,
    name,
    description: route.description,
    url,
    image,
    provider: { '@id': `${SITE}/#organization` },
    inLanguage: 'en-IN'
  };

  switch (schemaType) {
    case 'Course':
      return {
        ...base,
        '@type': 'Course',
        educationalLevel: 'Beginner to Intermediate',
        teaches: 'Vedic astrology',
        isAccessibleForFree: true,
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          courseWorkload: 'PT1H'
        }
      };
    case 'Service':
      return {
        ...base,
        '@type': 'Service',
        serviceType: 'Vedic astrology kundali analysis',
        areaServed: 'IN',
        brand: { '@id': `${SITE}/#organization` }
      };
    case 'Article':
      return {
        ...base,
        '@type': 'Article',
        headline: name,
        author: { '@id': `${SITE}/#organization` },
        publisher: {
          '@type': 'Organization',
          name: seoData.siteName,
          logo: {
            '@type': 'ImageObject',
            url: seoData.defaultLogo
          }
        },
        mainEntityOfPage: url
      };
    case 'EventSeries':
      return {
        ...base,
        '@type': 'EventSeries',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        organizer: { '@id': `${SITE}/#organization` }
      };
    default:
      return {
        ...base,
        '@type': 'WebPage',
        isPartOf: { '@id': `${SITE}/#website` }
      };
  }
}

function buildVideoListSchema(videos) {
  const items = videos.slice(0, 30).map((video, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'VideoObject',
      name: video.title,
      description: `${video.title} — a Vedic astrology class from BHAVISHYAT Gurukul.`,
      thumbnailUrl: video.thumbnailUrl,
      ...(video.publishedAt ? { uploadDate: video.publishedAt } : {}),
      contentUrl: video.videoUrl,
      embedUrl: `https://www.youtube.com/embed/${video.id}`,
      url: `${SITE}/class-recordings?v=${video.id}`,
      publisher: { '@id': `${SITE}/#organization` }
    }
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'BHAVISHYAT Gurukul Class Recordings',
    numberOfItems: items.length,
    itemListElement: items
  };
}

function buildCrawlableBody(route, url) {
  const headline = route.bodyHeadline || route.title.split('|')[0].trim();
  const summary = route.bodySummary || route.description;
  const points = Array.isArray(route.bodyPoints) ? route.bodyPoints : [];
  const pointsHtml = points
    .map((point) => `<li>${escapeHtml(point)}</li>`)
    .join('');
  const navHtml = NAV_LINKS.map(
    (link) => `<li><a href="${escapeAttr(link.href)}">${escapeHtml(link.label)}</a></li>`
  ).join('');

  const videoLinks =
    route.path === '/class-recordings'
      ? readVideos()
          .slice(0, 20)
          .map(
            (video) =>
              `<li><a href="${escapeAttr(video.videoUrl)}">${escapeHtml(video.title)}</a></li>`
          )
          .join('')
      : '';

  return `<main data-seo-shell="true">
  <h1>${escapeHtml(headline)}</h1>
  <p>${escapeHtml(summary)}</p>
  ${pointsHtml ? `<ul>${pointsHtml}</ul>` : ''}
  ${videoLinks ? `<section><h2>Featured class recordings</h2><ul>${videoLinks}</ul></section>` : ''}
  <nav aria-label="Site">
    <ul>${navHtml}</ul>
  </nav>
  <p><a href="${escapeAttr(url)}">Open the interactive page</a> or visit
    <a href="https://www.youtube.com/@Bhavishyatastro">YouTube @Bhavishyatastro</a>.</p>
</main>`;
}

function upsertMeta(html, pattern, replacement) {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }
  return html.replace('</head>', `  ${replacement}\n</head>`);
}

function replaceMeta(html, route) {
  const pagePath = route.path || '/';
  const absolute = absoluteUrl(pagePath);
  const robotsContent = route.robots || DEFAULT_ROBOTS;
  const ogImage = route.ogImage || DEFAULT_IMAGE;
  const ogType = route.ogType || 'website';
  const title = route.title;
  const description = route.description;

  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(title)}</title>`);
  out = upsertMeta(
    out,
    /<meta name="description"\s+content="[^"]*">/,
    `<meta name="description" content="${escapeAttr(description)}">`
  );
  out = upsertMeta(
    out,
    /<meta name="robots"\s+content="[^"]*">/,
    `<meta name="robots" content="${escapeAttr(robotsContent)}">`
  );
  out = upsertMeta(
    out,
    /<meta name="googlebot"\s+content="[^"]*">/,
    `<meta name="googlebot" content="${escapeAttr(robotsContent)}">`
  );
  out = upsertMeta(
    out,
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${escapeAttr(absolute)}">`
  );
  out = upsertMeta(
    out,
    /<link rel="alternate" hreflang="en-IN" href="[^"]*">/,
    `<link rel="alternate" hreflang="en-IN" href="${escapeAttr(absolute)}">`
  );
  out = upsertMeta(
    out,
    /<link rel="alternate" hreflang="x-default" href="[^"]*">/,
    `<link rel="alternate" hreflang="x-default" href="${escapeAttr(absolute)}">`
  );
  out = upsertMeta(
    out,
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${escapeAttr(title)}">`
  );
  out = upsertMeta(
    out,
    /<meta property="og:description"\s+content="[^"]*">/,
    `<meta property="og:description" content="${escapeAttr(description)}">`
  );
  out = upsertMeta(
    out,
    /<meta property="og:type" content="[^"]*">/,
    `<meta property="og:type" content="${escapeAttr(ogType)}">`
  );
  out = upsertMeta(
    out,
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${escapeAttr(absolute)}">`
  );
  out = upsertMeta(
    out,
    /<meta property="og:image" content="[^"]*">/,
    `<meta property="og:image" content="${escapeAttr(ogImage)}">`
  );
  out = upsertMeta(
    out,
    /<meta property="og:image:width" content="[^"]*">/,
    `<meta property="og:image:width" content="${OG_W}">`
  );
  out = upsertMeta(
    out,
    /<meta property="og:image:height" content="[^"]*">/,
    `<meta property="og:image:height" content="${OG_H}">`
  );
  out = upsertMeta(
    out,
    /<meta name="twitter:site" content="[^"]*">/,
    `<meta name="twitter:site" content="${escapeAttr(TWITTER_SITE)}">`
  );
  out = upsertMeta(
    out,
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${escapeAttr(title)}">`
  );
  out = upsertMeta(
    out,
    /<meta name="twitter:description"\s+content="[^"]*">/,
    `<meta name="twitter:description" content="${escapeAttr(description)}">`
  );
  out = upsertMeta(
    out,
    /<meta name="twitter:image" content="[^"]*">/,
    `<meta name="twitter:image" content="${escapeAttr(ogImage)}">`
  );

  if (route.keywords) {
    out = upsertMeta(
      out,
      /<meta name="keywords"\s+content="[^"]*">/,
      `<meta name="keywords" content="${escapeAttr(route.keywords)}">`
    );
  }

  const entityJson = jsonForHtmlScript(buildEntitySchema(route, absolute, ogImage));
  const entityTag = `<script type="application/ld+json" id="seo-jsonld-entity">${entityJson}</script>`;
  out = out.replace(/<script type="application\/ld\+json" id="seo-jsonld-entity">[\s\S]*?<\/script>\s*/g, '');
  out = out.replace('</head>', `  ${entityTag}\n</head>`);

  if (pagePath === '/class-recordings') {
    const videoJson = jsonForHtmlScript(buildVideoListSchema(readVideos()));
    const videoTag = `<script type="application/ld+json" id="seo-jsonld-videolist">${videoJson}</script>`;
    out = out.replace(/<script type="application\/ld\+json" id="seo-jsonld-videolist">[\s\S]*?<\/script>\s*/g, '');
    out = out.replace('</head>', `  ${videoTag}\n</head>`);
  }

  const body = buildCrawlableBody(route, absolute);
  if (/<app-root>[\s\S]*?<\/app-root>/.test(out)) {
    out = out.replace(/<app-root>[\s\S]*?<\/app-root>/, `<app-root>${body}</app-root>`);
  } else {
    out = out.replace('<app-root></app-root>', `<app-root>${body}</app-root>`);
  }

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

  for (const [segment, route] of Object.entries(seoData.routes)) {
    if (segment === '**') {
      continue;
    }

    const html = replaceMeta(baseHtml, route);
    if (!segment) {
      fs.writeFileSync(indexPath, html);
    } else {
      const dir = path.join(DIST, segment);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html);
    }
    written += 1;
  }

  const notFoundHtml = replaceMeta(baseHtml, seoData.routes['**']);
  fs.writeFileSync(path.join(DIST, '404.html'), notFoundHtml);

  console.log(`Wrote ${written} route shells + 404.html in ${DIST}`);
}

main();
