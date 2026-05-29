/**
 * PaySplit demo video generator — cinematic edition
 *
 * Setup (one-time):
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Run:
 *   node demo-video.mjs
 *
 * Output: demo-output/paysplit-demo.mp4  (1080×1920, Reels/TikTok ready)
 */

import { chromium }         from 'playwright';
import { execSync, spawn }  from 'child_process';
import fs                   from 'fs';
import path                 from 'path';
import { fileURLToPath }    from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'demo-output');
const PORT       = 4173;
const VIEWPORT   = { width: 390, height: 693 }; // exactly 9:16

// ── Intro card ──────────────────────────────────────────────────────────────
// Rendered by Playwright at 1080×1920 then Ken-Burns-zoomed by ffmpeg
const INTRO_HTML = /* html */`<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{
  width:1080px;height:1920px;overflow:hidden;
  background:linear-gradient(160deg,#0a0e1a 0%,#0d1f3c 45%,#0a1628 100%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  position:relative;
}
.blob{
  position:absolute;border-radius:50%;filter:blur(90px);opacity:0.18;
  pointer-events:none;
}
.pill{
  background:rgba(59,130,246,0.15);
  border:1.5px solid rgba(59,130,246,0.35);
  color:#93c5fd;
  font-size:34px;font-weight:600;letter-spacing:0.5px;
  padding:14px 40px;border-radius:100px;
  margin-bottom:52px;
}
h1{
  font-size:112px;font-weight:900;line-height:1.02;letter-spacing:-4px;
  color:#fff;text-align:center;margin-bottom:36px;
}
h1 em{
  font-style:normal;
  background:linear-gradient(90deg,#60a5fa 0%,#34d399 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  background-clip:text;
}
.sub{
  font-size:38px;color:rgba(255,255,255,0.5);text-align:center;
  font-weight:500;line-height:1.45;max-width:780px;
}
.cta{
  margin-top:90px;
  background:linear-gradient(135deg,#2563eb,#1d4ed8);
  box-shadow:0 24px 60px rgba(37,99,235,0.35);
  color:#fff;font-size:42px;font-weight:700;letter-spacing:-0.5px;
  padding:28px 72px;border-radius:26px;
}
.brand{
  position:absolute;bottom:72px;
  font-size:30px;font-weight:600;letter-spacing:4px;text-transform:uppercase;
  color:rgba(255,255,255,0.2);
}
.emoji{font-size:148px;line-height:1;margin-bottom:44px;}
</style>
</head>
<body>
  <div class="blob" style="width:900px;height:900px;background:#1e40af;top:-280px;left:-260px;"></div>
  <div class="blob" style="width:700px;height:700px;background:#065f46;bottom:-220px;right:-200px;"></div>
  <div class="emoji">💰</div>
  <div class="pill">Free Paycheck Budget Calculator</div>
  <h1>Know where<br>every <em>dollar</em><br>should go</h1>
  <p class="sub">Enter your paycheck →<br>get a personalized budget in seconds</p>
  <div class="cta">See your budget →</div>
  <div class="brand">PaySplit</div>
</body>
</html>`;

// ── Helpers ─────────────────────────────────────────────────────────────────

const sleep  = (ms)           => new Promise(r => setTimeout(r, ms));
const jitter = (base, spread) => Math.max(30, base + (Math.random() - 0.5) * spread);

// Track mouse so smooth-click moves from wherever we last were
let mx = VIEWPORT.width / 2, my = VIEWPORT.height / 2;

// Ease-in-out cubic: smooth S-curve
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

async function smoothClick(page, locator) {
  // Ensure element is in viewport before computing coordinates
  await locator.scrollIntoViewIfNeeded();
  await sleep(120);
  const box = await locator.boundingBox();
  if (!box) { await locator.click(); return; }
  const tx = Math.min(box.x + box.width  / 2, VIEWPORT.width  - 2);
  const ty = Math.min(box.y + box.height / 2, VIEWPORT.height - 2);
  const steps = 18;
  for (let i = 1; i <= steps; i++) {
    const e = easeInOutCubic(i / steps);
    await page.mouse.move(mx + (tx - mx) * e, my + (ty - my) * e);
    await sleep(8);
  }
  await page.mouse.click(tx, ty);
  mx = tx; my = ty;
}

// Smooth scroll with cubic easing — feels cinematic, not janky
async function easeScroll(page, totalPx, durationMs = 900) {
  const steps = Math.max(1, Math.ceil(durationMs / 16));
  const delay = durationMs / steps;
  let prev = 0;
  for (let i = 1; i <= steps; i++) {
    const curr = Math.round(totalPx * easeInOutCubic(i / steps));
    const delta = curr - prev;
    if (delta) await page.mouse.wheel(0, delta);
    prev = curr;
    await sleep(delay);
  }
}

async function slowType(page, text) {
  for (const char of text) {
    await page.keyboard.type(char);
    await sleep(jitter(55, 30)); // faster typing for tighter pacing
  }
}

// Inject a floating caption overlay directly into the recorded page
async function showCaption(page, text) {
  await page.evaluate((t) => {
    document.getElementById('_cap')?.remove();
    const s = document.createElement('style');
    s.id = '_cap_style';
    s.textContent = `
      @keyframes _capIn  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
      @keyframes _capOut { from { opacity:1 } to { opacity:0; transform:translateY(-8px) } }
      #_cap { animation: _capIn 0.35s cubic-bezier(.22,1,.36,1) both }
      #_cap.out { animation: _capOut 0.3s ease forwards }
    `;
    document.head.appendChild(s);
    const el = document.createElement('div');
    el.id = '_cap';
    el.style.cssText = `
      position:fixed;bottom:28px;left:14px;right:14px;z-index:2147483647;
      background:rgba(10,14,26,0.88);
      border:1px solid rgba(255,255,255,0.10);
      backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
      color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      font-size:21px;font-weight:700;line-height:1.35;
      padding:14px 20px;border-radius:18px;text-align:center;
      box-shadow:0 8px 40px rgba(0,0,0,0.5);
      pointer-events:none;
    `;
    el.textContent = t;
    document.body.appendChild(el);
  }, text);
}

async function hideCaption(page) {
  await page.evaluate(() => {
    const el = document.getElementById('_cap');
    if (!el) return;
    el.classList.add('out');
    setTimeout(() => el.remove(), 320);
  });
  await sleep(340);
}

// Brief white flash to cover abrupt step transitions in the React app
async function transitionFade(page) {
  await page.evaluate(() => {
    document.getElementById('_tfade')?.remove();
    const o = document.createElement('div');
    o.id = '_tfade';
    o.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:#f9fafb;opacity:0;transition:opacity 0.22s;pointer-events:none;';
    document.body.appendChild(o);
    requestAnimationFrame(() => requestAnimationFrame(() => { o.style.opacity = '1'; }));
  });
  await sleep(280);
}

async function transitionUnfade(page) {
  await page.evaluate(() => {
    const o = document.getElementById('_tfade');
    if (o) { o.style.opacity = '0'; setTimeout(() => o.remove(), 260); }
  });
  await sleep(320);
}

function killServer(proc) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${proc.pid} /F /T`, { stdio: 'pipe' });
    } else {
      proc.kill('SIGTERM');
    }
  } catch { /* already gone */ }
}

function ffmpeg(cmd) {
  execSync(`ffmpeg ${cmd}`, { stdio: 'inherit' });
}

function ffprobe(file) {
  return parseFloat(
    execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`
    ).toString().trim()
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Wipe previous run artefacts
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (/\.(webm|mp4|png)$/.test(f)) fs.unlinkSync(path.join(OUTPUT_DIR, f));
  }

  console.log('Starting preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    cwd: __dirname, shell: true, stdio: 'pipe',
  });
  await sleep(3500);

  const browser = await chromium.launch({ headless: true });

  // ── Render intro card ──────────────────────────────────────────────────────
  // Render at 1200×2134 (11% oversized) so the Ken Burns zoom has headroom
  const introCtx  = await browser.newContext({ viewport: { width: 1200, height: 2134 } });
  const introPage = await introCtx.newPage();
  await introPage.setContent(INTRO_HTML, { waitUntil: 'domcontentloaded' });
  await sleep(400);
  const introPng = path.join(OUTPUT_DIR, 'intro.png');
  await introPage.screenshot({ path: introPng });
  await introCtx.close();
  console.log('Intro card rendered.');

  // ── Record demo ────────────────────────────────────────────────────────────
  const demoCtx = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: OUTPUT_DIR, size: VIEWPORT },
    colorScheme: 'light',
  });
  const page = await demoCtx.newPage();

  try {
    console.log('Recording demo...');

    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle' });
    await sleep(500);

    // ── Step 1: Income ──────────────────────────────────────────────────────
    await showCaption(page, '💵 Step 1 — enter your paycheck');
    await sleep(250);

    await smoothClick(page, page.locator('input[type="number"]').first());
    await sleep(200);
    await slowType(page, '5200');
    await sleep(200);

    await smoothClick(page, page.locator('button', { hasText: 'Bi-weekly' }));
    await sleep(250);

    await smoothClick(page, page.locator('input[type="number"]').nth(1));
    await sleep(200);
    await slowType(page, '3847');
    await sleep(300);

    await hideCaption(page);

    await smoothClick(page, page.locator('button', { hasText: 'Save Income' }));
    await sleep(500);

    // Fade covers the React step transition so there's no jarring jump
    await transitionFade(page);
    await smoothClick(page, page.locator('button', { hasText: 'Continue with' }));
    await sleep(450);
    await transitionUnfade(page);

    // ── Step 2: Profile ─────────────────────────────────────────────────────
    await showCaption(page, '👤 Step 2 — tell us about yourself');
    await sleep(200);

    // Age slider — React controlled inputs need native value setter + events
    for (const v of ['30', '28']) {
      await page.evaluate((val) => {
        const el = document.querySelector('input[type="range"]');
        if (!el) return;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
          .set.call(el, val);
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, v);
      await sleep(220);
    }
    await sleep(180);

    await smoothClick(page, page.getByRole('button', { name: '2', exact: true }));
    await sleep(180);

    for (const goal of ['Buy a House', 'Retire Early', 'Travel More']) {
      await smoothClick(page, page.locator('button', { hasText: goal }));
      await sleep(180);
    }
    await sleep(180);

    await hideCaption(page);

    // Fade covers the budget calculation render
    await transitionFade(page);
    await smoothClick(page, page.locator('button', { hasText: 'See My Budget' }));
    await sleep(450);
    await transitionUnfade(page);

    // ── Step 3: Budget breakdown ────────────────────────────────────────────
    await showCaption(page, '📊 Your personalized budget — instantly');
    await sleep(200);

    await easeScroll(page, 180, 600);
    await sleep(250);
    await easeScroll(page, 220, 600);
    await sleep(250);

    await hideCaption(page);

    // Tap retirement card to expand projection
    await smoothClick(page, page.locator('.rounded-2xl', { hasText: 'Retirement / Investing' }).first());
    await sleep(300);

    // Caption narrates while scrolling to the projection numbers
    await showCaption(page, '📈 See how much you could retire with');
    await easeScroll(page, 150, 500);
    await sleep(180);
    await easeScroll(page, 180, 500);
    await sleep(180);
    await easeScroll(page, 130, 500);

    // Hide caption BEFORE the money shot — let the numbers breathe
    await hideCaption(page);
    await sleep(250);

    // Hold clean on the retirement projection numbers
    await sleep(2500);

    // Drift back to top before outro
    await easeScroll(page, -700, 1000);
    await sleep(400);

    // ── Outro — reset scroll first so fixed overlay is pixel-perfect ─────────
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
      const d = document.createElement('div');
      d.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;
        background:linear-gradient(160deg,#0a0e1a 0%,#0d1f3c 50%,#0a1628 100%);
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
        opacity:0;transition:opacity 0.7s ease;
      `;
      d.innerHTML = `
        <div style="font-size:90px;margin-bottom:28px;line-height:1">💰</div>
        <div style="font-size:64px;font-weight:900;color:#fff;letter-spacing:-2.5px;margin-bottom:16px">PaySplit</div>
        <div style="font-size:30px;color:rgba(255,255,255,0.45);margin-bottom:52px;font-weight:500">Free paycheck budget calculator</div>
        <div style="background:rgba(59,130,246,0.15);border:1.5px solid rgba(59,130,246,0.4);color:#93c5fd;
                    font-size:32px;font-weight:700;padding:18px 44px;border-radius:100px;letter-spacing:0.3px">
          payslicr.netlify.app
        </div>
      `;
      document.body.appendChild(d);
      requestAnimationFrame(() => requestAnimationFrame(() => { d.style.opacity = '1'; }));
    });
    await sleep(2100);

  } finally {
    await demoCtx.close(); // finalises the .webm
    await browser.close();
    killServer(server);
  }

  // ── Post-process ──────────────────────────────────────────────────────────

  const [webm] = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.webm'))
    .map(f => path.join(OUTPUT_DIR, f));
  if (!webm) throw new Error('No recording found in ' + OUTPUT_DIR);

  const rawDemo  = path.join(OUTPUT_DIR, '_demo_raw.mp4');
  const introMp4 = path.join(OUTPUT_DIR, '_intro.mp4');
  const finalOut = path.join(OUTPUT_DIR, 'paysplit-demo.mp4');

  const demoDuration = ffprobe(webm);
  const fadeOutAt    = (demoDuration - 0.9).toFixed(2);
  console.log(`\nDemo recording: ${demoDuration.toFixed(1)}s`);

  // 1. Convert demo webm → scaled MP4 with fade-out
  console.log('Encoding demo...');
  ffmpeg([
    '-y -i', `"${webm}"`,
    '-vf', `"scale=1080:1920:flags=lanczos,fade=t=out:st=${fadeOutAt}:d=0.9"`,
    '-c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart',
    `"${rawDemo}"`,
  ].join(' '));

  // 2. Intro PNG → 2.5s video with Ken Burns slow-zoom
  console.log('Creating intro clip...');
  ffmpeg([
    '-y -loop 1 -framerate 25 -i', `"${introPng}"`,
    '-t 2.5',
    '-vf', '"zoompan=z=\'if(lte(on\\,1)\\,1.1\\,max(1.001\\,zoom-0.004))\':x=\'iw/2-(iw/zoom/2)\':y=\'ih/2-(ih/zoom/2)\':d=62:s=1080x1920:fps=25,fade=t=in:st=0:d=0.6"',
    '-c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r 25',
    `"${introMp4}"`,
  ].join(' '));

  // 3. Concatenate intro + demo with cross-dissolve
  console.log('Merging...');
  ffmpeg([
    '-y',
    `-i "${introMp4}"`,
    `-i "${rawDemo}"`,
    '-filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=2.0[v]"',
    '-map "[v]"',
    '-c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart',
    `"${finalOut}"`,
  ].join(' '));

  // Clean up intermediates
  [webm, rawDemo, introMp4, introPng].forEach(f => { try { fs.unlinkSync(f); } catch {} });

  const total = ffprobe(finalOut);
  console.log(`\n✅  Done!`);
  console.log(`   ${finalOut}`);
  console.log(`   ${total.toFixed(1)}s · 1080×1920 · ready to post`);
  console.log('\nRe-run anytime after changes: npm run build && node demo-video.mjs');
}

main().catch(err => { console.error('\n❌', err.message); process.exit(1); });
