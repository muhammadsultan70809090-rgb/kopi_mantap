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

### Verifikasi dua langkah (2FA)

2FA berbasis TOTP (RFC 6238, SHA-1, 6 digit, periode 30 detik) dan kompatibel dengan Google
Authenticator, Authy, 1Password, dan sejenisnya. Tidak ada dependency tambahan — implementasinya
ada di `server/totp.js`.

1. Login ke `/admin` → menu **Keamanan 2FA** → **Mulai pengaturan 2FA**.
2. Ketik kunci base32 yang muncul di aplikasi authenticator (atau salin URI `otpauth://`),
   lalu masukkan kode 6 digit → **Aktifkan 2FA**.
3. Login berikutnya meminta password **dan** kode authenticator. Kode yang sudah dipakai
   ditolak (disimpan sebagai `totp_last_step`), dan setiap kode hanya berlaku ±1 langkah waktu.
4. Untuk mematikan, buka menu yang sama dan konfirmasi dengan password admin + kode 2FA aktif.

2FA bersifat opsional dan tidak aktif secara default, jadi akun demo `admin`/`admin` tetap bisa
dipakai. Kunci 2FA disimpan di kolom `admins.totp_secret`; jaga akses ke database tetap aman.

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
| POST | `/api/auth/login` | publik (throttle 10 percobaan / 15 menit, menerima `code` 2FA) |
| POST | `/api/auth/logout` | admin |
| GET | `/api/auth/me` | sesi |
| GET | `/api/admin/products` | admin |
| GET | `/api/admin/stats` | admin |
| POST | `/api/admin/products` | admin |
| PUT | `/api/admin/products/:id` | admin |
| PATCH | `/api/admin/products/:id/stock` | admin |
| DELETE | `/api/admin/products/:id` | admin |
| POST | `/api/admin/upload` | admin (JPG/PNG/WEBP, maks 3 MB) |
| POST | `/api/orders` | publik (pesanan dari halaman checkout) |
| GET | `/api/admin/orders` | admin |
| PATCH | `/api/admin/orders/:id/status` | admin |
| GET | `/api/admin/2fa` | admin — status 2FA |
| POST | `/api/admin/2fa/setup` | admin — buat kunci TOTP baru |
| POST | `/api/admin/2fa/enable` | admin — aktifkan dengan kode dari authenticator |
| POST | `/api/admin/2fa/disable` | admin — matikan (password + kode) |

## Alur pemesanan

1. Pelanggan menambah produk dari katalog (ukuran & suhu dipilih di popup detail).
2. Keranjang menyimpan item di `localStorage`, jumlah bisa diubah, subtotal & total otomatis.
3. Halaman `/checkout` memvalidasi nama, nomor WhatsApp, dan alamat (jika diantar), lalu
   `POST /api/orders`. Server **menghitung ulang harga** dari database dan menyimpan pesanan
   dengan kode `KM-YYMMDD-XXXX` dan status `baru`.
4. Setelah tersimpan, pelanggan mengirim ringkasan ke WhatsApp admin. Kalau database belum
   dikonfigurasi, checkout tetap bisa diteruskan lewat WhatsApp (pesanan tidak tercatat).
5. Admin membuka tab **Pesanan** di `/admin` untuk melihat pesanan dan mengubah status
   (`baru` → `diproses` → `siap` → `selesai` / `dibatalkan`).

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

Tanpa `TURSO_DATABASE_URL`, deployment Vercel berjalan dalam **mode katalog read-only**:
`/api/products` tetap mengembalikan 12 produk bawaan (gambar statis di `dist/images`), tetapi
login admin dan pembuatan pesanan menjawab `503 DB_NOT_CONFIGURED` dengan instruksi konfigurasi.

### Skema database (SQL)

Skema lengkap ada di **[`db/schema.sql`](db/schema.sql)** (lima tabel: `admins`, `sessions`,
`uploads`, `orders`, `products`, plus index). File itu dihasilkan dari `server/schema.js` supaya
selalu sama dengan yang dipakai server:

```bash
npm run db:schema                                  # regenerasi db/schema.sql
sqlite3 data/kopimantap.db < db/schema.sql         # terapkan manual ke SQLite lokal
turso db shell kopi-mantap < db/schema.sql         # terapkan manual ke Turso
```

Biasanya tidak perlu dijalankan manual: server membuat tabel sendiri saat start. Database lama
(sebelum ada 2FA) dimigrasikan otomatis — kolom `totp_secret`, `totp_enabled`, dan
`totp_last_step` ditambahkan lewat `ALTER TABLE` tanpa menghapus data.

### Uji lokal sebelum push

```bash
npm run build
node scripts/vercel-sim.mjs &   # meniru routing vercel.json di :3200
node scripts/smoke.mjs          # 33 cek API, auth, 2FA, CRUD, upload, pesanan, SPA
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
