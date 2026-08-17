/**
 * Clean kundli PDF export: every content page is a fixed 820×1230 frame
 * with identical padding — no per-page scale (scale caused uneven text width).
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../vaidehi-kundli');
const HTML = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'Vaidehi_Janma_Kundli.pdf');
const TMP = path.join(ROOT, '_pdf_pages');
const PAGE_W = 820;
const PAGE_H = 1230;

async function main() {
  fs.mkdirSync(TMP, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: PAGE_W + 40, height: PAGE_H + 40 },
    deviceScaleFactor: 1.5
  });

  await page.goto(`file://${HTML}`, { waitUntil: 'networkidle' });
  await page.addStyleTag({
    content: `
      html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
      .doc { max-width: none !important; margin: 0 !important; padding: 0 !important; }
      .page {
        width: ${PAGE_W}px !important;
        height: ${PAGE_H}px !important;
        min-height: ${PAGE_H}px !important;
        max-height: ${PAGE_H}px !important;
        margin: 0 0 24px !important;
        box-shadow: none !important;
        border: none !important;
        overflow: hidden !important;
      }
      .page:not(.cover-page) {
        padding: 28px 34px 22px !important;
        box-sizing: border-box !important;
      }
    `
  });
  await page.waitForTimeout(400);

  const pages = await page.$$('.page');
  const shots = [];

  for (let i = 0; i < pages.length; i++) {
    const el = pages[i];
    await el.scrollIntoViewIfNeeded();

    const meta = await el.evaluate((node) => {
      const prev = node.querySelector(':scope > .pdf-scale-wrap');
      if (prev) {
        while (prev.firstChild) node.insertBefore(prev.firstChild, prev);
        prev.remove();
      }
      return {
        scrollH: node.scrollHeight,
        overflow: node.scrollHeight > 1231
      };
    });

    if (meta.overflow) {
      console.warn(
        `page ${i + 1}: content ${meta.scrollH}px exceeds ${PAGE_H}px — will clip (fix HTML to fit; do not scale)`
      );
    }

    const file = path.join(TMP, `page-${String(i + 1).padStart(2, '0')}.png`);
    const box = await el.boundingBox();
    await page.screenshot({
      path: file,
      type: 'png',
      clip: {
        x: box.x,
        y: box.y,
        width: PAGE_W,
        height: PAGE_H
      }
    });
    shots.push(file);
    console.log(`page ${i + 1}: 820×1230 (text width locked)`);
  }
  await browser.close();

  const browser2 = await chromium.launch();
  const page2 = await browser2.newPage();
  const imgs = shots
    .map((f) => {
      const b64 = fs.readFileSync(f).toString('base64');
      return `<div class="p"><img width="${PAGE_W}" height="${PAGE_H}" src="data:image/png;base64,${b64}" /></div>`;
    })
    .join('\n');

  await page2.setContent(
    `<!DOCTYPE html><html><head><style>
      @page { size: ${PAGE_W}px ${PAGE_H}px; margin: 0; }
      html, body { margin: 0; padding: 0; }
      .p { page-break-after: always; width: ${PAGE_W}px; height: ${PAGE_H}px; overflow: hidden; }
      .p:last-child { page-break-after: auto; }
      img { width: ${PAGE_W}px; height: ${PAGE_H}px; display: block; }
    </style></head><body>${imgs}</body></html>`,
    { waitUntil: 'load' }
  );

  await page2.pdf({
    path: OUT,
    width: `${PAGE_W}px`,
    height: `${PAGE_H}px`,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  await browser2.close();

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`Wrote ${OUT} (${shots.length} pages, uniform width)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
