import { app } from '../server/app.js';

/**
 * Entry point untuk Vercel Functions.
 * vercel.json mengarahkan /api/* dan /uploads/* ke sini sambil mengirim path aslinya
 * lewat query `__path`, karena Express butuh URL lengkap untuk mencocokkan route.
 */
export default function handler(req, res) {
  try {
    const parsed = new URL(req.url || '/', 'http://localhost');
    const raw = parsed.searchParams.get('__path');
    if (raw !== null) {
      const target = raw.startsWith('/') ? raw : `/${raw}`;
      req.url = target.startsWith('/api') || target.startsWith('/uploads') ? target : `/api${target}`;
    } else if (!req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
      req.url = `/api${req.url}`;
    }
  } catch {
    // Biarkan URL apa adanya kalau parsing gagal.
  }

  return app(req, res);
}
