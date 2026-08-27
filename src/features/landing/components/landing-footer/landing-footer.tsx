import { ButtonLink } from '../../../../components/ui/button.js';
import './landing-footer.css';

type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

type FooterGroup = {
  label: string;
  links: FooterLink[];
};

const PENDING_FOOTER_DESTINATION = '#footer-navigation';

const footerNavigation: FooterGroup[] = [
  {
    label: 'Produto',
    links: [
      { label: 'Download', href: PENDING_FOOTER_DESTINATION },
      { label: 'Como funciona', href: '#o-que-e' },
      { label: 'Conversas', href: PENDING_FOOTER_DESTINATION },
      { label: 'Spaces', href: PENDING_FOOTER_DESTINATION },
      { label: 'Canais', href: PENDING_FOOTER_DESTINATION },
      { label: 'Perfis', href: PENDING_FOOTER_DESTINATION }
    ]
  },
  {
    label: 'Mesmice',
    links: [
      { label: 'Sobre nós', href: '#o-que-e' },
      { label: 'Roadmap', href: PENDING_FOOTER_DESTINATION },
      { label: 'GitHub', href: PENDING_FOOTER_DESTINATION },
      { label: 'Status', href: PENDING_FOOTER_DESTINATION }
    ]
  },
  {
    label: 'Recursos',
    links: [
      { label: 'Suporte', href: PENDING_FOOTER_DESTINATION },
      { label: 'Central de ajuda', href: PENDING_FOOTER_DESTINATION },
      { label: 'Segurança', href: PENDING_FOOTER_DESTINATION },
      { label: 'Comunidade', href: PENDING_FOOTER_DESTINATION },
      { label: 'Desenvolvedores', href: PENDING_FOOTER_DESTINATION }
    ]
  },
  {
    label: 'Políticas',
    links: [
      { label: 'Termos', href: PENDING_FOOTER_DESTINATION },
      { label: 'Privacidade', href: PENDING_FOOTER_DESTINATION },
      { label: 'Cookies', href: PENDING_FOOTER_DESTINATION },
      {
        label: 'Diretrizes da comunidade',
        href: PENDING_FOOTER_DESTINATION
      },
      { label: 'Licenças', href: PENDING_FOOTER_DESTINATION }
    ]
  }
];

export function LandingFooter() {
  return (
    <footer className="landing-footer" role="contentinfo" aria-labelledby="landing-footer-title">
      <div className="landing-footer__inner">
        <div className="landing-footer__main">
          <div className="landing-footer__cta">
            <h2 id="landing-footer-title" className="landing-footer__title">
              A sua próxima conversa pode começar aqui.
            </h2>
            <p className="landing-footer__description">
              Um lugar para conversar, criar e ficar perto.
            </p>
            <div className="landing-footer__actions">
              <ButtonLink to="/register" className="landing-footer__button" wave>
                Criar conta
              </ButtonLink>
              <ButtonLink to="/login" variant="secondary" className="landing-footer__button" wave>
                Entrar
              </ButtonLink>
            </div>
          </div>

          <nav
            id="footer-navigation"
            className="landing-footer__navigation"
            aria-label="Navegação do rodapé"
          >
            {footerNavigation.map((group) => (
              <div className="landing-footer__group" key={group.label}>
                <h3 className="landing-footer__group-title">{group.label}</h3>
                <ul className="landing-footer__links">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        className="landing-footer__link"
                        href={link.href}
                        {...(link.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="landing-footer__closing">
          <div className="landing-footer__meta">
            <span>© 2026 Mesmice</span>
            <span>feito para estar perto.</span>
            <span className="landing-footer__meta-spacer" aria-hidden="true" />
          </div>
        </div>
      </div>
    </footer>
  );
}
