import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { createHash, randomBytes, timingSafeEqual, scryptSync } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT || 8787);
const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_COOKIE = 'km_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'public', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const CATEGORIES = ['Coffee Milk', 'Espresso Based', 'Flavored Coffee', 'Non-Coffee'];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function parseList(value, fallback = []) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function toPublicProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    description: row.description,
    image: row.image,
    inStock: Boolean(row.in_stock),
    sizes: parseList(row.sizes),
    temperatures: parseList(row.temperatures),
    ingredients: parseList(row.ingredients),
    tools: parseList(row.tools),
    steps: parseList(row.steps),
    featured: Boolean(row.featured),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf('=');
        return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
      }),
  );
}

/* ------------------------------------------------------------------ */
/* Sessions & authentication                                           */
/* ------------------------------------------------------------------ */

function createSession(adminId) {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  db.prepare(
    'INSERT INTO sessions (token_hash, admin_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
  ).run(sha256(token), adminId, now, now + SESSION_TTL_MS);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
  return token;
}

function getSessionAdmin(req) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT a.id, a.username FROM sessions s
       JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(sha256(token), Date.now());
  return row || null;
}

function requireAdmin(req, res, next) {
  const admin = getSessionAdmin(req);
  if (!admin) return res.status(401).json({ error: 'Akses ditolak. Silakan login sebagai admin.' });
  req.admin = admin;
  next();
}

function setSessionCookie(res, token) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (IS_PROD) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

// Simple in-memory login throttle: max 10 failed attempts per IP / 15 minutes.
const loginAttempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;

function tooManyAttempts(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= 10;
}

function recordFailedAttempt(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

/* ------------------------------------------------------------------ */
/* Public routes                                                       */
/* ------------------------------------------------------------------ */

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/products', (_req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY featured DESC, id ASC').all();
  res.json({ products: rows.map(toPublicProduct) });
});

app.get('/api/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  res.json({ product: toPublicProduct(row) });
});

app.get('/api/meta', (_req, res) => {
  res.json({ categories: CATEGORIES, whatsapp: process.env.ADMIN_WHATSAPP || '6282122190680' });
});

/* ------------------------------------------------------------------ */
/* Auth routes                                                         */
/* ------------------------------------------------------------------ */

app.post('/api/auth/login', (req, res) => {
  const ip = req.ip || 'unknown';
  if (tooManyAttempts(ip)) {
    return res
      .status(429)
      .json({ error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' });
  }
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

  let valid = false;
  if (admin) {
    const candidate = scryptSync(password, admin.password_salt, 64);
    const stored = Buffer.from(admin.password_hash, 'hex');
    valid = stored.length === candidate.length && timingSafeEqual(stored, candidate);
  }

  if (!valid) {
    recordFailedAttempt(ip);
    return res.status(401).json({ error: 'Username atau password salah.' });
  }

  loginAttempts.delete(ip);
  setSessionCookie(res, createSession(admin.id));
  res.json({ admin: { id: admin.id, username: admin.username } });
});

app.post('/api/auth/logout', (req, res) => {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  const admin = getSessionAdmin(req);
  if (!admin) return res.status(401).json({ error: 'Belum login.' });
  res.json({ admin });
});

/* ------------------------------------------------------------------ */
/* Admin routes                                                        */
/* ------------------------------------------------------------------ */

function sanitizeProduct(body) {
  const name = String(body?.name || '').trim();
  const category = String(body?.category || '').trim();
  const price = Math.round(Number(body?.price));
  const description = String(body?.description || '').trim();
  const image = String(body?.image || '').trim();
  const inStock = body?.inStock ? 1 : 0;
  const featured = body?.featured ? 1 : 0;

  const errors = [];
  if (name.length < 2) errors.push('Nama produk minimal 2 karakter.');
  if (!CATEGORIES.includes(category)) errors.push('Kategori tidak valid.');
  if (!Number.isFinite(price) || price < 1000) errors.push('Harga minimal Rp 1.000.');

  const sizes = Array.isArray(body?.sizes)
    ? body.sizes
        .map((s) => ({
          label: String(s?.label || '').trim(),
          extra: Math.max(0, Math.round(Number(s?.extra) || 0)),
        }))
        .filter((s) => s.label)
    : [];
  if (sizes.length === 0) errors.push('Minimal satu ukuran minuman.');

  const temperatures = Array.isArray(body?.temperatures)
    ? [...new Set(body.temperatures.map((t) => String(t).trim()).filter((t) => ['Panas', 'Dingin'].includes(t)))]
    : [];

  const cleanPairs = (items) =>
    Array.isArray(items)
      ? items
          .map((item) => ({
            name: String(item?.name || '').trim(),
            image: String(item?.image || '').trim(),
          }))
          .filter((item) => item.name)
      : [];

  const steps = Array.isArray(body?.steps)
    ? body.steps.map((s) => String(s).trim()).filter(Boolean)
    : [];

  if (errors.length) return { errors };

  return {
    value: {
      name,
      category,
      price,
      description,
      image,
      inStock,
      sizes,
      temperatures,
      ingredients: cleanPairs(body?.ingredients),
      tools: cleanPairs(body?.tools),
      steps,
      featured,
    },
  };
}

app.get('/api/admin/products', requireAdmin, (_req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY id ASC').all();
  res.json({ products: rows.map(toPublicProduct) });
});

app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  const inStock = db.prepare('SELECT COUNT(*) AS n FROM products WHERE in_stock = 1').get().n;
  const outOfStock = total - inStock;
  const value = db.prepare('SELECT COALESCE(SUM(price), 0) AS v FROM products WHERE in_stock = 1').get().v;
  const byCategory = db
    .prepare('SELECT category, COUNT(*) AS n FROM products GROUP BY category ORDER BY n DESC')
    .all();
  res.json({ stats: { total, inStock, outOfStock, value, byCategory } });
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { errors, value } = sanitizeProduct(req.body);
  if (errors) return res.status(400).json({ error: errors.join(' ') });

  const result = db
    .prepare(
      `INSERT INTO products (name, category, price, description, image, in_stock, sizes, temperatures, ingredients, tools, steps, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      value.name,
      value.category,
      value.price,
      value.description,
      value.image,
      value.inStock,
      JSON.stringify(value.sizes),
      JSON.stringify(value.temperatures),
      JSON.stringify(value.ingredients),
      JSON.stringify(value.tools),
      JSON.stringify(value.steps),
      value.featured,
    );

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ product: toPublicProduct(row) });
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

  const { errors, value } = sanitizeProduct(req.body);
  if (errors) return res.status(400).json({ error: errors.join(' ') });

  db.prepare(
    `UPDATE products SET name = ?, category = ?, price = ?, description = ?, image = ?,
       in_stock = ?, sizes = ?, temperatures = ?, ingredients = ?, tools = ?, steps = ?,
       featured = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    value.name,
    value.category,
    value.price,
    value.description,
    value.image,
    value.inStock,
    JSON.stringify(value.sizes),
    JSON.stringify(value.temperatures),
    JSON.stringify(value.ingredients),
    JSON.stringify(value.tools),
    JSON.stringify(value.steps),
    value.featured,
    id,
  );

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json({ product: toPublicProduct(row) });
});

// Quick stock toggle from the dashboard table.
app.patch('/api/admin/products/:id/stock', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const inStock = req.body?.inStock ? 1 : 0;
  const result = db
    .prepare("UPDATE products SET in_stock = ?, updated_at = datetime('now') WHERE id = ?")
    .run(inStock, id);
  if (result.changes === 0) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json({ product: toPublicProduct(row) });
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* Image upload (admin only)                                           */
/* ------------------------------------------------------------------ */

const ALLOWED_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) =>
      cb(null, `${Date.now()}-${randomBytes(4).toString('hex')}${ALLOWED_TYPES[file.mimetype]}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    cb(ALLOWED_TYPES[file.mimetype] ? null : new Error('Format gambar harus JPG, PNG, atau WEBP.'), Boolean(ALLOWED_TYPES[file.mimetype])),
});

app.post('/api/admin/upload', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

/* ------------------------------------------------------------------ */
/* Static hosting                                                      */
/* ------------------------------------------------------------------ */

app.use('/images', express.static(path.join(ROOT, 'public', 'images'), { maxAge: '7d' }));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

const distDir = path.join(ROOT, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: '1h', index: false }));
  app.get(/^\/(?!api|images|uploads).*/, (_req, res) =>
    res.sendFile(path.join(distDir, 'index.html')),
  );
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kopi Mantap API listening on http://0.0.0.0:${PORT}`);
});
