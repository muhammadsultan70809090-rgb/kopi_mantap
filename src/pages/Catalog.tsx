import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import type { Product } from '../types';
import { CATEGORIES } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';

type SortMode = 'default' | 'price-asc' | 'price-desc';

export function Catalog() {
  const [params, setParams] = useSearchParams();
  const categoryParam = params.get('category') ?? 'Semua';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('default');
  const [active, setActive] = useState<Product | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .products()
      .then(({ products: list }) => {
        if (!alive) return;
        setProducts(list);
        setError('');
      })
      .catch((err: Error) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = products.filter((product) => {
      const matchCategory = categoryParam === 'Semua' || product.category === categoryParam;
      const matchTerm =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term);
      return matchCategory && matchTerm;
    });

    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, categoryParam, query, sort]);

  const setCategory = (category: string) => {
    if (category === 'Semua') setParams({});
    else setParams({ category });
  };

  return (
    <main className="catalog-page">
      <section className="page-header">
        <div className="container">
          <span className="eyebrow">Katalog lengkap</span>
          <h1 className="font-display">
            Menu Kopi Mantap, <em>dari biji ke cangkir.</em>
          </h1>
          <p>
            Cari minuman favoritmu, saring berdasarkan kategori, dan urutkan sesuai harga.
            Klik kartu produk untuk melihat bahan, peralatan, dan cara meraciknya.
          </p>
        </div>
      </section>

      <div className="container catalog-body">
        <div className="catalog-toolbar">
          <div className="search-field">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari kopi susu, matcha, caramel…"
              aria-label="Cari produk"
            />
          </div>

          <label className="sort-field">
            <span>Urutkan</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
              <option value="default">Pilihan barista</option>
              <option value="price-asc">Harga termurah</option>
              <option value="price-desc">Harga termahal</option>
            </select>
          </label>
        </div>

        <div className="filter-row" role="tablist" aria-label="Filter kategori">
          {['Semua', ...CATEGORIES].map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={categoryParam === category}
              className={`filter-chip ${categoryParam === category ? 'active' : ''}`}
              onClick={() => setCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="catalog-meta">
          <span>
            {loading ? 'Memuat menu…' : `${filtered.length} produk ditemukan`}
            {categoryParam !== 'Semua' ? ` · ${categoryParam}` : ''}
          </span>
          {(query || sort !== 'default' || categoryParam !== 'Semua') && (
            <button
              type="button"
              className="link-reset"
              onClick={() => {
                setQuery('');
                setSort('default');
                setParams({});
              }}
            >
              Reset filter
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="product-grid">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <div className="product-card skeleton" key={key}>
                <div className="skeleton-media" />
                <div className="skeleton-lines">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>Produk tidak ditemukan</h3>
            <p>Coba kata kunci lain atau tampilkan semua kategori.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setQuery('');
                setParams({});
              }}
            >
              Tampilkan semua menu
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} onOpen={setActive} />
            ))}
          </div>
        )}
      </div>

      {active && <ProductModal product={active} onClose={() => setActive(null)} />}
    </main>
  );
}
