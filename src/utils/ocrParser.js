import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function extractMoney(text) {
  const matches = text.match(/\$?([\d,]+\.?\d{0,2})/g) || [];
  return matches
    .map((m) => parseFloat(m.replace(/[$,]/g, '')))
    .filter((n) => !isNaN(n) && n > 0);
}

// Pull every plausible calendar date out of a text string.
function extractDates(text) {
  const dates = [];
  let m;

  // MM/DD/YYYY or MM-DD-YYYY
  const mdy = /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](20\d{2})\b/g;
  while ((m = mdy.exec(text)) !== null) {
    const d = new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2]));
    if (!isNaN(d.getTime())) dates.push(d);
  }

  // YYYY-MM-DD
  const ymd = /\b(20\d{2})-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])\b/g;
  while ((m = ymd.exec(text)) !== null) {
    const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
    if (!isNaN(d.getTime())) dates.push(d);
  }

  // "January 15, 2025" or "Jan 15 2025"
  const MONTH_MAP = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const monthPat = Object.keys(MONTH_MAP).map(k => `${k}[a-z]*`).join('|');
  const longDate = new RegExp(`\\b(${monthPat})\\.?\\s+(\\d{1,2}),?\\s+(20\\d{2})\\b`, 'gi');
  while ((m = longDate.exec(text)) !== null) {
    const mon = MONTH_MAP[m[1].slice(0, 3).toLowerCase()];
    const d = new Date(parseInt(m[3]), mon, parseInt(m[2]));
    if (!isNaN(d.getTime())) dates.push(d);
  }

  return dates;
}

function detectFrequency(fullText) {
  const lower = fullText.toLowerCase();

  // ── Strategy 1: explicit frequency label ─────────────────────────────────
  // Check most-specific patterns first so "bi-weekly" doesn't accidentally
  // match a later "\bweekly\b" check, and "semi-monthly" doesn't match "monthly".
  if (/semi[- ]?monthly/.test(lower)) return 'biweekly'; // no semi-monthly option; biweekly is closest
  if (/bi[- ]?weekly/.test(lower))    return 'biweekly';

  // Strip compound forms before testing the simpler words
  const stripped = lower.replace(/bi[- ]?weekly/g, '').replace(/semi[- ]?monthly/g, '');
  if (/\bweekly\b/.test(stripped))  return 'weekly';
  if (/\bmonthly\b/.test(stripped)) return 'monthly';

  // ── Strategy 2: pay-period date gap ──────────────────────────────────────
  // Prefer dates found on lines that mention "period" or "pay date".
  const lines = fullText.split('\n');
  const periodLines = lines.filter(l => /period|pay\s*date/i.test(l));
  const datesFromPeriodLines = periodLines.flatMap(l => extractDates(l));
  const allDates = extractDates(fullText);

  const pool = datesFromPeriodLines.length >= 2 ? datesFromPeriodLines : allDates;

  // Deduplicate and sort
  const unique = [...new Map(pool.map(d => [d.getTime(), d])).values()]
    .sort((a, b) => a - b);

  for (let i = 0; i + 1 < unique.length; i++) {
    const diffDays = Math.round((unique[i + 1] - unique[i]) / 86_400_000);

    if (diffDays >= 6 && diffDays <= 8) return 'weekly';
    if (diffDays >= 28 && diffDays <= 32) return 'monthly';

    if (diffDays >= 13 && diffDays <= 16) {
      // Distinguish biweekly (exactly 14 days, arbitrary calendar position) from
      // semimonthly (period anchored to 1st/16th start or 15th/EOM end).
      const d1 = unique[i];
      const d2 = unique[i + 1];
      const day1 = d1.getDate();
      const day2 = d2.getDate();
      const eom = new Date(d2.getFullYear(), d2.getMonth() + 1, 0).getDate();
      return 'biweekly';
    }
  }

  return null; // couldn't determine
}

function findPaystubValues(fullText) {
  const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);
  let grossPay = null;
  let netPay = null;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase();

    let nums = extractMoney(lines[i]);
    if (!nums.length && i + 1 < lines.length) {
      nums = extractMoney(lines[i + 1]);
    }
    if (!nums.length) continue;

    const isGross =
      l.includes('salary') ||
      l.includes('regular pay') ||
      l.includes('regular earnings') ||
      l.includes('total earnings') ||
      l.includes('total gross') ||
      l.includes('gross total') ||
      l.includes('total pay') ||
      (l.includes('gross') &&
        (l.includes('pay') || l.includes('income') || l.includes('earnings') || l.includes('wage')));

    const isCheckLine =
      l.includes('dollars and') || (l.includes('pay to') && l.includes('order'));

    const isNet =
      isCheckLine ||
      l.includes('net pay') ||
      l.includes('net income') ||
      l.includes('net wages') ||
      l.includes('net check') ||
      l.includes('total net') ||
      l.includes('net amount') ||
      l.includes('amount paid') ||
      l.includes('check amount') ||
      (l.includes('direct deposit') && !/\b\d{6,}\b/.test(lines[i]));

    if (isGross && !grossPay) grossPay = nums[0];
    if (isNet && !netPay) {
      netPay = isCheckLine ? nums[nums.length - 1] : nums[0];
    }
  }

  // Smart fallback
  if (!grossPay || !netPay) {
    const candidates = [...new Set(extractMoney(fullText))]
      .filter((n) => n >= 300 && n <= 25000)
      .sort((a, b) => b - a);

    if (grossPay && !netPay) {
      netPay =
        candidates.find((n) => n < grossPay && n >= grossPay * 0.55 && n <= grossPay * 0.92) ??
        null;
    } else if (!grossPay && netPay) {
      grossPay =
        candidates.find((n) => n > netPay && n >= netPay / 0.92 && n <= netPay / 0.55) ?? null;
    } else {
      outer: for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const ratio = candidates[j] / candidates[i];
          if (ratio >= 0.55 && ratio <= 0.92) {
            grossPay = candidates[i];
            netPay = candidates[j];
            break outer;
          }
        }
      }
    }
  }

  const frequency = detectFrequency(fullText);
  return { grossPay: grossPay ?? null, netPay: netPay ?? null, frequency };
}

export async function extractFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => item.str).join(' ') + '\n';
  }

  console.log('=== PDF TEXT ===\n', fullText);
  return findPaystubValues(fullText);
}

export async function extractFromImage(file) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  const {
    data: { text },
  } = await worker.recognize(file);
  await worker.terminate();
  console.log('=== RAW OCR TEXT ===\n', text);
  return findPaystubValues(text);
}
