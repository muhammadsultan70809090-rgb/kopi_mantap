// Simulasi lokal perilaku vercel.json: /api/* dan /uploads/* diarahkan ke api/index.js
// lewat query __path, sisanya dilayani dari dist/ (fallback SPA).
// Dipakai untuk menguji routing serverless tanpa harus deploy.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.SIM_PORT || 3200);

const { default: handler } = await import('../api/index.js');

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

http
  .createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

    if (pathname.startsWith('/uploads')) {
      // vercel.json: destination /api?__path=/uploads/:path*
      req.url = `/api?__path=${encodeURIComponent(pathname)}`;
      return handler(req, res);
    }

    if (pathname.startsWith('/api')) {
      // vercel.json: destination /api?__path=:path*
      const tail = pathname.slice('/api'.length) || '/';
      req.url = `/api?__path=${encodeURIComponent(tail)}`;
      return handler(req, res);
    }

    const file = path.join(DIST, pathname);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
      return fs.createReadStream(file).pipe(res);
    }

    res.setHeader('Content-Type', 'text/html');
    return fs.createReadStream(path.join(DIST, 'index.html')).pipe(res);
  })
  .listen(PORT, '0.0.0.0', () => console.log(`vercel-sim listening on ${PORT}`));
