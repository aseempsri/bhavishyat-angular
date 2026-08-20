import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEO_DATA_PATH = path.join(__dirname, '../src/app/core/seo/seo-data.json');
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');
const YOUTUBE_JSON = path.join(__dirname, '../public/youtube-videos.json');

const seoData = JSON.parse(fs.readFileSync(SEO_DATA_PATH, 'utf8'));
const SITE_URL = (process.env.SITE_URL || seoData.siteOrigin).replace(/\/$/, '');

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

  const routes = Object.entries(seoData.routes)
    .filter(([key, route]) => key !== '**' && !route.robots?.includes('noindex'))
    .map(([, route]) => route);

  const entries = routes.map((route) =>
    buildUrlEntry({
      loc: `${SITE_URL}${route.path === '/' ? '/' : route.path}`,
      lastmod: route.path === '/class-recordings' ? classRecordingsLastmod : lastmod,
      changefreq: route.changefreq || 'monthly',
      priority: route.priority || '0.5'
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
