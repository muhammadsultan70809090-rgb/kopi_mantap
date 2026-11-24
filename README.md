# Kopi Mantap

Platform penjualan kopi online dengan katalog interaktif, keranjang, checkout WhatsApp,
dan dashboard admin berbasis database.

## Menjalankan

```bash
npm install
npm run build     # build frontend ke dist/
npm start         # server API + situs di http://localhost:8787
```

Mode pengembangan (Vite di :3000 dengan proxy API ke :8787):

```bash
npm run dev
```

`PORT` bisa diubah lewat environment variable, contoh `PORT=3000 npm start`.

## Kredensial admin demo

- Username: `admin`
- Password: `admin`

Untuk produksi, set `ADMIN_PASSWORD` (dan opsional `ADMIN_USERNAME`) sebelum seed database
pertama, lalu ganti sesi/rotasi kredensial. Password disimpan sebagai hash scrypt, sesi berupa
cookie `HttpOnly` + `SameSite=Strict` (dan `Secure` saat `NODE_ENV=production`).

## Stack

- **Frontend**: React 18 + TypeScript + Vite, React Router, CSS kustom.
- **Backend**: Node.js + Express.
- **Database**: Turso (libSQL) saat `TURSO_DATABASE_URL` di-set — dipakai di Vercel — atau SQLite lokal
  via `node:sqlite` (bawaan Node 22+) di `data/kopimantap.db` untuk pengembangan.
- **Foto produk**: `public/images/*`; unggahan admin disimpan di `data/public/uploads/`.

## API

| Method | Endpoint | Akses |
| --- | --- | --- |
| GET | `/api/products` | publik |
| GET | `/api/products/:id` | publik |
| POST | `/api/auth/login` | publik (throttle 10 percobaan / 15 menit) |
| POST | `/api/auth/logout` | admin |
| GET | `/api/auth/me` | sesi |
| GET | `/api/admin/products` | admin |
| GET | `/api/admin/stats` | admin |
| POST | `/api/admin/products` | admin |
| PUT | `/api/admin/products/:id` | admin |
| PATCH | `/api/admin/products/:id/stock` | admin |
| DELETE | `/api/admin/products/:id` | admin |
| POST | `/api/admin/upload` | admin (JPG/PNG/WEBP, maks 3 MB) |

## Checkout WhatsApp

Nomor admin: **0821-2219-0680** (`wa.me/6282122190680`). Pesan otomatis memuat nama produk,
ukuran, suhu, jumlah, subtotal, dan total pembayaran.

## Deploy ke Vercel + Turso

Vercel tidak punya disk persisten, jadi database dan foto upload disimpan di [Turso](https://turso.tech)
(libSQL — SQL, tipe, dan query SQLite tetap sama). Frontend tetap dibuild Vite ke `dist/`, dan
seluruh API jalan sebagai satu serverless function di `api/index.js`.

### 1. Siapkan database Turso

```bash
# sekali saja
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup
turso db create kopi-mantap
turso db show kopi-mantap --url          # -> libsql://kopi-mantap-xxx.turso.io
turso db tokens create kopi-mantap       # -> token panjang
```

### 2. Set environment variable di Vercel

Settings → Environment Variables (centang Production, Preview, Development):

| Nama | Isi |
| --- | --- |
| `TURSO_DATABASE_URL` | `libsql://kopi-mantap-xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | token dari `turso db tokens create` |
| `ADMIN_PASSWORD` | password admin produksi (opsional, default `admin`) |

Lalu **Redeploy**. Saat request pertama masuk, tabel dibuat otomatis dan 12 produk contoh
beserta akun admin di-seed kalau database masih kosong.

### 3. Routing (sudah diatur `vercel.json`)

- `/api/*` → `api/index.js` (Express), path asli dikirim lewat query `__path`.
- `/uploads/*` → `api/index.js`, gambar dibaca dari tabel `uploads`.
- selain itu → `dist/` (SPA fallback ke `index.html`).

Foto yang diunggah admin (maks 3 MB) disimpan sebagai BLOB di database, bukan di filesystem.

### Uji lokal sebelum push

```bash
npm run build
node scripts/vercel-sim.mjs &   # meniru routing vercel.json di :3200
node scripts/smoke.mjs          # 16 cek API, auth, CRUD, upload, SPA
```

Mau menguji jalur libSQL tanpa akun Turso? Jalankan server dengan
`TURSO_DATABASE_URL=file:/tmp/uji.db` — kode async yang sama dengan produksi ikut terpakai.

## Deploy (host Node dengan disk persisten)

Aplikasi ini butuh **proses Node yang hidup terus** dan **filesystem yang persisten** (SQLite +
foto upload), jadi tidak bisa berjalan di Vercel/Netlify/serverless apa adanya. Repo ini sudah
menyertakan `Dockerfile` supaya bisa dipasang di Railway, Render, Fly.io, atau VPS.

Variabel environment:

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `NODE_ENV` | ya | set `production` |
| `PORT` | tidak | default `8787` (Dockerfile memakai `3000`) |
| `DATA_DIR` | ya (di Docker) | lokasi database + upload, harus di volume persisten (`/data` di Dockerfile) |
| `ADMIN_PASSWORD` | ya | password admin, dibaca saat database pertama kali dibuat |
| `ADMIN_USERNAME` | tidak | default `admin` |

### Railway
1. New Project → Deploy from GitHub → pilih repo `kopi_mantap`.
2. Railway mendeteksi `Dockerfile` otomatis.
3. Tambahkan **Volume** dan mount ke `/data`.
4. Set `ADMIN_PASSWORD` (+ opsional `ADMIN_USERNAME`) di Variables, lalu Deploy.
5. Buka domain yang diberikan Railway.

### Render
1. New → Web Service → hubungkan repo, Runtime **Docker**.
2. Tambahkan **Disk** dengan mount path `/data` (butuh paket berbayar; free tier kehilangan data).
3. Set `ADMIN_PASSWORD`, lalu Deploy.

### VPS
```bash
docker build -t kopi-mantap .
docker run -d --name kopi-mantap -p 80:3000 \
  -v /srv/kopi-mantap:/data \
  -e ADMIN_PASSWORD='password-kuat' \
  kopi-mantap
```

Tanpa Docker: `npm ci && npm run build && DATA_DIR=/srv/kopi-mantap NODE_ENV=production node server/index.js`
(dijalankan lewat pm2/systemd agar tetap hidup).
