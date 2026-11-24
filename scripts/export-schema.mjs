// Menulis db/schema.sql dari server/schema.js supaya file SQL selalu sinkron.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCHEMA } from '../server/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, '..', 'db', 'schema.sql');

const header = `-- Skema database Kopi Mantap (SQLite / Turso libSQL)
-- Dibuat otomatis dari server/schema.js — jalankan "npm run db:schema" setelah mengubah skema.
-- Pemakaian manual:
--   sqlite3 data/kopimantap.db < db/schema.sql
--   turso db shell kopi-mantap < db/schema.sql
`;

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${header}${SCHEMA.trim()}\n`);
console.log(`Skema ditulis ke ${path.relative(process.cwd(), target)}`);
