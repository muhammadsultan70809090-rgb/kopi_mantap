import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const links = [
  { to: '/', label: 'Beranda' },
  { to: '/menu', label: 'Menu' },
  { to: '/tentang', label: 'Tentang Kami' },
];

export function Navbar() {
  const { count, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="Kopi Mantap, kembali ke beranda">
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
              <path d="M11 7c0-1.5 2-1.5 2-3M16 7c0-1.5 2-1.5 2-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <span className="brand-text">
            <strong>Kopi Mantap</strong>
            <small>Coffee Roastery · Est. 2018</small>
          </span>
        </Link>

        <nav className={`nav-links ${mobileOpen ? 'is-open' : ''}`} aria-label="Navigasi utama">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
          <Link to="/admin" className="nav-link nav-link-admin">
            Admin
          </Link>
        </nav>

        <div className="nav-actions">
          <button type="button" className="cart-button" onClick={() => setOpen(true)} aria-label={`Buka keranjang, ${count} item`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 7h12l-1.2 12.1a2 2 0 0 1-2 1.9H9.2a2 2 0 0 1-2-1.9L6 7Zm3 0V6a3 3 0 0 1 6 0v1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="cart-button-label">Keranjang</span>
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>
          <button
            type="button"
            className={`menu-toggle ${mobileOpen ? 'is-open' : ''}`}
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label="Buka menu navigasi"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
