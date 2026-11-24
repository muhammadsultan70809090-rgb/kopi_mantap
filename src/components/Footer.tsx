import { Link } from 'react-router-dom';
import { WHATSAPP_NUMBER } from '../types';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <h3 className="font-display">Kopi Mantap</h3>
          <p>
            Kopi premium racikan barista dari biji arabika pilihan Nusantara. Diseduh segar,
            dikirim cepat, rasa selalu mantap.
          </p>
          <a
            className="footer-wa"
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 20l1.4-4.2A8 8 0 1 1 8.6 19L4 20Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M9 8.5c.4 2.6 2 4.2 4.6 4.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            0821-2219-0680
          </a>
        </div>

        <div>
          <h4>Jelajahi</h4>
          <ul>
            <li>
              <Link to="/">Beranda</Link>
            </li>
            <li>
              <Link to="/menu">Menu Lengkap</Link>
            </li>
            <li>
              <Link to="/tentang">Tentang Kami</Link>
            </li>
            <li>
              <Link to="/admin">Dashboard Admin</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Kategori</h4>
          <ul>
            <li>
              <Link to="/menu?category=Coffee%20Milk">Coffee Milk</Link>
            </li>
            <li>
              <Link to="/menu?category=Espresso%20Based">Espresso Based</Link>
            </li>
            <li>
              <Link to="/menu?category=Flavored%20Coffee">Flavored Coffee</Link>
            </li>
            <li>
              <Link to="/menu?category=Non-Coffee">Non-Coffee</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Kunjungi</h4>
          <address>
            Jl. Raya Kopi No. 8
            <br />
            Bandung, Jawa Barat
            <br />
            <br />
            Senin – Minggu
            <br />
            08.00 – 22.00 WIB
          </address>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Kopi Mantap. Semua hak dilindungi.</p>
        <p>Diseduh dengan ♥ di Bandung.</p>
      </div>
    </footer>
  );
}
