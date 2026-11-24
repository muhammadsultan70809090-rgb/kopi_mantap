import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, api } from '../api';
import { useCart } from '../context/CartContext';
import { WHATSAPP_NUMBER, formatRupiah } from '../types';
import { FallbackImage } from '../components/FallbackImage';

type Result =
  | { kind: 'saved'; code: string; total: number; whatsapp: string }
  | { kind: 'whatsapp'; total: number; whatsapp: string; note: string };

type Errors = Partial<Record<'name' | 'phone' | 'address', string>>;

export function Checkout() {
  const { items, total, updateQty, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.qty, 0), [items]);

  const buildMessage = (code?: string) => {
    const lines = items.map(
      (item, index) =>
        `${index + 1}. ${item.name}\n   ${item.sizeLabel}${item.temperature ? ` · ${item.temperature}` : ''}\n   ${item.qty} x ${formatRupiah(item.unitPrice)} = ${formatRupiah(item.unitPrice * item.qty)}`,
    );
    const parts = [
      '*PESANAN KOPI MANTAP*',
      ...(code ? [`Kode: ${code}`] : []),
      '--------------------------------',
      ...lines,
      '--------------------------------',
      `*Total: ${formatRupiah(total)}*`,
      '',
      `Nama: ${name.trim() || '-'}`,
      `WhatsApp: ${phone.trim() || '-'}`,
      `Metode: ${method === 'pickup' ? 'Ambil di tempat' : 'Diantar'}`,
    ];
    if (method === 'delivery' && address.trim()) parts.push(`Alamat: ${address.trim()}`);
    if (note.trim()) parts.push(`Catatan: ${note.trim()}`);
    parts.push('', 'Mohon konfirmasi pesanan saya. Terima kasih! 🙏');
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(parts.join('\n'))}`;
  };

  const validate = () => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = 'Nama minimal 2 karakter.';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) next.phone = 'Nomor WhatsApp tidak valid (contoh: 082122190680).';
    if (method === 'delivery' && address.trim().length < 5) next.address = 'Alamat pengantaran wajib diisi.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError('');
    if (items.length === 0) return;
    if (!validate()) return;

    setBusy(true);
    try {
      const { order } = await api.createOrder({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        method,
        address: method === 'delivery' ? address.trim() : '',
        note: note.trim(),
        items: items.map((item) => ({
          productId: item.productId,
          sizeLabel: item.sizeLabel,
          temperature: item.temperature,
          qty: item.qty,
        })),
      });
      const whatsapp = buildMessage(order.code);
      setResult({ kind: 'saved', code: order.code, total: order.total, whatsapp });
      clearCart();
    } catch (err) {
      if (err instanceof ApiError && (err.status === 503 || err.status === 0)) {
        // Pesanan tetap bisa diteruskan lewat WhatsApp walau database belum aktif.
        setResult({
          kind: 'whatsapp',
          total,
          whatsapp: buildMessage(),
          note: err.message,
        });
      } else {
        setServerError(err instanceof Error ? err.message : 'Gagal mengirim pesanan.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <main className="checkout-page">
        <div className="container checkout-done">
          <span className="eyebrow">{result.kind === 'saved' ? 'Pesanan tercatat' : 'Kirim lewat WhatsApp'}</span>
          <h1 className="font-display">
            {result.kind === 'saved' ? 'Pesanan kamu sudah masuk.' : 'Satu langkah lagi.'}
          </h1>
          {result.kind === 'saved' ? (
            <p>
              Kode pesanan <strong>{result.code}</strong> · total <strong>{formatRupiah(result.total)}</strong>.
              Klik tombol di bawah untuk mengirim detail pesanan ke admin lewat WhatsApp agar segera diproses.
            </p>
          ) : (
            <p>
              {result.note} Pesanan belum tersimpan di dashboard, jadi kirim detailnya ke admin lewat
              WhatsApp supaya tetap diproses.
            </p>
          )}
          <div className="checkout-done-actions">
            <a className="btn btn-whatsapp btn-lg" href={result.whatsapp} target="_blank" rel="noreferrer">
              Kirim ke WhatsApp admin
            </a>
            <button type="button" className="btn btn-outline btn-lg" onClick={() => navigate('/menu')}>
              Pesan menu lain
            </button>
          </div>
          <p className="checkout-done-note">Admin: 0821-2219-0680 · buka setiap hari 08.00–22.00.</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="checkout-page">
        <div className="container checkout-done">
          <span className="eyebrow">Checkout</span>
          <h1 className="font-display">Keranjangmu masih kosong.</h1>
          <p>Pilih kopi favoritmu dulu, lalu lanjutkan ke checkout di sini.</p>
          <Link to="/menu" className="btn btn-primary btn-lg">
            Lihat menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <section className="page-header">
        <div className="container">
          <span className="eyebrow">Checkout</span>
          <h1 className="font-display">
            Selesaikan <em>pesananmu.</em>
          </h1>
          <p>
            Isi data pengiriman, periksa ringkasan, lalu kirim pesanan. Pesanan tercatat di dashboard
            admin dan detailnya diteruskan ke WhatsApp.
          </p>
        </div>
      </section>

      <div className="container checkout-grid">
        <form className="checkout-form" onSubmit={submit} noValidate>
          <h2 className="font-display">Data pemesan</h2>

          <label className={`field ${errors.name ? 'has-error' : ''}`}>
            <span>Nama lengkap</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama kamu"
              autoComplete="name"
            />
            {errors.name && <small className="field-error">{errors.name}</small>}
          </label>

          <label className={`field ${errors.phone ? 'has-error' : ''}`}>
            <span>Nomor WhatsApp</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="082122190680"
              autoComplete="tel"
            />
            {errors.phone && <small className="field-error">{errors.phone}</small>}
          </label>

          <fieldset className="field-group">
            <legend>Metode pesanan</legend>
            <div className="radio-row">
              <label className={`radio-card ${method === 'pickup' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="method"
                  value="pickup"
                  checked={method === 'pickup'}
                  onChange={() => setMethod('pickup')}
                />
                <span>
                  <strong>Ambil di tempat</strong>
                  <small>Datang ke kedai, tanpa biaya antar.</small>
                </span>
              </label>
              <label className={`radio-card ${method === 'delivery' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="method"
                  value="delivery"
                  checked={method === 'delivery'}
                  onChange={() => setMethod('delivery')}
                />
                <span>
                  <strong>Diantar</strong>
                  <small>Ongkir dikonfirmasi admin via WhatsApp.</small>
                </span>
              </label>
            </div>
          </fieldset>

          {method === 'delivery' && (
            <label className={`field ${errors.address ? 'has-error' : ''}`}>
              <span>Alamat pengantaran</span>
              <textarea
                rows={3}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Jalan, nomor rumah, patokan"
              />
              {errors.address && <small className="field-error">{errors.address}</small>}
            </label>
          )}

          <label className="field">
            <span>Catatan (opsional)</span>
            <textarea
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Contoh: less sugar, tanpa es, jam ambil 10.00"
            />
          </label>

          {serverError && <div className="alert alert-error">{serverError}</div>}

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy ? 'Mengirim pesanan…' : `Kirim pesanan · ${formatRupiah(total)}`}
          </button>
          <p className="checkout-hint">
            Total dihitung otomatis dari harga produk. Ongkir (jika diantar) dikonfirmasi admin.
          </p>
        </form>

        <aside className="checkout-summary">
          <header>
            <h2 className="font-display">Ringkasan</h2>
            <span>{itemCount} item</span>
          </header>

          <ul>
            {items.map((item) => (
              <li key={item.key} className="checkout-item">
                <FallbackImage src={item.image} alt={item.name} className="checkout-thumb" />
                <div className="checkout-item-info">
                  <div className="checkout-item-top">
                    <h3>{item.name}</h3>
                    <strong>{formatRupiah(item.unitPrice * item.qty)}</strong>
                  </div>
                  <p>
                    {item.sizeLabel}
                    {item.temperature ? ` · ${item.temperature}` : ''}
                  </p>
                  <div className="checkout-item-actions">
                    <div className="qty-control qty-sm">
                      <button type="button" onClick={() => updateQty(item.key, item.qty - 1)} aria-label={`Kurangi ${item.name}`}>
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => updateQty(item.key, item.qty + 1)} aria-label={`Tambah ${item.name}`}>
                        +
                      </button>
                    </div>
                    <button type="button" className="link-danger" onClick={() => removeItem(item.key)}>
                      Hapus
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="checkout-total-row">
            <span>Subtotal</span>
            <span>{formatRupiah(total)}</span>
          </div>
          <div className="checkout-total-row">
            <span>Ongkir</span>
            <span>{method === 'delivery' ? 'Dikonfirmasi admin' : 'Gratis (ambil sendiri)'}</span>
          </div>
          <div className="checkout-grand-total">
            <span>Total</span>
            <strong>{formatRupiah(total)}</strong>
          </div>

          <Link to="/menu" className="btn btn-text btn-block">
            Tambah menu lain
          </Link>
        </aside>
      </div>
    </main>
  );
}
