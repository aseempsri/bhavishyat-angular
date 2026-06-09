import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHANNEL_ID = 'UCyeDPqlWVMH6MYNCzTH1cEg';
const UPLOADS_PLAYLIST_ID = 'VLUUyeDPqlWVMH6MYNCzTH1cEg';
const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const OUTPUT_PATH = path.join(__dirname, '../public/youtube-videos.json');
const SHARE_DIR = path.join(__dirname, '../public/share');
const BASE_HREF = process.env.BASE_HREF || '/';
const SITE_URL = process.env.SITE_URL || '';
const GA_MEASUREMENT_ID = 'G-RDCP6X1G99';

const CLIENT_CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20240401.00.00'
  }
};

function parseDuration(duration) {
  if (!duration) {
    return null;
  }

  const parts = duration.split(':').map(Number);

  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return null;
}

const MINOR_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'its', 'is'
]);

const TITLE_OVERRIDES = {
  YRip9YUV10I: 'Seek Answers From the World',
  czzkh7LjcuI: 'Do Gemstones Really Work? The Truth Explained'
};

function titleCaseSegment(segment) {
  const words = segment.split(/(\s+)/);

  return words
    .map((part, index) => {
      if (/^\s+$/.test(part)) {
        return part;
      }

      const isFirstWord = !words.slice(0, index).some((item) => /\S/.test(item));
      const alpha = part.replace(/[^a-zA-Z]/g, '').toLowerCase();

      if (!isFirstWord && MINOR_WORDS.has(alpha)) {
        return part.toLowerCase();
      }

      const firstAlphaIndex = part.search(/[a-zA-Z]/);
      if (firstAlphaIndex === -1) {
        return part;
      }

      return (
        part.slice(0, firstAlphaIndex) +
        part.charAt(firstAlphaIndex).toUpperCase() +
        part.slice(firstAlphaIndex + 1).toLowerCase()
      );
    })
    .join('');
}

function toTitleCase(title) {
  return title
    .split(' | ')
    .map((segment) => titleCaseSegment(segment.trim()))
    .join(' | ');
}

function normalizeVideoTitle(title, videoId) {
  if (videoId && TITLE_OVERRIDES[videoId]) {
    return TITLE_OVERRIDES[videoId];
  }

  let normalized = title
    .replace(/\s*@\s*Bhavishyatastro\s*/gi, ' ')
    .replace(/\s*@\s*Bhavishyat\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  normalized = normalized.replace(/Dwisvabhav/gi, 'Dwiswabhav');
  normalized = normalized.replace(/Honest Truth/gi, 'Truth');
  normalized = normalized.replace(/\(PART\s*(\d+)\)/gi, '(Part $1)');
  normalized = normalized.replace(/\(part\s*(\d+)\)/gi, '(Part $1)');
  normalized = normalized.replace(/part-ii/gi, 'Part-II');
  normalized = normalized.replace(/part-i(?!\w)/gi, 'Part-I');
  normalized = normalized.replace(/([a-z])(\()/gi, '$1 $2');

  if (/^before you seek answers in the world/i.test(normalized)) {
    return 'Seek Answers From the World';
  }

  return toTitleCase(normalized);
}

function isShortVideo(duration, title) {
  const seconds = parseDuration(duration);

  if (seconds !== null && seconds <= 60) {
    return true;
  }

  const normalizedTitle = title.toLowerCase();
  return normalizedTitle.includes('#shorts') || normalizedTitle.includes('#shots');
}

function postInnertube(pathname, body) {
  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: 'www.youtube.com',
        path: `${pathname}?key=${INNERTUBE_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          if (response.statusCode !== 200) {
            reject(new Error(`Innertube request failed with status ${response.statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

function extractPlaylistVideos(response) {
  const videos = [];

  function walk(node) {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (node.playlistVideoRenderer) {
      const item = node.playlistVideoRenderer;
      const id = item.videoId;
      const title = item.title?.runs?.[0]?.text || item.title?.simpleText || '';
      const duration = item.lengthText?.simpleText || '';
      const thumbnails = item.thumbnail?.thumbnails || [];
      const thumbnailUrl =
        thumbnails[thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      if (id && title && !isShortVideo(duration, title)) {
        videos.push({
          id,
          title: normalizeVideoTitle(title, id),
          thumbnailUrl,
          videoUrl: `https://www.youtube.com/watch?v=${id}`,
          publishedAt: ''
        });
      }
    }

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    Object.values(node).forEach(walk);
  }

  walk(response);
  return videos;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function appendCacheBust(url, key, value) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${key}=${encodeURIComponent(value)}`;
}

function buildSharePage(video, cacheBust) {
  const normalizedBase = BASE_HREF.endsWith('/') ? BASE_HREF : `${BASE_HREF}/`;
  const gurukulPath = `${normalizedBase}class-recordings?v=${video.id}`;
  const sharePath = `${normalizedBase}share/${video.id}.html`;
  const shareUrl = SITE_URL ? `${SITE_URL.replace(/\/$/, '')}${sharePath}` : sharePath;
  const title = escapeHtml(video.title);
  const thumbnail = escapeHtml(appendCacheBust(video.thumbnailUrl, 'cb', cacheBust));
  const description = escapeHtml('Watch this astrology class on BHAVISHYAT Gurukul');
  const siteOrigin = SITE_URL ? SITE_URL.replace(/\/$/, '') : '';
  const faviconUrl = siteOrigin ? `${siteOrigin}${normalizedBase}favicon.ico` : `${normalizedBase}favicon.ico`;
  const logoUrl = siteOrigin ? `${siteOrigin}${normalizedBase}assets/top_logo.png` : `${normalizedBase}assets/top_logo.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  </script>
  <meta charset="utf-8">
  <title>${title} | BHAVISHYAT Gurukul</title>
  <meta name="description" content="${description}">
  <link rel="icon" type="image/x-icon" href="${faviconUrl}">
  <link rel="icon" type="image/png" href="${logoUrl}">
  <link rel="apple-touch-icon" href="${logoUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="BHAVISHYAT">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${thumbnail}">
  <meta property="og:url" content="${shareUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${thumbnail}">
  <script>
    window.location.replace('${gurukulPath}');
  </script>
</head>
<body>
  <p>Opening BHAVISHYAT Gurukul...</p>
  <p><a href="${gurukulPath}">Continue to video</a></p>
</body>
</html>
`;
}

function writeSharePages(videos, cacheBust) {
  if (fs.existsSync(SHARE_DIR)) {
    for (const file of fs.readdirSync(SHARE_DIR)) {
      if (file.endsWith('.html')) {
        fs.unlinkSync(path.join(SHARE_DIR, file));
      }
    }
  } else {
    fs.mkdirSync(SHARE_DIR, { recursive: true });
  }

  for (const video of videos) {
    const sharePagePath = path.join(SHARE_DIR, `${video.id}.html`);
    fs.writeFileSync(sharePagePath, buildSharePage(video, cacheBust));
  }
}

async function fetchAllChannelVideos() {
  const response = await postInnertube('/youtubei/v1/browse', {
    context: CLIENT_CONTEXT,
    browseId: UPLOADS_PLAYLIST_ID
  });

  return extractPlaylistVideos(response);
}

function readExistingVideos() {
  if (!fs.existsSync(OUTPUT_PATH)) {
    return [];
  }

  try {
    const existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    return Array.isArray(existing.videos) ? existing.videos : [];
  } catch {
    return [];
  }
}

async function main() {
  try {
    let videos = await fetchAllChannelVideos();

    if (videos.length === 0) {
      const existingVideos = readExistingVideos();
      if (existingVideos.length > 0) {
        console.warn('YouTube fetch returned 0 videos; keeping existing cached list');
        videos = existingVideos;
      }
    }

    const fetchedAt = new Date().toISOString();
    const cacheBust = Date.now().toString();
    const normalizedVideos = videos.map((video) => ({
      ...video,
      title: normalizeVideoTitle(video.title, video.id)
    }));
    const payload = {
      channelId: CHANNEL_ID,
      channelUrl: 'https://www.youtube.com/@Bhavishyatastro/videos',
      fetchedAt,
      videos: normalizedVideos
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));

    if (normalizedVideos.length > 0) {
      writeSharePages(normalizedVideos, cacheBust);
      console.log(`Generated ${normalizedVideos.length} share pages in ${SHARE_DIR}`);
    }

    console.log(`Saved ${normalizedVideos.length} YouTube videos to ${OUTPUT_PATH}`);
  } catch (error) {
    console.warn('Could not fetch YouTube videos at build time:', error.message);

    if (fs.existsSync(OUTPUT_PATH)) {
      console.log('Keeping existing youtube-videos.json fallback');
      return;
    }

    const fallback = {
      channelId: CHANNEL_ID,
      channelUrl: 'https://www.youtube.com/@Bhavishyatastro/videos',
      fetchedAt: new Date().toISOString(),
      videos: []
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(fallback, null, 2));
  }
}

main();
