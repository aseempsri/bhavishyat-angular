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
          title,
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

function buildSharePage(video) {
  const normalizedBase = BASE_HREF.endsWith('/') ? BASE_HREF : `${BASE_HREF}/`;
  const gurukulPath = `${normalizedBase}class-recordings?v=${video.id}`;
  const sharePath = `${normalizedBase}share/${video.id}.html`;
  const shareUrl = SITE_URL ? `${SITE_URL.replace(/\/$/, '')}${sharePath}` : sharePath;
  const title = escapeHtml(video.title);
  const thumbnail = escapeHtml(video.thumbnailUrl);
  const description = escapeHtml('Watch this astrology class on BHAVISHYAT Gurukul');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} | BHAVISHYAT Gurukul</title>
  <meta name="description" content="${description}">
  <meta property="og:type" content="website">
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

function writeSharePages(videos) {
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
    fs.writeFileSync(sharePagePath, buildSharePage(video));
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

    const payload = {
      channelId: CHANNEL_ID,
      channelUrl: 'https://www.youtube.com/@Bhavishyatastro/videos',
      fetchedAt: new Date().toISOString(),
      videos
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));

    if (videos.length > 0) {
      writeSharePages(videos);
      console.log(`Generated ${videos.length} share pages in ${SHARE_DIR}`);
    }

    console.log(`Saved ${videos.length} YouTube videos to ${OUTPUT_PATH}`);
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
