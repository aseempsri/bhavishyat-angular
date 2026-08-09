import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_URL = (process.env.SITE_URL || 'https://bhavishyat.in').replace(/\/$/, '');
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');
const YOUTUBE_JSON = path.join(__dirname, '../public/youtube-videos.json');

const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/daily-panchang', changefreq: 'daily', priority: '0.9' },
  { path: '/kundali', changefreq: 'weekly', priority: '0.9' },
  { path: '/class-recordings', changefreq: 'daily', priority: '0.9' },
  { path: '/house-signification', changefreq: 'monthly', priority: '0.8' },
  { path: '/remedies-seva', changefreq: 'weekly', priority: '0.8' },
  { path: '/shinrin-yoku', changefreq: 'monthly', priority: '0.7' },
  { path: '/escape-retreats', changefreq: 'monthly', priority: '0.7' },
  { path: '/aarohanam', changefreq: 'weekly', priority: '0.7' }
];

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function readVideoLastmod() {
  try {
    const payload = JSON.parse(fs.readFileSync(YOUTUBE_JSON, 'utf8'));
    const videos = Array.isArray(payload.videos) ? payload.videos : [];
    const dates = videos
      .map((v) => v.publishedAt || v.uploadDate || v.published)
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((t) => !Number.isNaN(t));

    if (dates.length === 0) {
      return todayIsoDate();
    }

    return new Date(Math.max(...dates)).toISOString().slice(0, 10);
  } catch {
    return todayIsoDate();
  }
}

function buildUrlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function main() {
  const lastmod = todayIsoDate();
  const classRecordingsLastmod = readVideoLastmod();

  const entries = STATIC_ROUTES.map((route) =>
    buildUrlEntry({
      loc: `${SITE_URL}${route.path === '/' ? '/' : route.path}`,
      lastmod: route.path === '/class-recordings' ? classRecordingsLastmod : lastmod,
      changefreq: route.changefreq,
      priority: route.priority
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  fs.writeFileSync(OUTPUT_PATH, xml);
  console.log(`Wrote sitemap with ${entries.length} URLs → ${OUTPUT_PATH}`);
}

main();
