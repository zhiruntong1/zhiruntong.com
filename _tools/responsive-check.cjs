/* ==========================================================================
   HK ZANVIX — responsive overflow check
   Drives headless Chrome over the DevTools protocol with real device
   emulation, measures horizontal overflow per breakpoint, and captures
   full-page screenshots.
   Usage:  node docs/responsive-check.cjs
   ========================================================================== */
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '_tools', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, mobile: true, dsf: 2 },
  { name: 'tablet-768', width: 768, height: 1024, mobile: true, dsf: 2 },
  { name: 'laptop-1280', width: 1280, height: 800, mobile: false, dsf: 1 },
  { name: 'desktop-1600', width: 1600, height: 900, mobile: false, dsf: 1 }
];

const PAGES = ['/', '/services.html', '/culture.html', '/news.html', '/contact.html', '/privacy.html', '/terms.html'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url);
  return res.json();
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('timeout: ' + method)); }
      }, 30000);
    });
  }
}

const OVERFLOW_PROBE = `(() => {
  const de = document.documentElement;
  const limit = de.clientWidth;
  const offenders = [];
  const all = document.querySelectorAll('body *');
  for (const el of all) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    /* skip anything inside a fixed ancestor (off-canvas drawer, floating
       chrome) — it cannot widen the document */
    let fixedAncestor = false;
    let p = el.parentElement;
    while (p) { if (getComputedStyle(p).position === 'fixed') { fixedAncestor = true; break; } p = p.parentElement; }
    if (fixedAncestor) continue;
    if (r.right > limit + 1.5 || r.left < -1.5) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '').toString().slice(0, 70),
        left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width)
      });
    }
  }
  return {
    clientWidth: limit,
    scrollWidth: de.scrollWidth,
    overflowing: de.scrollWidth > limit + 1,
    offenders: offenders.slice(0, 8)
  };
})()`;

(async () => {
  const userDataDir = path.join(os.tmpdir(), 'zx-chrome-' + Date.now());
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--remote-debugging-port=' + PORT, '--user-data-dir=' + userDataDir,
    '--no-first-run', '--no-default-browser-check', 'about:blank'
  ], { stdio: 'ignore' });

  let version = null;
  for (let i = 0; i < 40; i++) {
    try { version = await getJson(`http://127.0.0.1:${PORT}/json/version`); break; }
    catch { await sleep(250); }
  }
  if (!version) { chrome.kill(); throw new Error('Chrome did not expose a debugging endpoint'); }
  console.log('Chrome ready: ' + version['Browser']);

  let failures = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\n===== ${vp.name} (${vp.width}x${vp.height}, dsf ${vp.dsf}) =====`);
    for (const route of PAGES) {
      const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
      const ws = new WebSocket(target.webSocketDebuggerUrl);
      await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
      const cdp = new CDP(ws);

      await cdp.send('Page.enable');
      await cdp.send('Runtime.enable');
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf, mobile: vp.mobile
      });
      await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8792' + route });
      await sleep(1800);
      /* let reveal animations settle */
      await sleep(700);

      const probe = await cdp.send('Runtime.evaluate', { expression: OVERFLOW_PROBE, returnByValue: true });
      const r = probe.result.value;
      const label = `${vp.name} ${route}`.padEnd(34);
      if (r.overflowing) {
        failures++;
        console.log(`  FAIL ${label} scrollWidth=${r.scrollWidth} > clientWidth=${r.clientWidth}`);
        for (const o of r.offenders) console.log(`         ${o.tag}.${o.cls}  left=${o.left} right=${o.right} w=${o.w}`);
      } else {
        console.log(`  ok   ${label} no horizontal overflow (${r.clientWidth}px)`);
      }

      if (vp.name === 'mobile-390' && (route === '/' || route === '/contact.html' || route === '/news.html')) {
        const shot = await cdp.send('Page.captureScreenshot', {
          format: 'png', captureBeyondViewport: true, fromSurface: true
        });
        const file = path.join(OUT, `_resp_${route === '/' ? 'home' : route.replace(/\//g, '').replace('.html', '')}.png`);        fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      }

      await cdp.send('Page.close').catch(() => {});
      ws.close();
      await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);
    }
  }

  chrome.kill();
  console.log('\n== RESULT ==');
  console.log(`  overflow failures: ${failures}`);
  console.log(failures === 0 ? '\n  PASS — no horizontal overflow at any breakpoint.\n' : '\n  RESPONSIVE CHECK FAILED.\n');
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
