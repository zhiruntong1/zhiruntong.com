/* ==========================================================================
   HK ZANVIX — served-site smoke test
   Boots a local static server on 127.0.0.1 and verifies that every page and
   every referenced asset is actually served, that the sprite parses, and that
   the SEO / header / footer contracts hold over HTTP (the protocol the site
   is deployed under).
   Usage:  node docs/smoke-test.cjs
   ========================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8791;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

let failures = 0;
const fail = (m) => { failures++; console.log('  FAIL  ' + m); };
const ok = (m) => console.log('  ok    ' + m);

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<html><body>404</body></html>');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const ROUTES = ['/', '/services.html', '/culture.html', '/news.html', '/contact.html',
  '/privacy.html', '/terms.html', '/404.html'];

(async () => {
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  const base = `http://127.0.0.1:${PORT}`;
  console.log(`\n== SERVED SMOKE TEST (${base}) ==\n`);

  console.log('--- pages ---');
  const bodies = {};
  for (const route of ROUTES) {
    const res = await fetch(base + route);
    const body = await res.text();
    bodies[route] = body;
    if (res.status !== 200) { fail(`${route} -> HTTP ${res.status}`); continue; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) { fail(`${route} -> unexpected content-type ${ct}`); continue; }
    if (!body.includes('<header id="site-header"></header>')) { fail(`${route} -> header placeholder missing`); continue; }
    if (!body.includes('<footer id="site-footer"></footer>')) { fail(`${route} -> footer placeholder missing`); continue; }
    if (!body.includes('js/main.js')) { fail(`${route} -> main.js not referenced`); continue; }
    if (!body.includes('css/style.css')) { fail(`${route} -> style.css not referenced`); continue; }
    if (body.includes('index.html')) { fail(`${route} -> served markup contains index.html`); continue; }
    ok(`${route} -> 200, placeholders intact, index-free markup`);
  }

  console.log('\n--- assets ---');
  const assets = ['/css/style.css', '/js/main.js', '/images/sprite.svg', '/images/favicon.svg',
    '/images/hero.jpg', '/images/app-1.jpg', '/images/app-2.jpg', '/images/app-phone.jpg',
    '/images/map.jpg', '/images/news-1.jpg', '/images/news-8.jpg',
    '/robots.txt', '/sitemap.xml', '/app-ads.txt'];
  for (const a of assets) {
    const res = await fetch(base + a);
    const buf = Buffer.from(await res.arrayBuffer());
    if (res.status !== 200) { fail(`${a} -> HTTP ${res.status}`); continue; }
    if (buf.length === 0 && a !== '/app-ads.txt') { fail(`${a} -> served empty`); continue; }
    ok(`${a} -> 200, ${(buf.length / 1024).toFixed(1)} KB, ${res.headers.get('content-type')}`);
  }

  console.log('\n--- sprite integrity over HTTP ---');
  const spriteRes = await fetch(base + '/images/sprite.svg');
  const sprite = await spriteRes.text();
  const ids = [...sprite.matchAll(/<symbol[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
  if (!sprite.trim().endsWith('</svg>')) fail('sprite.svg is truncated');
  else ok(`sprite.svg parses as a complete SVG with ${ids.length} symbols`);
  const need = ['logo', 'menu', 'close', 'apple', 'google-play', 'rocket-cat', 'panda'];
  for (const id of need) if (!ids.includes(id)) fail('sprite missing ' + id);
  ok('spot-check symbols (logo, menu, close, apple, google-play, mascots) all present');

  console.log('\n--- every <use> target resolves ---');
  const missing = new Set();
  for (const route of ROUTES) {
    for (const m of bodies[route].matchAll(/<use[^>]*href="#([^"]+)"/g)) {
      if (!ids.includes(m[1])) missing.add(m[1]);
    }
  }
  if (missing.size) fail('unresolved sprite references: ' + [...missing].join(', '));
  else ok('all served pages reference only existing symbols');

  console.log('\n--- seo payload over HTTP ---');
  const home = bodies['/'];
  const canon = (home.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (canon !== 'https://zhiruntong.com/') fail('home canonical is ' + canon);
  else ok('home canonical = https://zhiruntong.com/ (no index.html)');
  const hrefs = [...home.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  const homeLinks = hrefs.filter((h) => h === './' || h === 'index.html');
  if (homeLinks.some((h) => h.includes('index.html'))) fail('a home link leaks index.html into the served URL');
  else ok('all home links stay index-free over HTTP');

  console.log('\n--- sitemap / robots ---');
  const sm = await (await fetch(base + '/sitemap.xml')).text();
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (locs.length !== 7) fail('sitemap has ' + locs.length + ' urls, expected 7');
  else ok('sitemap lists 7 URLs');
  if (locs.some((l) => l.includes('index.html'))) fail('sitemap leaks index.html');
  else ok('no index.html in sitemap');
  const rb = await (await fetch(base + '/robots.txt')).text();
  if (!rb.includes('Sitemap: https://zhiruntong.com/sitemap.xml')) fail('robots.txt sitemap reference wrong');
  else ok('robots.txt points at the served sitemap');

  server.close();
  console.log('\n== RESULT ==');
  console.log(`  failures: ${failures}`);
  console.log(failures === 0 ? '\n  PASS — site serves correctly.\n' : '\n  SMOKE TEST FAILED.\n');
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
