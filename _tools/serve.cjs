/* ==========================================================================
   HK ZANVIX — local preview server
   Serves the site over HTTP so you can preview it exactly as it will behave
   in production (the sprite loader, the router-aware home link and the SEO
   overrides all depend on the http(s) protocol).
   Usage:  node docs/serve.cjs [port]
   ========================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 8765;

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

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>404</title></head><body><h1>404</h1><p><a href="/">Back to home</a></p></body></html>');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`HK ZANVIX preview running at http://127.0.0.1:${PORT}/`);
  console.log('Press Ctrl+C to stop.');
});
