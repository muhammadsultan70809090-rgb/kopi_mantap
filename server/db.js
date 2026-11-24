import { randomBytes, scryptSync } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedProducts } from './seed-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');

/**
 * Dua mode penyimpanan:
 * - TURSO_DATABASE_URL di-set  -> database Turso (libSQL), dipakai di Vercel/serverless.
 * - tidak di-set               -> file SQLite lokal lewat node:sqlite (dev & host Node biasa).
 */
const REMOTE_URL = process.env.TURSO_DATABASE_URL || '';
const REMOTE_TOKEN = process.env.TURSO_AUTH_TOKEN || '';
export const isRemote = Boolean(REMOTE_URL);

/**
 * Di Vercel tanpa Turso tidak ada tempat menyimpan data secara permanen.
 * Dalam mode ini katalog publik dilayani read-only dari data seed, dan
 * endpoint yang butuh tulis (admin, pesanan) menjawab 503 dengan pesan jelas.
 */
export const readOnlyCatalog = Boolean(process.env.VERCEL) && !isRemote;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS uploads (
    name TEXT PRIMARY KEY,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    data BLOB NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'pickup',
    address TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    items TEXT NOT NULL DEFAULT '[]',
    total INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'baru',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    in_stock INTEGER NOT NULL DEFAULT 1,
    sizes TEXT NOT NULL DEFAULT '[]',
    temperatures TEXT NOT NULL DEFAULT '[]',
    ingredients TEXT NOT NULL DEFAULT '[]',
    tools TEXT NOT NULL DEFAULT '[]',
    steps TEXT NOT NULL DEFAULT '[]',
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

let remoteClient = null;
let localDb = null;

async function remote() {
  if (!remoteClient) {
    const { createClient } = await import('@libsql/client');
    remoteClient = createClient({ url: REMOTE_URL, authToken: REMOTE_TOKEN || undefined });
  }
  return remoteClient;
}

async function local() {
  if (process.env.VERCEL) {
    throw new Error(
      'Database belum dikonfigurasi: set TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN di Vercel.',
    );
  }
  if (!localDb) {
    const { DatabaseSync } = await import('node:sqlite');
    fs.mkdirSync(DATA_DIR, { recursive: true });
    localDb = new DatabaseSync(path.join(DATA_DIR, 'kopimantap.db'));
    localDb.exec('PRAGMA journal_mode = WAL;');
    localDb.exec('PRAGMA foreign_keys = ON;');
  }
  return localDb;
}

/** node:sqlite menolak undefined & boolean; libSQL juga. Samakan bentuk argumen. */
function normalize(params = []) {
  return params.map((value) => {
    if (value === undefined) return null;
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value;
  });
}

function toPlain(row) {
  const out = {};
  for (const key of Object.keys(row)) out[key] = row[key];
  return out;
}

/** Kembalikan semua baris sebagai array of object. */
export async function all(sql, params = []) {
  if (isRemote) {
    const result = await (await remote()).execute({ sql, args: normalize(params) });
    return result.rows.map(toPlain);
  }
  return (await local()).prepare(sql).all(...normalize(params));
}

/** Kembalikan satu baris pertama (atau undefined). */
export async function one(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0];
}

/** Jalankan INSERT/UPDATE/DELETE, kembalikan jumlah baris & id terakhir. */
export async function run(sql, params = []) {
  if (isRemote) {
    const result = await (await remote()).execute({ sql, args: normalize(params) });
    return {
      changes: Number(result.rowsAffected ?? 0),
      lastInsertRowid: Number(result.lastInsertRowid ?? 0),
    };
  }
  const result = (await local()).prepare(sql).run(...normalize(params));
  return { changes: Number(result.changes), lastInsertRowid: Number(result.lastInsertRowid) };
}

async function exec(sql) {
  if (isRemote) {
    await (await remote()).executeMultiple(sql);
    return;
  }
  (await local()).exec(sql);
}

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return { hash: scryptSync(password, salt, 64).toString('hex'), salt };
}

async function init() {
  await exec(SCHEMA);

  const adminCount = Number((await one('SELECT COUNT(*) AS n FROM admins'))?.n ?? 0);
  if (adminCount === 0) {
    // Demo: admin / admin. Ganti lewat ADMIN_PASSWORD (dan ADMIN_USERNAME) sebelum deploy.
    const { hash, salt } = hashPassword(process.env.ADMIN_PASSWORD || 'admin');
    await run('INSERT INTO admins (username, password_hash, password_salt) VALUES (?, ?, ?)', [
      process.env.ADMIN_USERNAME || 'admin',
      hash,
      salt,
    ]);
  }

  const productCount = Number((await one('SELECT COUNT(*) AS n FROM products'))?.n ?? 0);
  if (productCount === 0) {
    for (const p of seedProducts) {
      await run(
        `INSERT INTO products (name, category, price, description, image, in_stock, sizes, temperatures, ingredients, tools, steps, featured)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
        [
          p.name,
          p.category,
          p.price,
          p.description,
          p.image,
          JSON.stringify(p.sizes),
          JSON.stringify(p.temperatures),
          JSON.stringify(p.ingredients),
          JSON.stringify(p.tools),
          JSON.stringify(p.steps),
          p.featured,
        ],
      );
    }
  }
}

let initPromise = null;

/** Dipanggil sebelum request pertama; aman dipanggil berkali-kali (cold start serverless). */
export function ready() {
  if (!initPromise) {
    initPromise = init().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

export async function saveUpload({ name, mime, size, data }) {
  await run('INSERT OR REPLACE INTO uploads (name, mime, size, data) VALUES (?, ?, ?, ?)', [
    name,
    mime,
    size,
    data,
  ]);
}

export async function getUpload(name) {
  return one('SELECT name, mime, data FROM uploads WHERE name = ?', [name]);
}
