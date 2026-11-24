import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { WHATSAPP_NUMBER, formatRupiah } from '../types';
import { FallbackImage } from './FallbackImage';

export function CartDrawer() {
  const { items, total, isOpen, setOpen, updateQty, removeItem, clearCart } = useCart();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, setOpen]);

  const buildMessage = () => {
    const lines = items.map(
      (item, index) =>
        `${index + 1}. ${item.name}\n   ${item.sizeLabel}${item.temperature ? ` · ${item.temperature}` : ''}\n   ${item.qty} x ${formatRupiah(item.unitPrice)} = ${formatRupiah(item.unitPrice * item.qty)}`,
    );
    const parts = [
      '*PESANAN KOPI MANTAP*',
      '--------------------------------',
      ...lines,
      '--------------------------------',
      `*Total Pembayaran: ${formatRupiah(total)}*`,
      '',
      `Nama: ${name.trim() || '-'}`,
    ];
    if (note.trim()) parts.push(`Catatan: ${note.trim()}`);
    parts.push('', 'Mohon konfirmasi pesanan saya. Terima kasih! 🙏');
    return parts.join('\n');
  };

  const checkout = () => {
    if (items.length === 0) return;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage())}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div
        className={`drawer-overlay ${isOpen ? 'is-visible' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`cart-drawer ${isOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Keranjang pesanan"
        aria-hidden={!isOpen}
      >
        <header className="drawer-header">
          <div>
            <span className="eyebrow">Pesanan kamu</span>
            <h2 className="font-display">Keranjang</h2>
          </div>
          <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Tutup keranjang">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="empty-cart">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 7h12l-1.2 12.1a2 2 0 0 1-2 1.9H9.2a2 2 0 0 1-2-1.9L6 7Zm3 0V6a3 3 0 0 1 6 0v1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
              <h3>Keranjang masih kosong</h3>
              <p>Yuk pilih kopi favoritmu — racikan barista siap dibuat segar.</p>
              <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
                Lihat Menu
              </button>
            </div>
          ) : (
            <>
              <ul className="cart-items">
                {items.map((item) => (
                  <li key={item.key} className="cart-item">
                    <FallbackImage src={item.image} alt={item.name} className="cart-thumb" />
                    <div className="cart-item-info">
                      <div className="cart-item-top">
                        <h3>{item.name}</h3>
                        <button
                          type="button"
                          className="link-danger"
                          onClick={() => removeItem(item.key)}
                          aria-label={`Hapus ${item.name}`}
                        >
                          Hapus
                        </button>
                      </div>
                      <p className="cart-item-option">
                        {item.sizeLabel}
                        {item.temperature ? ` · ${item.temperature}` : ''}
                      </p>
                      <div className="cart-item-bottom">
                        <div className="qty-control qty-sm">
                          <button
                            type="button"
                            onClick={() => updateQty(item.key, item.qty - 1)}
                            aria-label={`Kurangi ${item.name}`}
                          >
                            −
                          </button>
                          <span>{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.key, item.qty + 1)}
                            aria-label={`Tambah ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                        <strong>{formatRupiah(item.unitPrice * item.qty)}</strong>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="cart-form">
                <label>
                  <span>Nama pemesan</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nama kamu"
                  />
                </label>
                <label>
                  <span>Catatan (opsional)</span>
                  <input
                    type="text"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Contoh: less sugar, tanpa es"
                  />
                </label>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <footer className="drawer-footer">
            <div className="cart-total-row">
              <span>Total pembayaran</span>
              <strong>{formatRupiah(total)}</strong>
            </div>
            <Link to="/checkout" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
              Lanjut ke checkout
            </Link>
            <button type="button" className="btn btn-text btn-block" onClick={checkout}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 20l1.4-4.2A8 8 0 1 1 8.6 19L4 20Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M9 8.5c.4 2.6 2 4.2 4.6 4.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Pesan cepat via WhatsApp
            </button>
            <button type="button" className="btn btn-text btn-block" onClick={clearCart}>
              Kosongkan keranjang
            </button>
            <p className="drawer-note">Pesanan diteruskan ke admin 0821-2219-0680.</p>
          </footer>
        )}
      </aside>
    </>
  );
}
