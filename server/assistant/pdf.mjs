const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 56;
const LINE_MAX = 86;

function pdfText(value) {
  return String(value ?? '')
    .replace(/₹/g, 'Rs. ')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrap(text, max = LINE_MAX) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > max) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export function buildPdf(blocks) {
  const pages = [[]];
  let y = PAGE_H - MARGIN;

  const push = (op, height) => {
    if (y - height < MARGIN) {
      pages.push([]);
      y = PAGE_H - MARGIN;
    }
    pages[pages.length - 1].push(op(y));
    y -= height;
  };

  for (const block of blocks) {
    if (block.type === 'title') {
      push((yy) => `BT /F2 22 Tf 0.55 0.33 0.12 rg ${MARGIN} ${yy - 22} Td (${pdfText(block.text)}) Tj ET`, 34);
    } else if (block.type === 'heading') {
      y -= 8;
      push((yy) => `BT /F2 13 Tf 0.55 0.33 0.12 rg ${MARGIN} ${yy - 13} Td (${pdfText(block.text)}) Tj ET`, 22);
    } else if (block.type === 'row') {
      push(
        (yy) =>
          `BT /F2 10.5 Tf 0.2 0.2 0.2 rg ${MARGIN} ${yy - 11} Td (${pdfText(block.label)}) Tj ET ` +
          `BT /F1 10.5 Tf 0.1 0.1 0.1 rg ${MARGIN + 170} ${yy - 11} Td (${pdfText(block.value)}) Tj ET`,
        17
      );
    } else if (block.type === 'rule') {
      push((yy) => `0.85 0.7 0.45 RG 0.8 w ${MARGIN} ${yy - 6} m ${PAGE_W - MARGIN} ${yy - 6} l S`, 14);
    } else {
      for (const line of wrap(block.text)) {
        push((yy) => `BT /F1 10.5 Tf 0.15 0.15 0.15 rg ${MARGIN} ${yy - 11} Td (${pdfText(line)}) Tj ET`, 15);
      }
      y -= 4;
    }
  }

  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };
  const catalogId = add('');
  const pagesId = add('');
  const fontRegular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const fontBold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const pageIds = [];
  pages.forEach((ops, index) => {
    const footer = `BT /F1 8 Tf 0.5 0.5 0.5 rg ${MARGIN} 30 Td (${pdfText(`BHAVISHYAT  |  connect@bhavishyat.in  |  Page ${index + 1} of ${pages.length}`)}) Tj ET`;
    const content = [...ops, footer].join('\n');
    const contentId = add(`<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`);
    pageIds.push(
      add(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
          `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contentId} 0 R >>`
      )
    );
  });
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let out = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out, 'latin1'));
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) out += `${String(offset).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

export function kundliReportBlocks({ name, birth, place, chart, booking, astrologerName }) {
  const blocks = [
    { type: 'title', text: 'BHAVISHYAT - Kundli Summary' },
    { type: 'text', text: `Prepared for ${name || 'you'} ahead of your consultation with ${astrologerName}.` },
    { type: 'rule' },
    { type: 'heading', text: 'Birth details' },
    { type: 'row', label: 'Date of birth', value: birth.date },
    { type: 'row', label: 'Time of birth', value: `${birth.time} (local)` },
    { type: 'row', label: 'Place of birth', value: place?.name || birth.place },
    { type: 'row', label: 'Coordinates', value: place ? `${place.lat.toFixed(3)}, ${place.lon.toFixed(3)}` : '-' }
  ];
  if (chart) {
    blocks.push(
      { type: 'heading', text: 'Core chart (sidereal, Lahiri ayanamsa)' },
      { type: 'row', label: 'Lagna (Ascendant)', value: `${chart.lagna.name} (${chart.lagna.english}) ${chart.lagna.degree} deg` },
      { type: 'row', label: 'Rashi (Moon sign)', value: `${chart.moonSign.name} (${chart.moonSign.english}) ${chart.moonSign.degree} deg` },
      { type: 'row', label: 'Sun sign', value: `${chart.sunSign.name} (${chart.sunSign.english}) ${chart.sunSign.degree} deg` },
      { type: 'row', label: 'Janma Nakshatra', value: `${chart.nakshatra.name}, pada ${chart.nakshatra.pada} (lord ${chart.nakshatra.lord})` },
      { type: 'row', label: 'Ayanamsa', value: `${chart.ayanamsa} deg` },
      { type: 'heading', text: 'Vimshottari dasha' },
      { type: 'row', label: 'Dasha at birth', value: `${chart.dasha.birthDashaLord} (balance ${chart.dasha.balanceAtBirthYears} years)` }
    );
    if (chart.dasha.current) {
      blocks.push({ type: 'row', label: 'Running mahadasha', value: `${chart.dasha.current.lord}: ${chart.dasha.current.start} to ${chart.dasha.current.end}` });
    }
    if (chart.dasha.antardasha) {
      blocks.push({ type: 'row', label: 'Running antardasha', value: `${chart.dasha.antardasha.lord}: ${chart.dasha.antardasha.start} to ${chart.dasha.antardasha.end}` });
    }
    if (chart.dasha.next) {
      blocks.push({ type: 'row', label: 'Next mahadasha', value: `${chart.dasha.next.lord} from ${chart.dasha.next.start}` });
    }
    blocks.push(
      { type: 'heading', text: 'Current transits' },
      { type: 'row', label: 'Sun', value: `${chart.transits.sun.name} (${chart.transits.sun.english})` },
      { type: 'row', label: 'Moon', value: `${chart.transits.moon.name} (${chart.transits.moon.english}), ${chart.transits.moonNakshatra.name}` }
    );
  }
  if (booking) {
    blocks.push(
      { type: 'heading', text: 'Your booking' },
      { type: 'row', label: 'Consultation', value: booking.packageName },
      { type: 'row', label: 'Amount paid', value: `Rs. ${Number(booking.amountInr).toLocaleString('en-IN')}` },
      { type: 'row', label: 'Booking reference', value: booking.reference || booking._id }
    );
  }
  blocks.push(
    { type: 'rule' },
    {
      type: 'text',
      text:
        'This summary is generated automatically from your birth details for reference. Your full reading, ' +
        'including divisional charts, yogas and remedies, is prepared and discussed personally during the consultation. ' +
        'Astrology offers perspective for reflection; your decisions still need practical planning.'
    }
  );
  return blocks;
}
