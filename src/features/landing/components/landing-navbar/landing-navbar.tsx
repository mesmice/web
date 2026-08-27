import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ButtonLink } from '../../../../components/ui/button.js';
import { NavbarShape } from './navbar-shape.js';

const desktopLogoUrl = '/images/landing-page/hero/logo-v1-lightmode.png';
const mobileLogoUrl = desktopLogoUrl;

const NAV_LINKS = [
  { label: 'Download', href: '#download' },
  { label: 'Sobre nós', href: '#about' },
  { label: 'Como funciona', href: '#how-works' },
    { label: 'Suporte', href: '#support' },
];

const MOBILE_NAV_LINKS = [
  { label: 'Download', href: '#download' },
  { label: 'Sobre nós', href: '#about' },
  { label: 'Como funciona', href: '#how-works' },
    { label: 'Suporte', href: '#support' },
];

export function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useId();
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    const desktopQuery = window.matchMedia('(min-width: 1001px)');
    const previousBodyOverflow = document.body.style.overflow;
    const handleDesktopChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMenuOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    desktopQuery.addEventListener('change', handleDesktopChange);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      desktopQuery.removeEventListener('change', handleDesktopChange);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="landing-navbar">
      <nav className="landing-navbar__inner" aria-label="Navegação principal">
        <Link
          to="/"
          className="landing-navbar__brand landing-navbar__mobile-brand"
          aria-label="Mesmice, página inicial"
        >
          <img className="landing-navbar__logo" src={mobileLogoUrl} alt="Mesmice" />
        </Link>
        <div className="landing-navbar__shell">
          <NavbarShape />
          <div className="landing-navbar__primary">
            <Link to="/" className="landing-navbar__brand" aria-label="Mesmice, página inicial">
              <img className="landing-navbar__logo" src={desktopLogoUrl} alt="Mesmice" />
            </Link>
            <div className="landing-navbar__links">
              {NAV_LINKS.map((link) => (
                <a key={link.href} className="landing-navbar__link" href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="landing-navbar__actions">
            <ButtonLink to="/login" variant="secondary" wave>
              Entrar
            </ButtonLink>
            <ButtonLink to="/register" className="landing-navbar__signup" wave>
              Criar conta
            </ButtonLink>
          </div>
        </div>
        <button
          className="landing-navbar__menu-button"
          type="button"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
          aria-controls={menuId}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="landing-navbar__menu-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <ButtonLink
          to="/register"
          className="landing-navbar__mobile-signup"
          onClick={closeMenu}
          wave
        >
          Criar conta
        </ButtonLink>
      </nav>
      <div
        id={menuId}
        className="landing-navbar__mobile-menu"
        aria-label="Navegação mobile"
        hidden={!isMenuOpen}
      >
        <div className="landing-navbar__mobile-links">
          {MOBILE_NAV_LINKS.map((link) => (
            <a
              key={link.href}
              className="landing-navbar__mobile-link"
              href={link.href}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="landing-navbar__mobile-actions">
          <ButtonLink to="/login" variant="secondary" onClick={closeMenu} wave>
            Entrar
          </ButtonLink>
          <ButtonLink to="/register" onClick={closeMenu} wave>
            Criar conta
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
