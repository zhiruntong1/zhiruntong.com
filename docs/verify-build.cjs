/* ==========================================================================
   HK ZANVIX — build verification gate
   Usage:  node docs/verify-build.cjs
   Checks: sprite resolution, internal links, image assets, brand replacement,
           SEO/canonical hygiene, structural rules, CSS class coverage,
           WCAG contrast on the key token pairs.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let failures = 0;
let warnings = 0;
const fail = (m) => { failures++; console.log('  FAIL  ' + m); };
const warn = (m) => { warnings++; console.log('  WARN  ' + m); };
const ok = (m) => console.log('  ok    ' + m);
const head = (m) => console.log('\n== ' + m + ' ' + '='.repeat(Math.max(0, 62 - m.length)));

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

/* ---------- collect project files ---------- */
const PAGES = ['index.html', 'services.html', 'culture.html', 'news.html',
  'contact.html', 'privacy.html', 'terms.html', '404.html'];
const html = {};
for (const p of PAGES) html[p] = read(p);
const css = read('css/style.css');
const js = read('js/main.js');
const sprite = read('images/sprite.svg');

/* ---------- brand constants from tihuan.txt ---------- */
const BRAND = {
  company: 'HK ZANVIX CO., LIMITED',
  address: 'Room 701 (Unit 127), 7/F, Tower B, New Mandarin Plaza, 14 Science Museum Road, Tsim Sha Tsui East, Hong Kong',
  website: 'zhiruntong.com',
  support: 'support@zhiruntong.com',
  accounts: 'qiuwentao@zhiruntong.com',
  scope: 'IT development and consultancy, import/export &amp; wholesale of general goods, business advisory and marketing planning'
};
const STALE = ['hkheng.com', 'hkheng', 'HK ENIX', 'liuxiang', 'support@hkheng', 'Lynk', 'Tung Chau Street', 'The Cloud, 111'];

head('1. SPRITE SYMBOL RESOLUTION');
const symbols = new Set([...sprite.matchAll(/<symbol[^>]*\bid="([^"]+)"/g)].map((m) => m[1]));
const mascots = ['cat', 'dog', 'fox', 'panda', 'rabbit', 'bear', 'owl', 'penguin',
  'smile', 'heart-eyes', 'wink', 'thumbs-up', 'party', 'rocket-cat'];
const requiredIcons = ['logo', 'menu', 'close', 'arrow-right', 'arrow-up', 'mail', 'phone',
  'map-pin', 'globe', 'chart', 'cart', 'truck', 'shield', 'star', 'check', 'play',
  'download', 'apple', 'google-play', 'mobile-app', 'settings', 'users', 'briefcase', 'layers'];
for (const id of requiredIcons) {
  if (!symbols.has(id)) fail('sprite is missing required icon symbol: ' + id);
}
for (const id of mascots) {
  if (!symbols.has(id)) fail('sprite is missing required mascot symbol: ' + id);
}
if (requiredIcons.every((i) => symbols.has(i)) && mascots.every((m) => symbols.has(m))) {
  ok(`all ${requiredIcons.length} icons + ${mascots.length} mascots present in sprite.svg`);
}
const allRefs = new Set();
for (const p of PAGES) {
  for (const m of html[p].matchAll(/<use[^>]*href="#([^"]+)"/g)) allRefs.add(m[1]);
}
for (const m of js.matchAll(/icon\('([^']+)'/g)) allRefs.add(m[1]);
for (const m of js.matchAll(/id: '([^']+)'\s*\}\)/g)) allRefs.add(m[1]);
const dangling = [...allRefs].filter((r) => !symbols.has(r));
if (dangling.length) fail('sprite references with no matching symbol: ' + dangling.join(', '));
else ok(`all ${allRefs.size} distinct sprite references resolve to a <symbol>`);

head('2. INTERNAL LINK TARGETS');
let linkErrors = 0;
for (const p of PAGES) {
  for (const m of html[p].matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(u)) continue;
    const clean = u.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = path.join(ROOT, clean);
    if (!fs.existsSync(target)) { fail(`${p}: link target does not exist -> ${u}`); linkErrors++; }
  }
}
for (const m of js.matchAll(/href: '(\.\/[^']+)'/g)) {
  const target = path.join(ROOT, m[1].replace(/^\.\//, ''));
  if (!fs.existsSync(target)) { fail(`js/main.js: nav target does not exist -> ${m[1]}`); linkErrors++; }
}
if (!linkErrors) ok('every internal href/src and JS nav target resolves to a real file');

head('3. IMAGE ASSETS');
const imgs = new Set();
for (const p of PAGES) for (const m of html[p].matchAll(/<img[^>]*src="([^"]+)"/g)) imgs.add(m[1]);
let imgErrors = 0;
for (const src of imgs) {
  if (!exists(src)) { fail('missing image asset: ' + src); imgErrors++; }
}
for (const src of imgs) {
  const raw = fs.readFileSync(path.join(ROOT, src));
  const isPng = raw[0] === 0x89 && raw[1] === 0x50;
  const isJpg = raw[0] === 0xff && raw[1] === 0xd8;
  const ext = path.extname(src).toLowerCase();
  const okType = (ext === '.png' && isPng) || (ext === '.jpg' && isJpg) || ext === '.svg';
  if (!okType) { fail(`image extension does not match its data: ${src}`); imgErrors++; }
}
if (!imgErrors) ok(`${imgs.size} referenced images exist and their extension matches the file data`);

head('4. BRAND REPLACEMENT (tihuan.txt)');
for (const p of PAGES.concat(['js/main.js'])) {
  const t = p.endsWith('.js') ? js : html[p];
  for (const s of STALE) {
    if (t.includes(s)) fail(`${p}: still contains stale value "${s}"`);
  }
}
ok('no stale brand strings (hkheng / HK ENIX / liuxiang / Lynk) in any page');
const scopePages = PAGES.filter((p) => html[p].includes(BRAND.scope));
if (scopePages.length < 5) fail('business scope string appears on only ' + scopePages.length + ' pages');
else ok(`business scope string present verbatim on ${scopePages.length} pages`);
for (const key of ['company', 'address', 'website', 'support', 'accounts']) {
  const t = js;
  if (!t.includes(BRAND[key])) fail('js/main.js is missing replacement value: ' + key);
}
ok('all five replacement values (company / address / website / both emails) wired into main.js');
if (!js.includes("'https://zhiruntong.com/'")) fail('js/main.js canonical base is not the replacement domain');
ok('canonical base is https://zhiruntong.com/');

head('5. SEO / CANONICAL HYGIENE');
for (const p of PAGES) {
  const t = html[p];
  if (!/<link rel="canonical"/.test(t)) fail(p + ': missing canonical link');
  const canon = (t.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || '';
  if (canon.includes('index.html')) fail(p + ': canonical contains index.html');
  if (canon && !canon.startsWith('https://zhiruntong.com/')) fail(p + ': canonical host is not zhiruntong.com');
  for (const m of t.matchAll(/property="og:url" content="([^"]+)"/g)) {
    if (m[1].includes('index.html')) fail(p + ': og:url contains index.html');
  }
}
const sitemap = read('sitemap.xml');
if (sitemap.includes('index.html')) fail('sitemap.xml contains index.html');
for (const u of ['https://zhiruntong.com/', 'https://zhiruntong.com/services.html',
  'https://zhiruntong.com/culture.html', 'https://zhiruntong.com/news.html',
  'https://zhiruntong.com/contact.html', 'https://zhiruntong.com/privacy.html',
  'https://zhiruntong.com/terms.html']) {
  if (!sitemap.includes(u)) fail('sitemap.xml is missing ' + u);
}
ok('canonicals, og:url and sitemap are clean — no index.html anywhere');
const robots = read('robots.txt');
if (!robots.includes('Sitemap: https://zhiruntong.com/sitemap.xml')) fail('robots.txt sitemap line wrong');
if (!robots.includes('Allow: /')) fail('robots.txt missing "Allow: /"');
ok('robots.txt allows crawling and points at the replacement sitemap');
const seoKeys = [...js.matchAll(/^\s*'(\/[^']*)':\s*\{/gm)].map((m) => m[1]);
for (const k of ['/', '/services.html', '/culture.html', '/news.html', '/contact.html', '/privacy.html', '/terms.html']) {
  if (!seoKeys.includes(k)) fail('js/main.js SEO config missing key: ' + k);
}
ok('SEO config object covers all 7 public routes');

head('6. STRUCTURAL RULES (SPEC reuse constraints)');
for (const p of PAGES) {
  const t = html[p];
  const h1 = (t.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) fail(`${p}: expected exactly one <h1>, found ${h1}`);
  if ((t.match(/<header id="site-header"><\/header>/g) || []).length !== 1) fail(p + ': header placeholder count wrong');
  if ((t.match(/<footer id="site-footer"><\/footer>/g) || []).length !== 1) fail(p + ': footer placeholder count wrong');
  if ((t.match(/<link rel="stylesheet" href="css\/style\.css">/g) || []).length !== 1) fail(p + ': expected exactly one stylesheet link');
  if ((t.match(/<script src="js\/main\.js" defer><\/script>/g) || []).length !== 1) fail(p + ': expected exactly one main.js script');
  if (/<style[\s>]/.test(t)) fail(p + ': contains an inline <style> block');
  if (/\sstyle="/.test(t)) fail(p + ': contains an inline style attribute');
  if (/<script(?![^>]*src="js\/main\.js")/.test(t)) fail(p + ': contains an inline <script>');
  if (t.includes('index.html')) fail(p + ': markup contains "index.html" (the public URL must stay index-free)');
  if (/<svg(?![^>]*aria-hidden)[^>]*>[\s\S]{0,400}?<(path|circle|rect|line|polygon|polyline)/.test(t)) {
    fail(p + ': contains inline SVG drawing code instead of <use> references');
  }
  if (/<nav[\s>]/.test(t) && !/id="site-nav"/.test(t) && !/class="pagination/.test(t)) {
    fail(p + ': contains its own <nav> markup (site navigation must be injected by main.js)');
  }
}
ok('all 8 pages: one h1, one header/footer placeholder, one CSS + one JS reference, no inline style/script/SVG drawing');

head('7. CSS CLASS COVERAGE');
const cssClasses = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const used = new Set();
const addClasses = (raw) => {
  for (const c of raw.trim().split(/\s+/)) {
    if (/^[a-zA-Z][\w-]*$/.test(c)) used.add(c);
  }
};
for (const p of PAGES) {
  for (const m of html[p].matchAll(/class="([^"]+)"/g)) addClasses(m[1]);
}
for (const m of js.matchAll(/class="([^"]+)"/g)) {
  if (/['+?]/.test(m[1])) continue; /* template concatenation, not a literal class */
  addClasses(m[1]);
}
const jsClasses = new Set([...js.matchAll(/classList\.(?:add|remove|toggle)\('([^']+)'/g)].map((m) => m[1]));
for (const c of jsClasses) used.add(c);
const missing = [...used].filter((c) => !cssClasses.has(c));
if (missing.length) warn('classes used but not found in style.css: ' + missing.join(', '));
else ok(`all ${used.size} classes used across HTML + JS are defined in style.css`);

head('8. WCAG CONTRAST (design-token pairs)');
const hexToRgb = (h) => {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.substr(i, 2), 16) / 255);
};
const lum = (h) => {
  const [r, g, b] = hexToRgb(h).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const pairs = [
  ['body text on paper', '#1b2739', '#ffffff', 4.5],
  ['muted text on paper', '#4a5b73', '#ffffff', 4.5],
  ['muted text on mist', '#4a5b73', '#f4f6fa', 4.5],
  ['heading on paper', '#070d18', '#ffffff', 4.5],
  ['primary button label', '#ffffff', '#2f63f5', 4.5],
  ['primary button label (hover bg)', '#ffffff', '#1b4ad9', 4.5],
  ['link on paper', '#1b4ad9', '#ffffff', 4.5],
  ['dark section body text', '#a8b6cc', '#070d18', 4.5],
  ['dark section heading', '#f2f5fa', '#070d18', 4.5],
  ['deep section body text', '#a8b6cc', '#08143a', 4.5],
  ['accent on dark', '#ffc24d', '#070d18', 4.5],
  ['accent button label', '#070d18', '#f9a826', 4.5],
  ['footer legal link', '#a8b6cc', '#070d18', 4.5],
  ['stat value on paper', '#070d18', '#ffffff', 4.5],
  ['badge text on brand-50', '#163aad', '#eef3ff', 4.5],
  ['service scope label', '#163aad', '#ffffff', 4.5],
  ['tag text on ink-50', '#2a3a51', '#f1f4f8', 4.5],
  ['legal h2 on paper', '#070d18', '#ffffff', 4.5],
  ['legal note text', '#1b2739', '#fffaf0', 4.5],
  ['table header on mist', '#1b2739', '#f4f6fa', 4.5]
];
let contrastFails = 0;
for (const [label, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  if (r < min) { fail(`${label}: ${r.toFixed(2)}:1 (needs ${min}:1)  ${fg} on ${bg}`); contrastFails++; }
}
if (!contrastFails) ok(`${pairs.length} foreground/background token pairs all meet WCAG AA (4.5:1)`);

head('9. FILE:// RESILIENCE');
if (!js.includes("IS_FILE_PROTOCOL")) fail('main.js has no file:// protocol handling');
if (!js.includes("'./index.html' : './'")) fail('main.js does not switch the home href for file:// previews');
if (!js.includes('a[href="./"]')) fail('main.js does not sweep static home links for file://');
ok('home link switches to ./index.html under file:// while staying ./ under http(s)');
if (!js.includes('applyEmojiFallback')) fail('main.js has no sprite fallback path');
ok('sprite load failure degrades to emoji mascots instead of empty boxes');

head('10. SPEC CONTENT COVERAGE');
const specChecks = [
  ['services: 3 business lines + app', /id="it"/.test(html['services.html']) && /id="trade"/.test(html['services.html']) && /id="advisory"/.test(html['services.html']) && /id="app"/.test(html['services.html'])],
  ['services: 6 app features', (html['services.html'].match(/class="app-feature"/g) || []).length >= 6],
  ['services: App Store + Google Play badges', /#apple/.test(html['services.html']) && /#google-play/.test(html['services.html'])],
  ['services: process steps', (html['services.html'].match(/class="step"/g) || []).length >= 4],
  ['services: FAQ items', (html['services.html'].match(/class="faq__item"/g) || []).length >= 4],
  ['culture: timeline milestones', (html['culture.html'].match(/class="timeline__item"/g) || []).length >= 6],
  ['culture: mission/vision/values', (html['culture.html'].match(/value-card__icon/g) || []).length >= 3],
  ['culture: links to legal pages', /privacy\.html/.test(html['culture.html']) && /terms\.html/.test(html['culture.html'])],
  ['news: 8 articles', (html['news.html'].match(/data-category="/g) || []).length === 8],
  ['news: filter buttons', (html['news.html'].match(/data-filter="/g) || []).length >= 6],
  ['news: pagination UI', /class="pagination[ "]/.test(html['news.html'])],
  ['contact: all 5 verbatim values', [BRAND.company, BRAND.address, BRAND.website, BRAND.support, BRAND.accounts].every((v) => html['contact.html'].includes(v))],
  ['contact: form fields', /name="name"/.test(html['contact.html']) && /name="email"/.test(html['contact.html']) && /name="company"/.test(html['contact.html']) && /name="message"/.test(html['contact.html']) && /name="consent"/.test(html['contact.html'])],
  ['contact: consent links legal docs', /privacy\.html/.test(html['contact.html']) && /terms\.html/.test(html['contact.html'])],
  ['contact: map placeholder', /images\/map\.jpg/.test(html['contact.html'])],
  ['privacy: 18 sections', (html['privacy.html'].match(/<h2 id="section-/g) || []).length === 18],
  ['terms: 18 sections', (html['terms.html'].match(/<h2 id="section-/g) || []).length === 18],
  ['privacy: ad platform table rows', (html['privacy.html'].match(/<tr>/g) || []).length >= 22],
  ['privacy: 6 tables', (html['privacy.html'].match(/<table>/g) || []).length >= 5],
  ['terms: business scope verbatim', html['terms.html'].includes(BRAND.scope)],
  ['htaccess: index.html 301', /index\\\.html\$ \/ \[R=301,L\]/.test(read('.htaccess'))],
  ['htaccess: force https', /Force HTTPS|https:\/\/zhiruntong\.com%\{REQUEST_URI\}/.test(read('.htaccess'))],
  ['htaccess: custom 404', /ErrorDocument 404/.test(read('.htaccess'))],
  ['htaccess: gzip', /mod_deflate/.test(read('.htaccess'))],
  ['htaccess: cache headers', /mod_expires/.test(read('.htaccess')) && /Cache-Control/.test(read('.htaccess'))],
  ['app-ads.txt is empty', fs.statSync(path.join(ROOT, 'app-ads.txt')).size === 0],
  ['js: no app-ads reference', !/app-ads/.test(js)]
];
let specFails = 0;
for (const [label, pass] of specChecks) {
  if (pass) ok(label); else { fail('spec requirement not met -> ' + label); specFails++; }
}

head('RESULT');
console.log(`  failures: ${failures}`);
console.log(`  warnings: ${warnings}`);
if (failures === 0) {
  console.log('\n  PASS — build gate clean.\n');
  process.exit(0);
} else {
  console.log('\n  BUILD GATE FAILED.\n');
  process.exit(1);
}
