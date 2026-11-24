import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { AdminStats, AdminUser, Order, OrderStatus, Product } from '../types';
import { CATEGORIES, ORDER_STATUSES, ORDER_STATUS_LABELS, WHATSAPP_NUMBER, formatRupiah } from '../types';
import { FallbackImage } from '../components/FallbackImage';

type Toast = { type: 'success' | 'error'; text: string };

const emptyForm = {
  name: '',
  category: CATEGORIES[0] as string,
  price: '',
  description: '',
  image: '',
  inStock: true,
  featured: false,
  sizes: [{ label: 'Regular', extra: '0' }],
  temperatures: ['Panas', 'Dingin'],
  ingredients: [{ name: '', image: '' }],
  tools: [{ name: '', image: '' }],
  stepsText: '',
};

type FormState = typeof emptyForm;

const PRESET_IMAGES = [
  '/images/products/kopi-susu-mantap.jpg',
  '/images/products/caramel-latte.jpg',
  '/images/products/vanilla-latte.jpg',
  '/images/products/hazelnut-coffee-milk.jpg',
  '/images/products/espresso-single.jpg',
  '/images/products/americano.jpg',
  '/images/products/cappuccino.jpg',
  '/images/products/macchiato.jpg',
  '/images/products/butterscotch-coffee.jpg',
  '/images/products/mocha-cokelat.jpg',
  '/images/products/matcha-latte.jpg',
  '/images/products/cokelat-mantap.jpg',
];

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

function AdminLogin({ onSuccess }: { onSuccess: (admin: AdminUser) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { admin } = await api.login(username, password);
      onSuccess(admin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-visual">
        <FallbackImage src="/images/interior.jpg" alt="Kedai Kopi Mantap" />
        <div className="admin-login-overlay">
          <Link to="/" className="brand brand-light">
            <span className="brand-text">
              <strong>Kopi Mantap</strong>
              <small>Admin Console</small>
            </span>
          </Link>
          <div>
            <h2 className="font-display">Kelola menu, jaga rasa tetap sama.</h2>
            <p>
              Perbarui produk, harga, foto, dan ketersediaan stok dari satu dashboard yang rapi.
            </p>
          </div>
        </div>
      </div>

      <div className="admin-login-form">
        <form onSubmit={submit} className="login-card">
          <span className="eyebrow">Area terbatas</span>
          <h1 className="font-display">Masuk Dashboard</h1>
          <p className="muted">Gunakan kredensial admin Kopi Mantap untuk melanjutkan.</p>

          <label className="field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Memeriksa…' : 'Masuk'}
          </button>

          <div className="demo-hint">
            <strong>Kredensial demo</strong>
            <span>Username: admin · Password: admin</span>
          </div>

          <Link to="/" className="link-back">
            ← Kembali ke situs
          </Link>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Product form                                                        */
/* ------------------------------------------------------------------ */

type FormProps = {
  product: Product | null;
  onClose: () => void;
  onSaved: (product: Product) => void;
};

function ProductForm({ product, onClose, onSaved }: FormProps) {
  const [form, setForm] = useState<FormState>(() =>
    product
      ? {
          name: product.name,
          category: product.category,
          price: String(product.price),
          description: product.description,
          image: product.image,
          inStock: product.inStock,
          featured: product.featured,
          sizes: product.sizes.map((size) => ({ label: size.label, extra: String(size.extra) })),
          temperatures: product.temperatures,
          ingredients:
            product.ingredients.length > 0
              ? product.ingredients.map((item) => ({ ...item }))
              : [{ name: '', image: '' }],
          tools:
            product.tools.length > 0
              ? product.tools.map((item) => ({ ...item }))
              : [{ name: '', image: '' }],
          stepsText: product.steps.join('\n'),
        }
      : { ...emptyForm, sizes: [{ ...emptyForm.sizes[0] }], ingredients: [{ name: '', image: '' }], tools: [{ name: '', image: '' }] },
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await api.upload(file);
      update('image', url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload gagal.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const toggleTemperature = (value: string) => {
    update(
      'temperatures',
      form.temperatures.includes(value)
        ? form.temperatures.filter((item) => item !== value)
        : [...form.temperatures, value],
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price),
      description: form.description,
      image: form.image,
      inStock: form.inStock,
      featured: form.featured,
      sizes: form.sizes.map((size) => ({ label: size.label, extra: Number(size.extra) || 0 })),
      temperatures: form.temperatures,
      ingredients: form.ingredients,
      tools: form.tools,
      steps: form.stepsText.split('\n').map((line) => line.trim()).filter(Boolean),
    };
    try {
      const result = product
        ? await api.updateProduct(product.id, payload)
        : await api.createProduct(payload);
      onSaved(result.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan produk.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-form-header">
          <div>
            <span className="eyebrow">{product ? 'Edit produk' : 'Produk baru'}</span>
            <h2 id="form-title" className="font-display">
              {product ? product.name : 'Tambah Menu Baru'}
            </h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Tutup form">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <form onSubmit={submit} className="admin-form">
          <div className="form-grid">
            <label className="field">
              <span>Nama minuman *</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Contoh: Caramel Macchiato"
                required
              />
            </label>
            <label className="field">
              <span>Kategori *</span>
              <select value={form.category} onChange={(event) => update('category', event.target.value)}>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Harga (Rp) *</span>
              <input
                type="number"
                min={1000}
                step={500}
                value={form.price}
                onChange={(event) => update('price', event.target.value)}
                placeholder="25000"
                required
              />
            </label>
            <label className="field">
              <span>Status</span>
              <select
                value={form.inStock ? '1' : '0'}
                onChange={(event) => update('inStock', event.target.value === '1')}
              >
                <option value="1">Tersedia</option>
                <option value="0">Stok habis</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Deskripsi singkat *</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="Jelaskan rasa, bahan utama, dan karakter minuman."
              required
            />
          </label>

          <div className="field">
            <span>Foto produk</span>
            <div className="image-field">
              <div className="image-preview">
                <FallbackImage src={form.image} alt="Pratinjau foto produk" />
              </div>
              <div className="image-controls">
                <input
                  type="url"
                  value={form.image}
                  onChange={(event) => update('image', event.target.value)}
                  placeholder="/images/products/… atau https://…"
                />
                <div className="image-controls-row">
                  <label className={`btn btn-outline btn-sm upload-btn ${uploading ? 'is-busy' : ''}`}>
                    {uploading ? 'Mengunggah…' : 'Unggah foto'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} hidden />
                  </label>
                  {form.image && (
                    <button type="button" className="btn btn-text btn-sm" onClick={() => update('image', '')}>
                      Hapus foto
                    </button>
                  )}
                </div>
                <div className="preset-row">
                  {PRESET_IMAGES.map((src) => (
                    <button
                      key={src}
                      type="button"
                      className={`preset-thumb ${form.image === src ? 'active' : ''}`}
                      onClick={() => update('image', src)}
                      aria-label={`Gunakan foto ${src.split('/').pop()}`}
                    >
                      <img src={src} alt="" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-head">
              <h3>Ukuran minuman</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => update('sizes', [...form.sizes, { label: '', extra: '0' }])}
              >
                + Tambah ukuran
              </button>
            </div>
            {form.sizes.map((size, index) => (
              <div className="repeat-row" key={index}>
                <input
                  type="text"
                  value={size.label}
                  placeholder="Regular (250 ml)"
                  onChange={(event) => {
                    const next = [...form.sizes];
                    next[index] = { ...next[index], label: event.target.value };
                    update('sizes', next);
                  }}
                  required
                />
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={size.extra}
                  placeholder="Tambahan harga"
                  onChange={(event) => {
                    const next = [...form.sizes];
                    next[index] = { ...next[index], extra: event.target.value };
                    update('sizes', next);
                  }}
                />
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => update('sizes', form.sizes.filter((_, i) => i !== index))}
                  aria-label="Hapus ukuran"
                  disabled={form.sizes.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
            <p className="hint">Tambahan harga dalam rupiah, contoh 5000 untuk Large +Rp 5.000.</p>
          </div>

          <div className="form-section">
            <h3>Sajian</h3>
            <div className="checkbox-row">
              {['Panas', 'Dingin'].map((option) => (
                <label key={option} className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.temperatures.includes(option)}
                    onChange={() => toggleTemperature(option)}
                  />
                  <span>{option}</span>
                </label>
              ))}
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => update('featured', event.target.checked)}
                />
                <span>Tampilkan di beranda</span>
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-head">
              <h3>Bahan &amp; foto bahan</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => update('ingredients', [...form.ingredients, { name: '', image: '' }])}
              >
                + Tambah bahan
              </button>
            </div>
            {form.ingredients.map((item, index) => (
              <div className="repeat-row" key={index}>
                <input
                  type="text"
                  value={item.name}
                  placeholder="Nama bahan"
                  onChange={(event) => {
                    const next = [...form.ingredients];
                    next[index] = { ...next[index], name: event.target.value };
                    update('ingredients', next);
                  }}
                />
                <input
                  type="text"
                  value={item.image}
                  placeholder="/images/ingredients/…"
                  onChange={(event) => {
                    const next = [...form.ingredients];
                    next[index] = { ...next[index], image: event.target.value };
                    update('ingredients', next);
                  }}
                />
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => update('ingredients', form.ingredients.filter((_, i) => i !== index))}
                  aria-label="Hapus bahan"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="form-section">
            <div className="form-section-head">
              <h3>Peralatan &amp; foto peralatan</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => update('tools', [...form.tools, { name: '', image: '' }])}
              >
                + Tambah alat
              </button>
            </div>
            {form.tools.map((item, index) => (
              <div className="repeat-row" key={index}>
                <input
                  type="text"
                  value={item.name}
                  placeholder="Nama peralatan"
                  onChange={(event) => {
                    const next = [...form.tools];
                    next[index] = { ...next[index], name: event.target.value };
                    update('tools', next);
                  }}
                />
                <input
                  type="text"
                  value={item.image}
                  placeholder="/images/tools/…"
                  onChange={(event) => {
                    const next = [...form.tools];
                    next[index] = { ...next[index], image: event.target.value };
                    update('tools', next);
                  }}
                />
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => update('tools', form.tools.filter((_, i) => i !== index))}
                  aria-label="Hapus peralatan"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <label className="field">
            <span>Cara meracik (satu langkah per baris)</span>
            <textarea
              rows={5}
              value={form.stepsText}
              onChange={(event) => update('stepsText', event.target.value)}
              placeholder={'Ekstrak espresso 36 ml.\nSteam susu hingga 65°C.\nTuang dan sajikan.'}
            />
          </label>

          {error && <div className="alert alert-error">{error}</div>}

          <footer className="admin-form-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Menyimpan…' : product ? 'Simpan Perubahan' : 'Simpan Produk'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pesanan                                                             */
/* ------------------------------------------------------------------ */

function formatOrderDate(value?: string) {
  if (!value) return '—';
  const iso = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function OrdersPanel({
  notify,
  onUpdated,
}: {
  notify: (type: Toast['type'], text: string) => void;
  onUpdated: () => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const { orders: list } = await api.adminOrders();
      setOrders(list);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat pesanan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changeStatus = async (order: Order, status: OrderStatus) => {
    setBusyId(order.id);
    try {
      const { order: updated } = await api.updateOrderStatus(order.id, status);
      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      notify('success', `${updated.code} → ${ORDER_STATUS_LABELS[updated.status]}.`);
      onUpdated();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Gagal mengubah status pesanan.');
    } finally {
      setBusyId(null);
    }
  };

  const newCount = orders.filter((order) => order.status === 'baru').length;

  return (
    <section id="pesanan" className="panel">
      <header className="panel-header">
        <div>
          <h2>Pesanan Pelanggan</h2>
          <p>Pesanan dari halaman checkout. Ubah status untuk menandai progres.</p>
        </div>
        <div className="panel-tools">
          <span className="summary-pill">
            Baru <strong>{newCount}</strong>
          </span>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void load()}>
            Muat ulang
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="admin-loading">Memuat pesanan…</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h3>Belum ada pesanan</h3>
          <p>Pesanan yang dikirim pelanggan lewat halaman checkout akan muncul di sini.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Pelanggan</th>
                <th>Pesanan</th>
                <th>Total</th>
                <th>Metode</th>
                <th>Status</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.code}</strong>
                  </td>
                  <td>
                    <div className="table-customer">
                      <strong>{order.customerName}</strong>
                      <a href={`https://wa.me/${order.customerPhone}`} target="_blank" rel="noreferrer">
                        {order.customerPhone}
                      </a>
                      {order.address && <span className="muted">{order.address}</span>}
                      {order.note && <span className="muted">Catatan: {order.note}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="table-customer">
                      {order.items.map((item) => (
                        <span key={`${order.id}-${item.productId}-${item.sizeLabel}-${item.temperature}`}>
                          {item.qty}× {item.name} · {item.sizeLabel}
                          {item.temperature ? ` · ${item.temperature}` : ''}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="price-cell">{formatRupiah(order.total)}</td>
                  <td>{order.method === 'delivery' ? 'Diantar' : 'Ambil sendiri'}</td>
                  <td>
                    <select
                      className={`status-select status-${order.status}`}
                      value={order.status}
                      disabled={busyId === order.id}
                      onChange={(event) => void changeStatus(order, event.target.value as OrderStatus)}
                      aria-label={`Status pesanan ${order.code}`}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {ORDER_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="muted">{formatOrderDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

function Dashboard({ admin, onLogout }: { admin: AdminUser; onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [editing, setEditing] = useState<Product | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [view, setView] = useState<'produk' | 'pesanan'>('produk');

  const notify = useCallback((type: Toast['type'], text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const load = useCallback(async () => {
    try {
      const [productRes, statRes] = await Promise.all([api.adminProducts(), api.stats()]);
      setProducts(productRes.products);
      setStats(statRes.stats);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshStats = async () => {
    try {
      const { stats: next } = await api.stats();
      setStats(next);
    } catch {
      /* stats refresh is non-critical */
    }
  };

  const handleSaved = (product: Product) => {
    setProducts((current) => {
      const exists = current.some((item) => item.id === product.id);
      return exists ? current.map((item) => (item.id === product.id ? product : item)) : [...current, product];
    });
    setEditing(null);
    notify('success', 'Produk berhasil disimpan.');
    void refreshStats();
  };

  const toggleStock = async (product: Product) => {
    try {
      const { product: updated } = await api.toggleStock(product.id, !product.inStock);
      setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      notify('success', `${updated.name} kini ${updated.inStock ? 'tersedia' : 'stok habis'}.`);
      void refreshStats();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Gagal mengubah stok.');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      await api.deleteProduct(deleting.id);
      setProducts((current) => current.filter((item) => item.id !== deleting.id));
      notify('success', `${deleting.name} dihapus.`);
      setDeleting(null);
      void refreshStats();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Gagal menghapus produk.');
    } finally {
      setBusyDelete(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchCategory = categoryFilter === 'Semua' || product.category === categoryFilter;
      const matchTerm =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term);
      return matchCategory && matchTerm;
    });
  }, [products, search, categoryFilter]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="brand brand-light">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <path
                d="M7 11h14v7a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-7Zm14 1.5h2.4a3.1 3.1 0 0 1 0 6.2H21M5 28h18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="brand-text">
            <strong>Kopi Mantap</strong>
            <small>Admin Console</small>
          </span>
        </Link>

        <nav className="admin-nav" aria-label="Navigasi dashboard">
          <button
            type="button"
            className={`admin-nav-link ${view === 'produk' ? 'active' : ''}`}
            onClick={() => setView('produk')}
          >
            <span>Ringkasan & Produk</span>
          </button>
          <button
            type="button"
            className={`admin-nav-link ${view === 'pesanan' ? 'active' : ''}`}
            onClick={() => setView('pesanan')}
          >
            <span>Pesanan</span>
            {stats?.orders?.baru ? <span className="nav-badge">{stats.orders.baru}</span> : null}
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <span className="avatar">{admin.username.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{admin.username}</strong>
              <span>Administrator</span>
            </div>
          </div>
          <button type="button" className="btn btn-outline-light btn-sm btn-block" onClick={onLogout}>
            Keluar
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-breadcrumb">
              Dashboard / {view === 'pesanan' ? 'Pesanan' : 'Ringkasan'}
            </span>
            <h1 className="font-display">Halo, {admin.username}!</h1>
          </div>
          <div className="admin-topbar-actions">
            <Link to="/" className="btn btn-outline btn-sm">
              Lihat situs
            </Link>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
              + Tambah Produk
            </button>
          </div>
        </header>

        <div className="admin-content">
          {error && <div className="alert alert-error">{error}</div>}

          {view === 'pesanan' ? (
            <OrdersPanel notify={notify} onUpdated={() => void refreshStats()} />
          ) : (
          <>
          <section id="ringkasan" className="stats-grid">
            <article className="stat-card">
              <span className="stat-label">Total produk</span>
              <strong>{stats ? stats.total : '—'}</strong>
              <span className="stat-foot">{stats ? `${stats.byCategory.length} kategori aktif` : 'Memuat…'}</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Stok tersedia</span>
              <strong>{stats ? stats.inStock : '—'}</strong>
              <span className="stat-foot">Siap dipesan pelanggan</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Stok habis</span>
              <strong>{stats ? stats.outOfStock : '—'}</strong>
              <span className="stat-foot">Perlu segera diisi</span>
            </article>
            <article className="stat-card stat-accent">
              <span className="stat-label">Nilai katalog</span>
              <strong>{stats ? formatRupiah(stats.value) : '—'}</strong>
              <span className="stat-foot">Total harga produk tersedia</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Pesanan baru</span>
              <strong>{stats?.orders ? stats.orders.baru : '—'}</strong>
              <span className="stat-foot">
                {stats?.orders ? `dari ${stats.orders.total} pesanan total` : 'Memuat…'}
              </span>
            </article>
          </section>

          {stats && stats.byCategory.length > 0 && (
            <section className="category-summary">
              {stats.byCategory.map((row) => (
                <span key={row.category} className="summary-pill">
                  {row.category} <strong>{row.n}</strong>
                </span>
              ))}
            </section>
          )}

          <section id="produk" className="panel">
            <header className="panel-header">
              <div>
                <h2>Daftar Produk</h2>
                <p>Kelola nama, harga, foto, kategori, ukuran, dan ketersediaan stok.</p>
              </div>
              <div className="panel-tools">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari produk…"
                  aria-label="Cari produk di dashboard"
                />
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  aria-label="Filter kategori produk"
                >
                  <option value="Semua">Semua kategori</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </header>

            {loading ? (
              <div className="admin-loading">Memuat produk…</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <h3>Belum ada produk</h3>
                <p>Tambahkan menu pertama atau ubah filter pencarian.</p>
                <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
                  + Tambah Produk
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Kategori</th>
                      <th>Harga</th>
                      <th>Ukuran</th>
                      <th>Stok</th>
                      <th className="align-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="table-product">
                            <FallbackImage src={product.image} alt={product.name} />
                            <div>
                              <strong>{product.name}</strong>
                              <span>{product.description.slice(0, 58)}{product.description.length > 58 ? '…' : ''}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="tag">{product.category}</span>
                        </td>
                        <td className="price-cell">{formatRupiah(product.price)}</td>
                        <td className="muted">{product.sizes.length} varian</td>
                        <td>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={product.inStock}
                            aria-label={`Ubah stok ${product.name}`}
                            className={`switch ${product.inStock ? 'on' : ''}`}
                            onClick={() => void toggleStock(product)}
                          >
                            <span className="switch-track">
                              <span className="switch-thumb" />
                            </span>
                            <span className="switch-label">{product.inStock ? 'Aktif' : 'Habis'}</span>
                          </button>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setEditing(product)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger-ghost btn-sm"
                              onClick={() => setDeleting(product)}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className="admin-footnote">
            Pesanan pelanggan masuk ke tab Pesanan dan diteruskan ke WhatsApp admin{' '}
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
              0821-2219-0680
            </a>
            . Data produk & pesanan tersimpan di database server.
          </p>
          </>
          )}
        </div>
      </div>

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {deleting && (
        <div className="modal-backdrop" role="presentation" onClick={() => setDeleting(null)}>
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="confirm-title" className="font-display">
              Hapus produk ini?
            </h2>
            <p>
              <strong>{deleting.name}</strong> akan dihapus permanen dari katalog dan dashboard.
            </p>
            <div className="confirm-actions">
              <button type="button" className="btn btn-outline" onClick={() => setDeleting(null)}>
                Batal
              </button>
              <button type="button" className="btn btn-danger" onClick={() => void confirmDelete()} disabled={busyDelete}>
                {busyDelete ? 'Menghapus…' : 'Ya, hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.text}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function Admin() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .me()
      .then(({ admin: user }) => alive && setAdmin(user))
      .catch(() => undefined)
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, []);

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setAdmin(null);
    }
  };

  if (checking) {
    return (
      <div className="admin-splash">
        <div className="splash-mark">KM</div>
        <p>Memeriksa sesi admin…</p>
      </div>
    );
  }

  if (!admin) return <AdminLogin onSuccess={setAdmin} />;
  return <Dashboard admin={admin} onLogout={() => void logout()} />;
}
