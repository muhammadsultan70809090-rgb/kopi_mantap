import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { formatRupiah } from '../types';
import { useCart } from '../context/CartContext';
import { FallbackImage } from './FallbackImage';

type Props = {
  product: Product;
  onClose: () => void;
};

export function ProductModal({ product, onClose }: Props) {
  const { addItem } = useCart();
  const [sizeIndex, setSizeIndex] = useState(0);
  const [temperature, setTemperature] = useState(product.temperatures[0] ?? '');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const size = product.sizes[sizeIndex] ?? { label: 'Regular', extra: 0 };
  const unitPrice = product.price + size.extra;

  const handleAdd = () => {
    if (!product.inStock) return;
    addItem(product, size, temperature, qty);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup detail produk">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div className="product-modal-hero">
          <FallbackImage src={product.image} alt={product.name} eager />
          <div className="product-modal-hero-tags">
            <span className="product-category">{product.category}</span>
            <span className={`stock-pill ${product.inStock ? 'in' : 'out'}`}>
              {product.inStock ? 'Tersedia' : 'Stok habis'}
            </span>
          </div>
        </div>

        <div className="product-modal-content">
          <div className="modal-heading">
            <div>
              <h2 id="product-modal-title" className="font-display">
                {product.name}
              </h2>
              <p className="modal-desc">{product.description}</p>
            </div>
            <div className="modal-price">
              <span>Mulai dari</span>
              <strong>{formatRupiah(product.price)}</strong>
            </div>
          </div>

          <div className="option-group">
            <span className="option-label">Pilih ukuran</span>
            <div className="chip-row">
              {product.sizes.map((option, index) => (
                <button
                  key={option.label}
                  type="button"
                  className={`option-chip ${index === sizeIndex ? 'active' : ''}`}
                  onClick={() => setSizeIndex(index)}
                >
                  <span>{option.label}</span>
                  {option.extra > 0 && <small>+{formatRupiah(option.extra)}</small>}
                </button>
              ))}
            </div>
          </div>

          {product.temperatures.length > 0 && (
            <div className="option-group">
              <span className="option-label">Disajikan</span>
              <div className="chip-row">
                {product.temperatures.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`option-chip ${option === temperature ? 'active' : ''}`}
                    onClick={() => setTemperature(option)}
                  >
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="recipe-section">
            <div className="recipe-heading">
              <h3>Bahan Rahasia</h3>
              <span>Geser untuk melihat →</span>
            </div>
            {product.ingredients.length > 0 ? (
              <div className="h-scroll" tabIndex={0} aria-label="Foto bahan minuman">
                {product.ingredients.map((item) => (
                  <figure key={`${item.name}-${item.image}`} className="h-card">
                    <FallbackImage src={item.image} alt={item.name} />
                    <figcaption>{item.name}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="muted">Informasi bahan belum ditambahkan.</p>
            )}
          </div>

          <div className="recipe-section">
            <div className="recipe-heading">
              <h3>Peralatan</h3>
              <span>Geser untuk melihat →</span>
            </div>
            {product.tools.length > 0 ? (
              <div className="h-scroll" tabIndex={0} aria-label="Foto peralatan meracik">
                {product.tools.map((item) => (
                  <figure key={`${item.name}-${item.image}`} className="h-card">
                    <FallbackImage src={item.image} alt={item.name} />
                    <figcaption>{item.name}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="muted">Informasi peralatan belum ditambahkan.</p>
            )}
          </div>

          <div className="recipe-section">
            <div className="recipe-heading">
              <h3>Cara Meracik</h3>
            </div>
            {product.steps.length > 0 ? (
              <ol className="steps-list">
                {product.steps.map((step, index) => (
                  <li key={step}>
                    <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                    <p>{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">Langkah meracik belum ditambahkan.</p>
            )}
          </div>

          <div className="modal-buy-bar">
            <div className="qty-control" aria-label="Jumlah pesanan">
              <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Kurangi jumlah">
                −
              </button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((value) => Math.min(99, value + 1))} aria-label="Tambah jumlah">
                +
              </button>
            </div>
            <button type="button" className="btn btn-primary btn-block" onClick={handleAdd} disabled={!product.inStock}>
              {product.inStock ? `Tambah ke Keranjang · ${formatRupiah(unitPrice * qty)}` : 'Stok sedang habis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
