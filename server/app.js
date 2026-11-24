import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { createHash, randomBytes, timingSafeEqual, scryptSync } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { all, one, run, ready, saveUpload, getUpload, readOnlyCatalog } from './db.js';
import { seedProducts } from './seed-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_COOKIE = 'km_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 jam

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

/** Express 4 belum menangkap promise yang reject; bungkus supaya error masuk ke handler. */
const ah = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const CATEGORIES = ['Coffee Milk', 'Espresso Based', 'Flavored Coffee', 'Non-Coffee'];
const ORDER_STATUSES = ['baru', 'diproses', 'siap', 'selesai', 'dibatalkan'];

/** Katalog read-only dari data seed saat Vercel tidak punya database. */
function seedPublicProducts() {
  return seedProducts.map((p, index) => ({
    id: index + 1,
    name: p.name,
    category: p.category,
    price: p.price,
    description: p.description,
    image: p.image,
    inStock: true,
    sizes: p.sizes,
    temperatures: p.temperatures,
    ingredients: p.ingredients,
    tools: p.tools,
    steps: p.steps,
    featured: Boolean(p.featured),
    createdAt: null,
    updatedAt: null,
  }));
}

function requireDatabase(_req, res, next) {
  if (readOnlyCatalog) {
    return res.status(503).json({
      error:
        'Database belum dikonfigurasi di deployment ini. Set TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN di Vercel → Settings → Environment Variables, lalu redeploy.',
      code: 'DB_NOT_CONFIGURED',
    });
  }
  next();
}

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

function toPublicOrder(row) {
  return {
    id: row.id,
    code: row.code,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    method: row.method,
    address: row.address,
    note: row.note,
    items: parseList(row.items),
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function orderCode() {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  return `KM-${stamp}-${randomBytes(2).toString('hex').toUpperCase()}`;
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

function toBuffer(data) {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(new Uint8Array(data));
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  if (typeof data === 'string') return Buffer.from(data, 'base64');
  return Buffer.alloc(0);
}

/* ------------------------------------------------------------------ */
/* Sessions & authentication                                           */
/* ------------------------------------------------------------------ */

async function createSession(adminId) {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  await run('INSERT INTO sessions (token_hash, admin_id, created_at, expires_at) VALUES (?, ?, ?, ?)', [
    sha256(token),
    adminId,
    now,
    now + SESSION_TTL_MS,
  ]);
  await run('DELETE FROM sessions WHERE expires_at < ?', [now]);
  return token;
}

async function getSessionAdmin(req) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
  const row = await one(
    `SELECT a.id, a.username FROM sessions s
     JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
    [sha256(token), Date.now()],
  );
  return row || null;
}

async function requireAdmin(req, res, next) {
  const admin = await getSessionAdmin(req);
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

// Throttle login sederhana: maksimal 10 percobaan gagal per IP / 15 menit.
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

// Pastikan skema & seed siap sebelum request pertama (cold start serverless).
app.use(
  ah(async (_req, _res, next) => {
    if (!readOnlyCatalog) await ready();
    next();
  }),
);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get(
  '/api/products',
  ah(async (_req, res) => {
    if (readOnlyCatalog) return res.json({ products: seedPublicProducts(), mode: 'readonly' });
    const rows = await all('SELECT * FROM products ORDER BY featured DESC, id ASC');
    res.json({ products: rows.map(toPublicProduct), mode: 'database' });
  }),
);

app.get(
  '/api/products/:id',
  ah(async (req, res) => {
    if (readOnlyCatalog) {
      const product = seedPublicProducts().find((item) => item.id === Number(req.params.id));
      if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
      return res.json({ product });
    }
    const row = await one('SELECT * FROM products WHERE id = ?', [Number(req.params.id)]);
    if (!row) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    res.json({ product: toPublicProduct(row) });
  }),
);

app.get('/api/meta', (_req, res) => {
  res.json({
    categories: CATEGORIES,
    whatsapp: process.env.ADMIN_WHATSAPP || '6282122190680',
    mode: readOnlyCatalog ? 'readonly' : 'database',
  });
});

/* ------------------------------------------------------------------ */
/* Auth routes                                                         */
/* ------------------------------------------------------------------ */

app.post(
  '/api/auth/login',
  requireDatabase,
  ah(async (req, res) => {
    const ip = req.ip || 'unknown';
    if (tooManyAttempts(ip)) {
      return res
        .status(429)
        .json({ error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' });
    }
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    const admin = await one('SELECT * FROM admins WHERE username = ?', [username]);

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
    setSessionCookie(res, await createSession(admin.id));
    res.json({ admin: { id: admin.id, username: admin.username } });
  }),
);

app.post(
  '/api/auth/logout',
  ah(async (req, res) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) await run('DELETE FROM sessions WHERE token_hash = ?', [sha256(token)]);
    res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
    res.json({ ok: true });
  }),
);

app.get(
  '/api/auth/me',
  ah(async (req, res) => {
    const admin = await getSessionAdmin(req);
    if (!admin) return res.status(401).json({ error: 'Belum login.' });
    res.json({ admin });
  }),
);

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

app.get(
  '/api/admin/products',
  requireDatabase,
  requireAdmin,
  ah(async (_req, res) => {
    const rows = await all('SELECT * FROM products ORDER BY id ASC');
    res.json({ products: rows.map(toPublicProduct) });
  }),
);

app.get(
  '/api/admin/stats',
  requireDatabase,
  requireAdmin,
  ah(async (_req, res) => {
    const total = Number((await one('SELECT COUNT(*) AS n FROM products'))?.n ?? 0);
    const inStock = Number((await one('SELECT COUNT(*) AS n FROM products WHERE in_stock = 1'))?.n ?? 0);
    const outOfStock = total - inStock;
    const value = Number(
      (await one('SELECT COALESCE(SUM(price), 0) AS v FROM products WHERE in_stock = 1'))?.v ?? 0,
    );
    const byCategory = await all(
      'SELECT category, COUNT(*) AS n FROM products GROUP BY category ORDER BY n DESC',
    );
    const orderTotal = Number((await one('SELECT COUNT(*) AS n FROM orders'))?.n ?? 0);
    const orderNew = Number((await one("SELECT COUNT(*) AS n FROM orders WHERE status = 'baru'"))?.n ?? 0);
    res.json({
      stats: { total, inStock, outOfStock, value, byCategory, orders: { total: orderTotal, baru: orderNew } },
    });
  }),
);

app.post(
  '/api/admin/products',
  requireDatabase,
  requireAdmin,
  ah(async (req, res) => {
    const { errors, value } = sanitizeProduct(req.body);
    if (errors) return res.status(400).json({ error: errors.join(' ') });

    const result = await run(
      `INSERT INTO products (name, category, price, description, image, in_stock, sizes, temperatures, ingredients, tools, steps, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ],
    );

    const row = await one('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ product: toPublicProduct(row) });
  }),
);

app.put(
  '/api/admin/products/:id',
  requireDatabase,
  requireAdmin,
  ah(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await one('SELECT id FROM products WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

    const { errors, value } = sanitizeProduct(req.body);
    if (errors) return res.status(400).json({ error: errors.join(' ') });

    await run(
      `UPDATE products SET name = ?, category = ?, price = ?, description = ?, image = ?,
         in_stock = ?, sizes = ?, temperatures = ?, ingredients = ?, tools = ?, steps = ?,
         featured = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
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
      ],
    );

    const row = await one('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ product: toPublicProduct(row) });
  }),
);

// Toggle stok cepat dari tabel dashboard.
app.patch(
  '/api/admin/products/:id/stock',
  requireDatabase,
  requireAdmin,
  ah(async (req, res) => {
    const id = Number(req.params.id);
    const inStock = req.body?.inStock ? 1 : 0;
    const result = await run("UPDATE products SET in_stock = ?, updated_at = datetime('now') WHERE id = ?", [
      inStock,
      id,
    ]);
    if (result.changes === 0) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    const row = await one('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ product: toPublicProduct(row) });
  }),
);

app.delete(
  '/api/admin/products/:id',
  requireDatabase,
  requireAdmin,
  ah(async (req, res) => {
    const id = Number(req.params.id);
    const result = await run('DELETE FROM products WHERE id = ?', [id]);
    if (result.changes === 0) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    res.json({ ok: true });
  }),
);

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

// Pelanggan mengirim pesanan; admin melihat dan memperbarui statusnya.
app.post(
  '/api/orders',
  requireDatabase,
  ah(async (req, res) => {
    const customerName = String(req.body?.customerName ?? '').trim();
    const phoneRaw = String(req.body?.customerPhone ?? '').trim();
    const method = req.body?.method === 'delivery' ? 'delivery' : 'pickup';
    const address = String(req.body?.address ?? '').trim();
    const note = String(req.body?.note ?? '').trim().slice(0, 500);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    const errors = [];
    const digits = phoneRaw.replace(/\D/g, '');
    if (customerName.length < 2) errors.push('Nama pemesan minimal 2 karakter.');
    if (digits.length < 9 || digits.length > 15) errors.push('Nomor WhatsApp tidak valid.');
    if (items.length === 0) errors.push('Keranjang masih kosong.');
    if (items.length > 40) errors.push('Terlalu banyak item dalam satu pesanan.');
    if (method === 'delivery' && address.length < 5) errors.push('Alamat pengantaran wajib diisi.');
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    const clean = [];
    let total = 0;

    for (const raw of items) {
      const productId = Number(raw?.productId);
      const qty = Math.max(1, Math.min(99, Math.round(Number(raw?.qty) || 0)));
      const product = await one('SELECT * FROM products WHERE id = ?', [productId]);
      if (!product) {
        errors.push(`Produk dengan id ${raw?.productId} tidak ditemukan.`);
        continue;
      }
      if (!product.in_stock) {
        errors.push(`${product.name} sedang tidak tersedia.`);
        continue;
      }

      // Harga dihitung ulang di server supaya total tidak bisa dimanipulasi dari browser.
      const sizes = parseList(product.sizes);
      const sizeLabel = String(raw?.sizeLabel || '').trim();
      const size = sizes.find((option) => option.label === sizeLabel) || sizes[0];
      const unitPrice = Number(product.price) + Number(size?.extra || 0);
      const temperature = ['Panas', 'Dingin'].includes(String(raw?.temperature))
        ? String(raw?.temperature)
        : parseList(product.temperatures)[0] || '';
      const lineTotal = unitPrice * qty;
      total += lineTotal;
      clean.push({
        productId: product.id,
        name: product.name,
        sizeLabel: size?.label || 'Regular',
        temperature,
        qty,
        unitPrice,
        lineTotal,
      });
    }

    if (errors.length || clean.length === 0) {
      return res.status(400).json({ error: errors.join(' ') || 'Pesanan tidak valid.' });
    }

    const code = orderCode();
    await run(
      `INSERT INTO orders (code, customer_name, customer_phone, method, address, note, items, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'baru')`,
      [code, customerName, digits, method, address, note, JSON.stringify(clean), total],
    );

    const row = await one('SELECT * FROM orders WHERE code = ?', [code]);
    res.status(201).json({ order: toPublicOrder(row) });
  }),
);

app.get(
  '/api/admin/orders',
  requireDatabase,
  requireAdmin,
  ah(async (_req, res) => {
    const rows = await all('SELECT * FROM orders ORDER BY id DESC LIMIT 200');
    res.json({ orders: rows.map(toPublicOrder) });
  }),
);

app.patch(
  '/api/admin/orders/:id/status',
  requireDatabase,
  requireAdmin,
  ah(async (req, res) => {
    const status = String(req.body?.status || '');
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status pesanan tidak valid.' });
    }
    const id = Number(req.params.id);
    const result = await run("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?", [
      status,
      id,
    ]);
    if (result.changes === 0) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    const row = await one('SELECT * FROM orders WHERE id = ?', [id]);
    res.json({ order: toPublicOrder(row) });
  }),
);

/* ------------------------------------------------------------------ */
/* Image upload (admin only)                                           */
/* ------------------------------------------------------------------ */

// Disimpan di database supaya tetap ada di lingkungan serverless (filesystem read-only).
const ALLOWED_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = Boolean(ALLOWED_TYPES[file.mimetype]);
    cb(ok ? null : new Error('Format gambar harus JPG, PNG, atau WEBP.'), ok);
  },
});

app.post('/api/admin/upload', requireDatabase, requireAdmin, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });

    const name = `${Date.now()}-${randomBytes(4).toString('hex')}${ALLOWED_TYPES[req.file.mimetype]}`;
    saveUpload({ name, mime: req.file.mimetype, size: req.file.size, data: req.file.buffer })
      .then(() => res.status(201).json({ url: `/uploads/${name}` }))
      .catch(next);
  });
});

app.get(
  '/uploads/:name',
  ah(async (req, res) => {
    if (readOnlyCatalog) return res.status(404).json({ error: 'Gambar tidak ditemukan.' });
    const row = await getUpload(String(req.params.name));
    if (!row) return res.status(404).json({ error: 'Gambar tidak ditemukan.' });
    const buffer = toBuffer(row.data);
    res.setHeader('Content-Type', row.mime || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('Content-Length', String(buffer.length));
    res.end(buffer);
  }),
);

/* ------------------------------------------------------------------ */
/* Static hosting (dipakai saat server Node menyajikan hasil build)     */
/* ------------------------------------------------------------------ */

app.use('/images', express.static(path.join(ROOT, 'public', 'images'), { maxAge: '7d' }));

const distDir = path.join(ROOT, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: '1h', index: false }));
  app.get(/^\/(?!api|images|uploads).*/, (_req, res) =>
    res.sendFile(path.join(distDir, 'index.html')),
  );
}

app.use((err, _req, res, _next) => {
  console.error(err);
  const message = String(err?.message || '');
  const actionable =
    message.includes('TURSO') || message.includes('Database belum') || message.includes('libsql')
      ? `${message} Periksa environment variable database di server.`
      : 'Terjadi kesalahan pada server.';
  res.status(500).json({ error: actionable });
});

export default app;
