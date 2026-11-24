import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * TOTP (RFC 6238) tanpa dependency tambahan, kompatibel dengan Google
 * Authenticator, Authy, 1Password, dan aplikasi authenticator lain.
 * Parameter mengikuti standar: SHA-1, 6 digit, periode 30 detik.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export const TOTP_PERIOD = 30;
export const TOTP_DIGITS = 6;
export const TOTP_ISSUER = 'Kopi Mantap';

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(input) {
  const clean = String(input || '')
    .toUpperCase()
    .replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(key, counter) {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  counterBuffer.writeUInt32BE(counter % 2 ** 32, 4);
  const digest = createHmac('sha1', key).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

export function currentStep(now = Date.now()) {
  return Math.floor(now / 1000 / TOTP_PERIOD);
}

/** Kunci acak 160-bit dalam format base32 (yang diketik di aplikasi authenticator). */
export function generateSecret(bytes = 20) {
  return base32Encode(randomBytes(bytes));
}

/** Kode 6 digit untuk langkah waktu tertentu (dipakai juga oleh smoke test). */
export function generateCode(secret, step = currentStep()) {
  const key = base32Decode(secret);
  if (key.length === 0) return '';
  return hotp(key, step);
}

/**
 * Verifikasi kode dengan toleransi satu langkah ke belakang/depan (jam perangkat
 * bisa sedikit bergeser). Mengembalikan nomor langkah yang cocok, atau 0.
 */
export function verifyCode(secret, code, { window = 1, now = Date.now() } = {}) {
  const digits = String(code || '').replace(/\D/g, '');
  if (digits.length !== TOTP_DIGITS) return 0;
  const key = base32Decode(secret);
  if (key.length === 0) return 0;

  const expected = Buffer.from(digits);
  const step = currentStep(now);
  for (let offset = -window; offset <= window; offset += 1) {
    const candidate = hotp(key, step + offset);
    if (timingSafeEqual(Buffer.from(candidate), expected)) return step + offset;
  }
  return 0;
}

/** URI `otpauth://` untuk ditampilkan/di-copy ke aplikasi authenticator. */
export function otpauthUrl(secret, account = 'admin') {
  const label = encodeURIComponent(`${TOTP_ISSUER}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer: TOTP_ISSUER,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
