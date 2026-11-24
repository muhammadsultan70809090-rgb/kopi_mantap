import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Product } from '../types';
import { WHATSAPP_NUMBER } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { FallbackImage } from '../components/FallbackImage';

const categories = [
  {
    name: 'Coffee Milk',
    desc: 'Espresso lembut bertemu susu segar.',
    image: '/images/products/kopi-susu-mantap.jpg',
  },
  {
    name: 'Espresso Based',
    desc: 'Kopi murni untuk pecinta rasa kuat.',
    image: '/images/products/espresso-single.jpg',
  },
  {
    name: 'Flavored Coffee',
    desc: 'Karamel, cokelat, dan butterscotch.',
    image: '/images/products/mocha-cokelat.jpg',
  },
  {
    name: 'Non-Coffee',
    desc: 'Matcha dan cokelat tanpa kafein.',
    image: '/images/products/matcha-latte.jpg',
  },
];

const testimonials = [
  {
    quote:
      'Kopi susu mantapnya benar-benar juara. Manisnya pas, kopinya berasa, dan packaging-nya rapi. Sudah jadi langganan tiap pagi.',
    name: 'Dinda Prameswari',
    role: 'Pelanggan setia',
  },
  {
    quote:
      'Detail racikannya bikin saya makin percaya. Bahan dan peralatannya jelas, jadi tahu apa yang saya minum. Matcha latte-nya lembut banget.',
    name: 'Raka Wijaya',
    role: 'Coffee enthusiast',
  },
  {
    quote:
      'Pesan lewat WhatsApp cuma hitungan detik, langsung dibalas admin. Butterscotch coffee-nya wangi dan tidak terlalu manis.',
    name: 'Sinta Maharani',
    role: 'Karyawan kantor',
  },
];

export function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .products()
      .then(({ products }) => {
        if (!alive) return;
        const picks = products.filter((product) => product.featured).slice(0, 4);
        setFeatured(picks.length > 0 ? picks : products.slice(0, 4));
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError('');
    setReloadKey((key) => key + 1);
  };

  return (
    <main className="home">
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="dot" aria-hidden="true" /> Kopi premium · diracik segar
            </span>
            <h1 className="font-display">
              Setiap Tegukan, <em>Rasa Juara.</em>
            </h1>
            <p className="hero-lead">
              Dari biji arabika Gayo dan Toraja pilihan, diseduh barista berpengalaman menjadi
              racikan kopi susu, espresso, dan non-coffee yang bikin harimu jauh lebih mantap.
            </p>
            <div className="hero-actions">
              <Link to="/menu" className="btn btn-primary btn-lg">
                Pesan Sekarang
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link to="/tentang" className="btn btn-outline btn-lg">
                Cerita Kami
              </Link>
            </div>
            <dl className="hero-stats">
              <div>
                <dt>4</dt>
                <dd>Kategori menu</dd>
              </div>
              <div>
                <dt>100%</dt>
                <dd>Arabika pilihan</dd>
              </div>
              <div>
                <dt>4.9</dt>
                <dd>Rating pelanggan</dd>
              </div>
            </dl>
          </div>

          <div className="hero-visual">
            <div className="hero-frame">
              <FallbackImage src="/images/hero.jpg" alt="Dua gelas kopi latte racikan Kopi Mantap" eager />
            </div>
            <div className="hero-badge">
              <span className="hero-badge-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 3l2.2 4.9 5.3.7-3.9 3.7.9 5.3L12 15l-4.5 2.6.9-5.3-3.9-3.7 5.3-.7L12 3Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <div>
                <strong>4.9 / 5</strong>
                <span>dari 1.200+ pelanggan</span>
              </div>
            </div>
            <div className="hero-stamp" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <defs>
                  <path id="stamp-circle" d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" />
                </defs>
                <text>
                  <textPath href="#stamp-circle">ROASTED IN-HOUSE · SINCE 2018 · </textPath>
                </text>
              </svg>
              <span>KM</span>
            </div>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <div className="marquee-group" key={copy}>
              <span>Arabika Gayo</span>
              <span>•</span>
              <span>Susu Segar</span>
              <span>•</span>
              <span>Gula Aren</span>
              <span>•</span>
              <span>Roasted In-House</span>
              <span>•</span>
              <span>Diracik Barista</span>
              <span>•</span>
            </div>
          ))}
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Menu andalan</span>
              <h2 className="font-display">Paling Dicari Pelanggan</h2>
            </div>
            <Link to="/menu" className="btn btn-outline">
              Lihat semua menu
            </Link>
          </div>

          {error && (
            <div className="alert alert-error alert-inline">
              <span>{error}</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={retry}>
                Coba lagi
              </button>
            </div>
          )}

          {loading ? (
            <div className="product-grid">
              {[0, 1, 2, 3].map((key) => (
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
          ) : (
            <div className="product-grid">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} onOpen={setActive} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Kategori</span>
              <h2 className="font-display">Temukan Rasa Favoritmu</h2>
            </div>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={`/menu?category=${encodeURIComponent(category.name)}`}
                className="category-card"
              >
                <FallbackImage src={category.image} alt={category.name} />
                <div className="category-card-body">
                  <h3>{category.name}</h3>
                  <p>{category.desc}</p>
                  <span className="category-link">
                    Jelajahi
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container values-grid">
          <div className="values-copy">
            <span className="eyebrow">Kenapa Kopi Mantap</span>
            <h2 className="font-display">Bukan Sekadar Kopi, Ini Standar Kami.</h2>
            <p>
              Kami percaya secangkir kopi yang baik lahir dari bahan jujur, mesin yang terawat,
              dan barista yang peduli pada detail. Itulah kenapa setiap gelas Kopi Mantap
              konsisten dari hari pertama kamu mencobanya.
            </p>
            <ul className="check-list">
              <li>Biji arabika single origin, disangrai sendiri setiap minggu.</li>
              <li>Susu segar pasteurisasi, tanpa krimer atau pemanis buatan.</li>
              <li>Setiap pesanan diracik fresh, bukan disimpan dalam wadah.</li>
            </ul>
            <Link to="/tentang" className="btn btn-primary">
              Kenali Kami Lebih Dekat
            </Link>
          </div>
          <div className="values-media">
            <FallbackImage src="/images/brew.jpg" alt="Barista menyeduh kopi manual brew" />
            <div className="values-note">
              <strong>08.00 – 22.00</strong>
              <span>Buka setiap hari</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow light">Kata mereka</span>
              <h2 className="font-display">Sudah Jadi Bagian dari Hari Mereka</h2>
            </div>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <blockquote className="testimonial" key={item.name}>
                <div className="stars" aria-label="Rating 5 dari 5">
                  ★★★★★
                </div>
                <p>“{item.quote}”</p>
                <footer>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <div>
              <span className="eyebrow light">Siap mencoba?</span>
              <h2 className="font-display">Racik Pesananmu Sekarang.</h2>
              <p>
                Pilih menu, atur ukuran dan suhu, lalu checkout langsung ke WhatsApp admin.
                Kami balas cepat dan siapkan pesananmu segar.
              </p>
            </div>
            <div className="cta-actions">
              <Link to="/menu" className="btn btn-light btn-lg">
                Buka Katalog
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-light btn-lg"
              >
                Tanya Admin
              </a>
            </div>
          </div>
        </div>
      </section>

      {active && <ProductModal product={active} onClose={() => setActive(null)} />}
    </main>
  );
}
