import type { Product } from '../types';
import { formatRupiah } from '../types';
import { useCart } from '../context/CartContext';
import { FallbackImage } from './FallbackImage';

type Props = {
  product: Product;
  onOpen: (product: Product) => void;
};

export function ProductCard({ product, onOpen }: Props) {
  const { addItem } = useCart();

  const addDefault = () => {
    if (!product.inStock) return;
    const size = product.sizes[0] ?? { label: 'Regular', extra: 0 };
    addItem(product, size, product.temperatures[0] ?? '', 1);
  };

  return (
    <article className={`product-card ${product.inStock ? '' : 'is-sold-out'}`}>
      <button
        type="button"
        className="product-media"
        onClick={() => onOpen(product)}
        aria-label={`Lihat detail ${product.name}`}
      >
        <FallbackImage src={product.image} alt={product.name} />
        <span className="product-category">{product.category}</span>
        <span className={`stock-pill ${product.inStock ? 'in' : 'out'}`}>
          {product.inStock ? 'Tersedia' : 'Habis'}
        </span>
        <span className="product-media-hint">Lihat detail racikan</span>
      </button>

      <div className="product-body">
        <div className="product-title-row">
          <h3>{product.name}</h3>
          <span className="product-price">{formatRupiah(product.price)}</span>
        </div>
        <p className="product-desc">{product.description}</p>
        <div className="product-meta">
          <span>{product.sizes.length} ukuran</span>
          <span aria-hidden="true">·</span>
          <span>{product.temperatures.length > 0 ? product.temperatures.join(' / ') : 'Panas'}</span>
        </div>
        <div className="product-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpen(product)}>
            Detail
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={addDefault}
            disabled={!product.inStock}
          >
            {product.inStock ? 'Tambah' : 'Stok Habis'}
          </button>
        </div>
      </div>
    </article>
  );
}
