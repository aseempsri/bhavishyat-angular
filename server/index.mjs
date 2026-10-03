import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import multer from 'multer';
import { MongoClient, ObjectId } from 'mongodb';
import { mountAssistant } from './assistant/routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3001);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bhavishyat';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const DEFAULT_OG_PATH = '/assets/og-share.jpg';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 }
});

const loginAttempts = new Map();

function requiredEnv(name) {
  const value = (process.env[name] || '').trim();
  if (!value) {
    throw new Error(`Missing ${name}. Copy server/.env.example to server/.env and set it.`);
  }
  return value;
}

function passwordsMatch(input, expected) {
  const a = crypto.createHash('sha256').update(String(input)).digest();
  const b = crypto.createHash('sha256').update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

function signToken() {
  const secret = requiredEnv('ADMIN_SECRET');
  const body = Buffer.from(JSON.stringify({
    role: 'admin',
    exp: Date.now() + TOKEN_TTL_MS
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return false;
  const secret = (process.env.ADMIN_SECRET || '').trim();
  if (!secret) return false;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(actualBuf, expectedBuf)) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.role === 'admin' && typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function readCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) continue;
    cookies[rawKey] = decodeURIComponent(rest.join('='));
  }
  return cookies;
}

function tokenFrom(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return readCookies(req).bhavishyat_admin || '';
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `bhavishyat_admin=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(TOKEN_TTL_MS / 1000)}${secure}`
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'bhavishyat_admin=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
}

function clientIp(req) {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function loginBlocked(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.reset) return false;
  return entry.count >= 8;
}

function recordLoginFailure(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.reset) {
    loginAttempts.set(ip, { count: 1, reset: now + 15 * 60 * 1000 });
    return;
  }
  entry.count += 1;
}

function slugify(headline) {
  const base = headline
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return base || 'post';
}

function excerptFrom(body, explicit) {
  const provided = (explicit || '').replace(/\s+/g, ' ').trim();
  if (provided) return provided.slice(0, 300);
  return body.replace(/\s+/g, ' ').trim().slice(0, 180);
}

function sniffImage(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function requestOrigin(req) {
  const configured = (process.env.PUBLIC_ORIGIN || '').trim().replace(/\/$/, '');
  if (configured) return configured;
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost || req.headers.host || `127.0.0.1:${PORT}`)
    .split(',')[0]
    .trim();
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto || req.protocol || 'http')
    .split(',')[0]
    .trim();
  return `${proto}://${host}`;
}

function binaryToBuffer(data) {
  if (!data) return Buffer.alloc(0);
  if (Buffer.isBuffer(data)) return data;
  if (typeof data.value === 'function') return Buffer.from(data.value(true));
  if (data.buffer) return Buffer.from(data.buffer);
  return Buffer.from(data);
}

function publicPost(doc) {
  return {
    id: doc._id.toHexString(),
    headline: doc.headline,
    slug: doc.slug,
    excerpt: doc.excerpt,
    body: doc.body,
    publishedAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function adminPost(doc) {
  return {
    ...publicPost(doc),
    published: Boolean(doc.published),
    thumbnailUrl: doc.thumbnailId ? `/uploads/${doc.thumbnailId.toHexString()}` : null
  };
}

function distIndex() {
  const candidates = [
    path.join(rootDir, 'dist/bhavishyat-angular/browser/index.html'),
    path.join(rootDir, 'dist/bhavishyat-angular/index.html')
  ];
  return candidates.find((file) => fs.existsSync(file)) || null;
}

async function uniqueSlug(collection, headline) {
  const base = slugify(headline);
  let slug = base;
  let n = 2;
  while (await collection.findOne({ slug }, { projection: { _id: 1 } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function requireAdmin(req, res, next) {
  if (!verifyToken(tokenFrom(req))) {
    res.status(401).json({ error: 'Sign in required.' });
    return;
  }
  next();
}

function readFields(body) {
  const headline = String(body.headline || '').trim();
  const content = String(body.body || '').trim();
  const excerpt = excerptFrom(content, body.excerpt);
  const published = String(body.published || 'true') !== 'false';
  const removeThumbnail = String(body.removeThumbnail || '') === 'true';
  if (!headline || headline.length > 140) {
    return { error: 'Headline is required and must be 140 characters or fewer.' };
  }
  if (!content) {
    return { error: 'Article text is required.' };
  }
  return { headline, content, excerpt, published, removeThumbnail };
}

function shareHtml({ origin, post, imageUrl }) {
  const shareUrl = `${origin}/share/blog/${encodeURIComponent(post.slug)}`;
  const articleUrl = `${origin}/blog/${encodeURIComponent(post.slug)}`;
  const title = escapeHtml(post.headline);
  const description = escapeHtml(post.excerpt || post.headline);
  const image = escapeHtml(imageUrl);
  return `<!DOCTYPE html>
<html lang="en-IN">
<head>
  <meta charset="utf-8">
  <title>${title} | BHAVISHYAT</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${escapeHtml(articleUrl)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="BHAVISHYAT">
  <meta property="og:locale" content="en_IN">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${escapeHtml(shareUrl)}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:alt" content="${title}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@Bhavishyatastro">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  <meta name="twitter:image:alt" content="${title}">
  <script>
    window.location.replace(${JSON.stringify(articleUrl)});
  </script>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>${description}</p>
    <p><a href="${escapeHtml(articleUrl)}">Continue to the article</a></p>
  </main>
</body>
</html>`;
}

async function main() {
  requiredEnv('ADMIN_PASSWORD');
  requiredEnv('ADMIN_SECRET');
  requiredEnv('DELETE_PASSWORD');

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const posts = db.collection('blog_posts');
  const thumbs = db.collection('blog_thumbnails');
  await posts.createIndex({ slug: 1 }, { unique: true });
  await posts.createIndex({ published: 1, createdAt: -1 });

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  await mountAssistant(app, { db, requireAdmin, requestOrigin });
  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/admin/login', (req, res) => {
    const ip = clientIp(req);
    if (loginBlocked(ip)) {
      res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
      return;
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password || !passwordsMatch(password, requiredEnv('ADMIN_PASSWORD'))) {
      recordLoginFailure(ip);
      res.status(401).json({ error: 'Incorrect password.' });
      return;
    }
    loginAttempts.delete(ip);
    const token = signToken();
    setSessionCookie(res, token);
    res.json({ ok: true, token });
  });

  app.post('/api/admin/logout', (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/admin/me', (req, res) => {
    res.json({ ok: verifyToken(tokenFrom(req)) });
  });

  app.get('/api/blogs', async (_req, res) => {
    const docs = await posts
      .find({ published: true }, { projection: { thumbnailId: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(docs.map(publicPost));
  });

  app.get('/api/blogs/:slug', async (req, res) => {
    const slug = String(req.params.slug || '');
    const doc = await posts.findOne({ slug, published: true }, { projection: { thumbnailId: 0 } });
    if (!doc) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
    res.json(publicPost(doc));
  });

  app.get('/api/admin/blogs', requireAdmin, async (_req, res) => {
    const docs = await posts.find({}, { projection: { /* keep thumbnailId, drop nothing large */ } }).sort({ createdAt: -1 }).toArray();
    res.json(docs.map(adminPost));
  });

  app.post('/api/admin/blogs', requireAdmin, (req, res) => {
    upload.single('thumbnail')(req, res, async (err) => {
      if (err) {
        res.status(400).json({ error: 'Thumbnail must be a JPG, PNG, or WebP under 2 MB.' });
        return;
      }
      try {
        const fields = readFields(req.body || {});
        if (fields.error) {
          res.status(400).json({ error: fields.error });
          return;
        }
        let thumbnailId = null;
        if (req.file) {
          const contentType = sniffImage(req.file.buffer);
          if (!contentType) {
            res.status(400).json({ error: 'Thumbnail must be a JPG, PNG, or WebP image.' });
            return;
          }
          thumbnailId = new ObjectId();
          await thumbs.insertOne({
            _id: thumbnailId,
            contentType,
            data: req.file.buffer,
            createdAt: new Date()
          });
        }
        const now = new Date();
        const doc = {
          headline: fields.headline,
          slug: await uniqueSlug(posts, fields.headline),
          body: fields.content,
          excerpt: fields.excerpt,
          published: fields.published,
          thumbnailId,
          createdAt: now,
          updatedAt: now
        };
        await posts.insertOne(doc);
        res.status(201).json(adminPost(doc));
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not save the article.' });
      }
    });
  });

  app.put('/api/admin/blogs/:id', requireAdmin, (req, res) => {
    upload.single('thumbnail')(req, res, async (err) => {
      if (err) {
        res.status(400).json({ error: 'Thumbnail must be a JPG, PNG, or WebP under 2 MB.' });
        return;
      }
      try {
        if (!ObjectId.isValid(req.params.id)) {
          res.status(404).json({ error: 'Article not found.' });
          return;
        }
        const existing = await posts.findOne({ _id: new ObjectId(req.params.id) });
        if (!existing) {
          res.status(404).json({ error: 'Article not found.' });
          return;
        }
        const fields = readFields(req.body || {});
        if (fields.error) {
          res.status(400).json({ error: fields.error });
          return;
        }
        let thumbnailId = existing.thumbnailId || null;
        if (req.file) {
          const contentType = sniffImage(req.file.buffer);
          if (!contentType) {
            res.status(400).json({ error: 'Thumbnail must be a JPG, PNG, or WebP image.' });
            return;
          }
          const nextId = new ObjectId();
          await thumbs.insertOne({
            _id: nextId,
            contentType,
            data: req.file.buffer,
            createdAt: new Date()
          });
          if (thumbnailId) await thumbs.deleteOne({ _id: thumbnailId });
          thumbnailId = nextId;
        } else if (fields.removeThumbnail && thumbnailId) {
          await thumbs.deleteOne({ _id: thumbnailId });
          thumbnailId = null;
        }
        const update = {
          headline: fields.headline,
          body: fields.content,
          excerpt: fields.excerpt,
          published: fields.published,
          thumbnailId,
          updatedAt: new Date()
        };
        await posts.updateOne({ _id: existing._id }, { $set: update });
        res.json(adminPost({ ...existing, ...update }));
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Could not update the article.' });
      }
    });
  });

  app.patch('/api/admin/blogs/:id/visibility', requireAdmin, async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
    if (typeof req.body?.published !== 'boolean') {
      res.status(400).json({ error: 'Choose whether the article is shown or hidden.' });
      return;
    }
    const existing = await posts.findOne({ _id: new ObjectId(req.params.id) });
    if (!existing) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
    const update = { published: req.body.published, updatedAt: new Date() };
    await posts.updateOne({ _id: existing._id }, { $set: update });
    res.json(adminPost({ ...existing, ...update }));
  });

  app.delete('/api/admin/blogs/:id', requireAdmin, async (req, res) => {
    const ip = clientIp(req);
    if (loginBlocked(ip)) {
      res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
      return;
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password || !passwordsMatch(password, requiredEnv('DELETE_PASSWORD'))) {
      recordLoginFailure(ip);
      res.status(401).json({ error: 'Incorrect delete password.' });
      return;
    }
    if (!ObjectId.isValid(req.params.id)) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
    const existing = await posts.findOne({ _id: new ObjectId(req.params.id) });
    if (!existing) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
    await posts.deleteOne({ _id: existing._id });
    if (existing.thumbnailId) await thumbs.deleteOne({ _id: existing.thumbnailId });
    res.json({ ok: true });
  });

  app.get('/uploads/:id', async (req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
      res.status(404).end();
      return;
    }
    const doc = await thumbs.findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) {
      res.status(404).end();
      return;
    }
    const buffer = binaryToBuffer(doc.data);
    res.setHeader('Content-Type', doc.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.end(buffer);
  });

  app.get('/share/blog/:slug', async (req, res) => {
    const doc = await posts.findOne({ slug: String(req.params.slug || ''), published: true });
    if (!doc) {
      res.status(404).type('html').send('<!DOCTYPE html><title>Not found</title><p>Article not found.</p>');
      return;
    }
    const origin = requestOrigin(req);
    const imageUrl = doc.thumbnailId
      ? `${origin}/uploads/${doc.thumbnailId.toHexString()}`
      : `${origin}${DEFAULT_OG_PATH}`;
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.type('html').send(shareHtml({ origin, post: doc, imageUrl }));
  });

  const indexFile = distIndex();
  if (indexFile) {
    const distDir = path.dirname(indexFile);
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/share')) return next();
      if (path.extname(req.path)) return next();
      res.sendFile(indexFile);
    });
  }

  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'Not found.' });
      return;
    }
    res.status(404).type('html').send('<!DOCTYPE html><title>Not found</title><p>Not found.</p>');
  });

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Blog API listening on http://127.0.0.1:${PORT}`);
  });
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
