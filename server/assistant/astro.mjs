const DEG = Math.PI / 180;
const DELTA_T_SECONDS = 69;
const IST_OFFSET_MINUTES = 330;

export const RASHIS = [
  { name: 'Mesha', english: 'Aries', lord: 'Mars' },
  { name: 'Vrishabha', english: 'Taurus', lord: 'Venus' },
  { name: 'Mithuna', english: 'Gemini', lord: 'Mercury' },
  { name: 'Karka', english: 'Cancer', lord: 'Moon' },
  { name: 'Simha', english: 'Leo', lord: 'Sun' },
  { name: 'Kanya', english: 'Virgo', lord: 'Mercury' },
  { name: 'Tula', english: 'Libra', lord: 'Venus' },
  { name: 'Vrishchika', english: 'Scorpio', lord: 'Mars' },
  { name: 'Dhanu', english: 'Sagittarius', lord: 'Jupiter' },
  { name: 'Makara', english: 'Capricorn', lord: 'Saturn' },
  { name: 'Kumbha', english: 'Aquarius', lord: 'Saturn' },
  { name: 'Meena', english: 'Pisces', lord: 'Jupiter' }
];

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati'
];

const DASHA_ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
const NAK_SPAN = 360 / 27;

// Meeus, Astronomical Algorithms, Table 47.A (longitude terms): D, M, M', F, coefficient (1e-6 degrees)
const MOON_TERMS = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314], [0, 0, 2, 0, 213618],
  [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332], [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066],
  [2, 0, 1, 0, 53322], [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528], [0, 0, 1, -2, 10980],
  [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034], [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888],
  [2, 1, 0, 0, -6766], [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
  [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665], [0, 1, -2, 0, -2689],
  [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390], [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236],
  [0, 1, 2, 0, -2120], [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048], [2, 0, 1, -2, -1773],
  [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110], [3, 0, -1, 0, -892],
  [2, 1, 1, 0, -810], [4, -1, -2, 0, 759], [0, 2, -1, 0, -713], [2, 2, -1, 0, -700],
  [2, 1, -2, 0, 691], [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537],
  [4, -1, 0, 0, 520], [1, 0, -2, 0, -487], [2, 1, 0, -2, -399], [0, 0, 2, -2, -381],
  [1, 1, 1, 0, 351], [3, 0, -2, 0, -340], [4, 0, -3, 0, 330], [2, -1, 2, 0, 327],
  [0, 2, 1, 0, -323], [1, 1, -1, 0, 299], [2, 0, 3, 0, 294]
];

const CITIES = {
  mumbai: [19.076, 72.8777], bombay: [19.076, 72.8777], 'navi mumbai': [19.033, 73.0297], thane: [19.2183, 72.9781],
  kalyan: [19.2437, 73.1355], delhi: [28.6139, 77.209], 'new delhi': [28.6139, 77.209], noida: [28.5355, 77.391],
  gurgaon: [28.4595, 77.0266], gurugram: [28.4595, 77.0266], ghaziabad: [28.6692, 77.4538], faridabad: [28.4089, 77.3178],
  bangalore: [12.9716, 77.5946], bengaluru: [12.9716, 77.5946], hyderabad: [17.385, 78.4867], chennai: [13.0827, 80.2707],
  madras: [13.0827, 80.2707], kolkata: [22.5726, 88.3639], calcutta: [22.5726, 88.3639], pune: [18.5204, 73.8567],
  ahmedabad: [23.0225, 72.5714], jaipur: [26.9124, 75.7873], surat: [21.1702, 72.8311], lucknow: [26.8467, 80.9462],
  kanpur: [26.4499, 80.3319], nagpur: [21.1458, 79.0882], indore: [22.7196, 75.8577], bhopal: [23.2599, 77.4126],
  visakhapatnam: [17.6868, 83.2185], vizag: [17.6868, 83.2185], patna: [25.5941, 85.1376], vadodara: [22.3072, 73.1812],
  baroda: [22.3072, 73.1812], ludhiana: [30.901, 75.8573], agra: [27.1767, 78.0081], nashik: [19.9975, 73.7898],
  meerut: [28.9845, 77.7064], rajkot: [22.3039, 70.8022], varanasi: [25.3176, 82.9739], banaras: [25.3176, 82.9739],
  srinagar: [34.0837, 74.7973], amritsar: [31.634, 74.8723], chandigarh: [30.7333, 76.7794], jodhpur: [26.2389, 73.0243],
  raipur: [21.2514, 81.6296], prayagraj: [25.4358, 81.8463], allahabad: [25.4358, 81.8463], coimbatore: [11.0168, 76.9558],
  jabalpur: [23.1815, 79.9864], gwalior: [26.2183, 78.1828], vijayawada: [16.5062, 80.648], madurai: [9.9252, 78.1198],
  guwahati: [26.1445, 91.7362], mysore: [12.2958, 76.6394], mysuru: [12.2958, 76.6394], ranchi: [23.3441, 85.3096],
  bhubaneswar: [20.2961, 85.8245], dehradun: [30.3165, 78.0322], kochi: [9.9312, 76.2673], cochin: [9.9312, 76.2673],
  thiruvananthapuram: [8.5241, 76.9366], trivandrum: [8.5241, 76.9366], panaji: [15.4909, 73.8278], goa: [15.4909, 73.8278],
  udaipur: [24.5854, 73.7125], gorakhpur: [26.7606, 83.3732], bareilly: [28.367, 79.4304], aligarh: [27.8974, 78.088],
  jammu: [32.7266, 74.857], shimla: [31.1048, 77.1734], haridwar: [29.9457, 78.1642], rishikesh: [30.0869, 78.2676],
  ayodhya: [26.7922, 82.1998], faizabad: [26.7732, 82.1442], mathura: [27.4924, 77.6737], jhansi: [25.4484, 78.5685],
  siliguri: [26.7271, 88.3953], dhanbad: [23.7957, 86.4304], jamshedpur: [22.8046, 86.2029], cuttack: [20.4625, 85.883],
  mangalore: [12.9141, 74.856], mangaluru: [12.9141, 74.856], hubli: [15.3647, 75.124], trichy: [10.7905, 78.7047],
  tiruchirappalli: [10.7905, 78.7047], salem: [11.6643, 78.146], aurangabad: [19.8762, 75.3433], kota: [25.2138, 75.8648],
  ajmer: [26.4499, 74.6399], bikaner: [28.0229, 73.3119], gaya: [24.7914, 85.0002], muzaffarpur: [26.1209, 85.3647],
  bhagalpur: [25.2425, 86.9842], durg: [21.1904, 81.2849], bhilai: [21.1938, 81.3509], ujjain: [23.1765, 75.7885],
  sagar: [23.8388, 78.7378], rewa: [24.5362, 81.3037], satna: [24.6005, 80.8322], solapur: [17.6599, 75.9064],
  kolhapur: [16.705, 74.2433], belgaum: [15.8497, 74.4977], belagavi: [15.8497, 74.4977], warangal: [17.9689, 79.5941],
  tirupati: [13.6288, 79.4192], nellore: [14.4426, 79.9865], guntur: [16.3067, 80.4365], puducherry: [11.9416, 79.8083],
  pondicherry: [11.9416, 79.8083], vellore: [12.9165, 79.1325], kozhikode: [11.2588, 75.7804], calicut: [11.2588, 75.7804],
  thrissur: [10.5276, 76.2144], jalandhar: [31.326, 75.5762], patiala: [30.3398, 76.3869], panipat: [29.3909, 76.9635],
  karnal: [29.6857, 76.9905], rohtak: [28.8955, 76.6066], hisar: [29.1492, 75.7217], moradabad: [28.8386, 78.7733],
  saharanpur: [29.968, 77.5552], firozabad: [27.1591, 78.3957], etawah: [26.7856, 79.0158], sultanpur: [26.2648, 82.0727],
  azamgarh: [26.0739, 83.1859], jaunpur: [25.7464, 82.6837], mirzapur: [25.1337, 82.5644], ballia: [25.7584, 84.1487],
  shillong: [25.5788, 91.8933], imphal: [24.817, 93.9368], agartala: [23.8315, 91.2868], gangtok: [27.3389, 88.6065]
};

const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12
};

function norm(deg) {
  const value = deg % 360;
  return value < 0 ? value + 360 : value;
}

function sin(deg) {
  return Math.sin(deg * DEG);
}

function cos(deg) {
  return Math.cos(deg * DEG);
}

export function julianDay(date) {
  return date.getTime() / 86_400_000 + 2440587.5;
}

function centuries(jdTT) {
  return (jdTT - 2451545.0) / 36525;
}

function nutation(T) {
  const omega = 125.04452 - 1934.136261 * T;
  const Ls = 280.4665 + 36000.7698 * T;
  const Lm = 218.3165 + 481267.8813 * T;
  const dPsi = (-17.2 * sin(omega) - 1.32 * sin(2 * Ls) - 0.23 * sin(2 * Lm) + 0.21 * sin(2 * omega)) / 3600;
  const dEps = (9.2 * cos(omega) + 0.57 * cos(2 * Ls) + 0.1 * cos(2 * Lm) - 0.09 * cos(2 * omega)) / 3600;
  return { dPsi, dEps };
}

function obliquity(T) {
  const seconds = 21.448 - 46.815 * T - 0.00059 * T * T + 0.001813 * T * T * T;
  return 23 + 26 / 60 + seconds / 3600;
}

export function sunTrueLongitude(T) {
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) +
    (0.019993 - 0.000101 * T) * sin(2 * M) +
    0.000289 * sin(3 * M);
  return norm(L0 + C);
}

export function sunApparentLongitude(T) {
  const omega = 125.04 - 1934.136 * T;
  return norm(sunTrueLongitude(T) - 0.00569 - 0.00478 * sin(omega));
}

export function moonGeocentricLongitude(T) {
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + (T ** 3) / 538841 - (T ** 4) / 65194000;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + (T ** 3) / 545868 - (T ** 4) / 113065000;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + (T ** 3) / 24490000;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + (T ** 3) / 69699 - (T ** 4) / 14712000;
  const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T - (T ** 3) / 3526000 + (T ** 4) / 863310000;
  const A1 = 119.75 + 131.849 * T;
  const A2 = 53.09 + 479264.29 * T;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;

  let sum = 0;
  for (const [d, m, mp, f, coeff] of MOON_TERMS) {
    const factor = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
    sum += coeff * factor * sin(d * D + m * M + mp * Mp + f * F);
  }
  sum += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2);
  return norm(Lp + sum / 1e6);
}

export function lahiriAyanamsa(T) {
  return 23.85306 + (5029.0966 * T + 1.11113 * T * T) / 3600;
}

function apparentSiderealTime(jdUT, T, dPsi, eps) {
  const d = jdUT - 2451545.0;
  const gmst = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T ** 3) / 38710000;
  return norm(gmst + dPsi * cos(eps));
}

function ascendantTropical(lstDeg, latDeg, eps) {
  const y = cos(lstDeg);
  const x = -(sin(lstDeg) * cos(eps) + Math.tan(latDeg * DEG) * sin(eps));
  return norm(Math.atan2(y, x) / DEG);
}

function signOf(longitude) {
  const index = Math.floor(norm(longitude) / 30);
  const degreeInSign = norm(longitude) - index * 30;
  return { index, ...RASHIS[index], degree: Number(degreeInSign.toFixed(2)) };
}

function nakshatraOf(longitude) {
  const lon = norm(longitude);
  const index = Math.floor(lon / NAK_SPAN);
  const within = lon - index * NAK_SPAN;
  return {
    index,
    name: NAKSHATRAS[index],
    pada: Math.floor(within / (NAK_SPAN / 4)) + 1,
    lord: DASHA_ORDER[index % 9],
    fraction: within / NAK_SPAN
  };
}

export function positionsAt(date) {
  const jdUT = julianDay(date);
  const jdTT = jdUT + DELTA_T_SECONDS / 86400;
  const T = centuries(jdTT);
  const { dPsi, dEps } = nutation(T);
  const ayanamsa = lahiriAyanamsa(T);
  const sunTropical = norm(sunApparentLongitude(T));
  const moonTropical = norm(moonGeocentricLongitude(T) + dPsi);
  return {
    jdUT,
    T,
    dPsi,
    eps: obliquity(T) + dEps,
    ayanamsa,
    sun: norm(sunTropical - ayanamsa),
    moon: norm(moonTropical - ayanamsa)
  };
}

function vimshottari(birth, moonNakshatra, now = new Date()) {
  const startLord = moonNakshatra.lord;
  const startIdx = DASHA_ORDER.indexOf(startLord);
  const elapsedYears = moonNakshatra.fraction * DASHA_YEARS[startLord];
  let cursor = new Date(birth.getTime() - elapsedYears * YEAR_MS);
  const periods = [];
  for (let i = 0; i < 18; i++) {
    const lord = DASHA_ORDER[(startIdx + i) % 9];
    const end = new Date(cursor.getTime() + DASHA_YEARS[lord] * YEAR_MS);
    periods.push({ lord, start: cursor, end });
    cursor = end;
  }
  const balanceYears = (1 - moonNakshatra.fraction) * DASHA_YEARS[startLord];
  const current = periods.find((p) => p.start <= now && now < p.end) || null;
  let antardasha = null;
  if (current) {
    const mdYears = DASHA_YEARS[current.lord];
    let adStart = current.start;
    const mdIdx = DASHA_ORDER.indexOf(current.lord);
    for (let i = 0; i < 9; i++) {
      const lord = DASHA_ORDER[(mdIdx + i) % 9];
      const adEnd = new Date(adStart.getTime() + ((mdYears * DASHA_YEARS[lord]) / 120) * YEAR_MS);
      if (adStart <= now && now < adEnd) {
        antardasha = { lord, start: adStart, end: adEnd };
        break;
      }
      adStart = adEnd;
    }
  }
  const next = current ? periods[periods.indexOf(current) + 1] || null : null;
  const iso = (p) => p && { lord: p.lord, start: p.start.toISOString().slice(0, 10), end: p.end.toISOString().slice(0, 10) };
  return {
    birthDashaLord: startLord,
    balanceAtBirthYears: Number(balanceYears.toFixed(2)),
    current: iso(current),
    antardasha: iso(antardasha),
    next: iso(next)
  };
}

export function currentTransits(now = new Date()) {
  const p = positionsAt(now);
  return {
    at: now.toISOString(),
    sun: signOf(p.sun),
    moon: signOf(p.moon),
    moonNakshatra: (({ fraction, ...rest }) => rest)(nakshatraOf(p.moon))
  };
}

export function computeChart({ date, time, lat, lon, tzOffsetMinutes = IST_OFFSET_MINUTES, now = new Date() }) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const birthUtc = new Date(Date.UTC(y, m - 1, d, hh, mm) - tzOffsetMinutes * 60_000);
  if (Number.isNaN(birthUtc.getTime())) throw new Error('Invalid birth date or time.');
  const p = positionsAt(birthUtc);
  const lst = norm(apparentSiderealTime(p.jdUT, p.T, p.dPsi, p.eps) + lon);
  const lagna = norm(ascendantTropical(lst, lat, p.eps) - p.ayanamsa);
  const moonNak = nakshatraOf(p.moon);
  return {
    birthUtc: birthUtc.toISOString(),
    ayanamsa: Number(p.ayanamsa.toFixed(4)),
    lagna: signOf(lagna),
    moonSign: signOf(p.moon),
    sunSign: signOf(p.sun),
    nakshatra: (({ fraction, ...rest }) => rest)(moonNak),
    dasha: vimshottari(birthUtc, moonNak, now),
    transits: currentTransits(now)
  };
}

export async function resolvePlace(rawPlace, { userAgent } = {}) {
  const place = String(rawPlace || '').trim();
  if (!place) return null;
  const key = place.toLowerCase().split(',')[0].replace(/[^a-z\s]/g, '').trim();
  if (CITIES[key]) {
    const [lat, lon] = CITIES[key];
    return { name: place, lat, lon, tzOffsetMinutes: IST_OFFSET_MINUTES, source: 'built-in', country: 'IN' };
  }
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(place)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': userAgent || 'bhavishyat-assistant/1.0', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return null;
    const [hit] = await res.json();
    if (!hit) return null;
    const country = String(hit.address?.country_code || '').toUpperCase();
    return {
      name: hit.display_name,
      lat: Number(hit.lat),
      lon: Number(hit.lon),
      tzOffsetMinutes: country === 'IN' ? IST_OFFSET_MINUTES : null,
      source: 'openstreetmap',
      country
    };
  } catch {
    return null;
  }
}

const AMBIGUOUS_CITIES = new Set(['gaya', 'kota', 'sagar', 'salem', 'rewa', 'durg']);

export function findKnownCity(text) {
  const lower = String(text || '').toLowerCase();
  const names = Object.keys(CITIES).sort((a, b) => b.length - a.length);
  for (const name of names) {
    const found = AMBIGUOUS_CITIES.has(name)
      ? new RegExp(`\\b(?:in|at|from|near|born)\\s+${name}\\b|\\b${name}\\s*(?:,|में|\\b(?:me|mein)\\b)`).test(lower)
      : new RegExp(`\\b${name}\\b`).test(lower);
    if (found) return name.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return null;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function validDate(y, m, d) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return y > 1900 && dt.getTime() < Date.now() && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isPastIsoDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  return Boolean(match && validDate(+match[1], +match[2], +match[3]));
}

export function parseBirthDetails(text) {
  const src = String(text || '');
  const lower = src.toLowerCase();
  let date = null;

  let match = lower.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (match && validDate(+match[1], +match[2], +match[3])) date = `${match[1]}-${pad(match[2])}-${pad(match[3])}`;

  if (!date) {
    match = lower.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/);
    if (match && validDate(+match[3], +match[2], +match[1])) date = `${match[3]}-${pad(match[2])}-${pad(match[1])}`;
  }

  if (!date) {
    match = lower.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]{3,9})[,\s]+(\d{4})\b/);
    if (match && MONTHS[match[2]] && validDate(+match[3], MONTHS[match[2]], +match[1])) {
      date = `${match[3]}-${pad(MONTHS[match[2]])}-${pad(match[1])}`;
    }
  }

  if (!date) {
    match = lower.match(/\b([a-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})\b/);
    if (match && MONTHS[match[1]] && validDate(+match[3], MONTHS[match[1]], +match[2])) {
      date = `${match[3]}-${pad(MONTHS[match[1]])}-${pad(match[2])}`;
    }
  }

  let time = null;
  const withoutDate = lower.replace(/\b\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b/g, ' ');
  match = withoutDate.match(/\b(\d{1,2})[:.](\d{2})\s*(am|pm|a\.m\.|p\.m\.)?/);
  if (match) {
    let h = Number(match[1]);
    const min = Number(match[2]);
    const meridian = (match[3] || '').replace(/\./g, '');
    if (meridian === 'pm' && h < 12) h += 12;
    if (meridian === 'am' && h === 12) h = 0;
    if (h < 24 && min < 60) time = `${pad(h)}:${pad(min)}`;
  } else {
    match = withoutDate.match(/\b(\d{1,2})\s*(am|pm)\b/);
    if (match) {
      let h = Number(match[1]);
      if (match[2] === 'pm' && h < 12) h += 12;
      if (match[2] === 'am' && h === 12) h = 0;
      if (h < 24) time = `${pad(h)}:00`;
    }
  }

  let place = findKnownCity(src);
  if (!place) {
    match = src.match(/\b(?:born\s+(?:in|at)|place\s+of\s+birth|birth\s*place|pob)[:\s-]+([A-Za-z][A-Za-z\s]{2,40}?)(?=[,.!?\n]|$)/i);
    if (match && !/^(the|my|a|an)\b/i.test(match[1])) place = match[1].trim();
  }

  if (!date && !time && !place) return null;
  return { date, time, place };
}
