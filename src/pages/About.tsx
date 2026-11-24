import { Link } from 'react-router-dom';
import { WHATSAPP_NUMBER } from '../types';
import { FallbackImage } from '../components/FallbackImage';

const milestones = [
  {
    year: '2018',
    title: 'Dimulai dari gerobak kecil',
    text: 'Dua bersaudara membuka gerobak kopi susu di pinggir Jalan Raya Kopi dengan satu mesin espresso bekas.',
  },
  {
    year: '2020',
    title: 'Roastery sendiri',
    text: 'Kami mulai menyangrai biji arabika Gayo dan Toraja sendiri agar profil rasa setiap cangkir konsisten.',
  },
  {
    year: '2023',
    title: 'Kedai pertama',
    text: 'Kopi Mantap membuka kedai 40 meter persegi dengan bar terbuka, tempat tamu bisa melihat barista meracik.',
  },
  {
    year: '2026',
    title: 'Pesan online',
    text: 'Kini seluruh menu bisa dipesan langsung lewat WhatsApp dengan detail racikan yang transparan.',
  },
];

export function About() {
  return (
    <main className="about-page">
      <section className="page-header">
        <div className="container">
          <span className="eyebrow">Tentang kami</span>
          <h1 className="font-display">
            Kopi yang jujur, <em>dibuat dengan sabar.</em>
          </h1>
          <p>
            Kopi Mantap lahir dari satu keyakinan sederhana: secangkir kopi yang baik tidak perlu
            dibuat rumit. Cukup bahan terbaik, takaran yang tepat, dan barista yang peduli.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container about-story">
          <div className="about-media">
            <FallbackImage src="/images/interior.jpg" alt="Suasana kedai Kopi Mantap" />
            <div className="about-media-tag">
              <strong>Sejak 2018</strong>
              <span>Bandung, Jawa Barat</span>
            </div>
          </div>
          <div className="about-copy">
            <span className="eyebrow">Cerita kami</span>
            <h2 className="font-display">Dari Gerobak Kecil ke Cangkir Ribuan Orang.</h2>
            <p>
              Semua dimulai dari resep kopi susu gula aren keluarga yang selalu diminta teman-teman
              untuk dibuatkan lagi. Kami menyadari satu hal: rasa yang konsisten adalah hadiah
              terbaik untuk pelanggan.
            </p>
            <p>
              Karena itu setiap batch biji disangrai sendiri, setiap mesin dikalibrasi dua kali
              sehari, dan setiap pesanan diracik saat dipesan — tidak pernah disiapkan lebih awal.
              Kami memilih jalur yang lebih lambat, karena rasanya memang lebih baik.
            </p>
            <div className="about-stats">
              <div>
                <strong>12.000+</strong>
                <span>Cangkir disajikan</span>
              </div>
              <div>
                <strong>4</strong>
                <span>Kategori menu</span>
              </div>
              <div>
                <strong>4.9</strong>
                <span>Rating pelanggan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Perjalanan</span>
              <h2 className="font-display">Tumbuh Bersama Pelanggan</h2>
            </div>
          </div>
          <div className="timeline">
            {milestones.map((item) => (
              <div className="timeline-item" key={item.year}>
                <span className="timeline-year">{item.year}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Nilai kami</span>
              <h2 className="font-display">Tiga Hal yang Tidak Kami Kompromikan</h2>
            </div>
          </div>
          <div className="value-cards">
            <article className="value-card">
              <span className="value-icon">01</span>
              <h3>Bahan jujur</h3>
              <p>
                Biji arabika pilihan, susu segar, dan pemanis alami. Tidak ada krimer atau perisa
                sintetis di balik counter kami.
              </p>
            </article>
            <article className="value-card">
              <span className="value-icon">02</span>
              <h3>Racikan presisi</h3>
              <p>
                Setiap resep punya takaran gram, suhu, dan waktu ekstraksi yang dicatat. Barista
                kami mengikuti standar yang sama setiap hari.
              </p>
            </article>
            <article className="value-card">
              <span className="value-icon">03</span>
              <h3>Ramah lingkungan</h3>
              <p>
                Ampas kopi kami bagikan gratis sebagai kompos, dan kemasan memakai material yang
                dapat didaur ulang.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <div>
              <span className="eyebrow light">Mampir, yuk</span>
              <h2 className="font-display">Ngopi Langsung di Kedai Kami.</h2>
              <p>
                Jl. Raya Kopi No. 8, Bandung. Buka setiap hari 08.00 – 22.00 WIB. Ada area bar
                terbuka dan meja kerja dengan colokan di setiap sudut.
              </p>
            </div>
            <div className="cta-actions">
              <Link to="/menu" className="btn btn-light btn-lg">
                Lihat Menu
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-light btn-lg"
              >
                Chat Admin
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
