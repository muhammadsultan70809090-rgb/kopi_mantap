-- Skema database Kopi Mantap (SQLite / Turso libSQL)
-- Dibuat otomatis dari server/schema.js — jalankan "npm run db:schema" setelah mengubah skema.
-- Pemakaian manual:
--   sqlite3 data/kopimantap.db < db/schema.sql
--   turso db shell kopi-mantap < db/schema.sql
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    totp_secret TEXT NOT NULL DEFAULT '',
    totp_enabled INTEGER NOT NULL DEFAULT 0,
    totp_last_step INTEGER NOT NULL DEFAULT 0,
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

  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token_hash);
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions (expires_at);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
