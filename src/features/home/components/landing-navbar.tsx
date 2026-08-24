import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ButtonLink } from '../../../components/ui/button.js';

const logoUrl = '/images/landing-page/hero/logo-v1-darkmode.png';

const NAV_LINKS = [
  { label: 'O que é', href: '#o-que-e' },
  { label: 'Comunidades', href: '#comunidades' },
  { label: 'Segurança', href: '#seguranca' },
  { label: 'Sobre', href: '#sobre' }
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
    const desktopQuery = window.matchMedia('(min-width: 761px)');
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
        <Link to="/" className="landing-navbar__brand" aria-label="Mesmice, página inicial">
          <img className="landing-navbar__logo" src={logoUrl} alt="Mesmice" />
        </Link>
        <div className="landing-navbar__links">
          {NAV_LINKS.map((link) => (
            <a key={link.href} className="landing-navbar__link" href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div className="landing-navbar__actions">
          <ButtonLink to="/login" variant="secondary" wave>
            Entrar
          </ButtonLink>
          <ButtonLink to="/login" className="landing-navbar__signup" wave>
            Criar conta
          </ButtonLink>
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
      </nav>
      <div id={menuId} className="landing-navbar__mobile-menu" hidden={!isMenuOpen}>
        <div className="landing-navbar__mobile-links">
          {NAV_LINKS.map((link) => (
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
          <ButtonLink to="/login" onClick={closeMenu} wave>
            Criar conta
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
