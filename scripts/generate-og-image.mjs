/**
 * Builds the social share preview (Open Graph) image: hero background + main logo.
 * Output: src/assets/og-share.jpg (1200×630)
 */
import sharp from 'sharp';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '../src/assets');
const outputPath = join(assetsDir, 'og-share.jpg');

const W = 1200;
const H = 630;
const LOGO_WIDTH = 880;

const heroPath = join(assetsDir, 'new-hero.png');
const logoPath = join(assetsDir, 'main_logo-P.png');

const bg = await sharp(heroPath)
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .modulate({ brightness: 0.92, saturation: 1.05 })
  .toBuffer();

const logoBuf = await sharp(logoPath).resize({ width: LOGO_WIDTH }).toBuffer();
const logoMeta = await sharp(logoBuf).metadata();

const vignette = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <radialGradient id="g" cx="50%" cy="45%" r="70%">
        <stop offset="0%" stop-color="black" stop-opacity="0"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.45"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`
);

const left = Math.round((W - logoMeta.width) / 2);
const top = Math.round((H - logoMeta.height) / 2 - 10);

await sharp(bg)
  .composite([
    { input: vignette, blend: 'over' },
    { input: logoBuf, top, left }
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(outputPath);

const kb = Math.round(statSync(outputPath).size / 1024);
console.log(`Generated OG share image → src/assets/og-share.jpg (${kb} KB)`);
