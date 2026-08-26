import { ArrowUpRight, Check, Compass, MessageCircle, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MesmiceScene } from './components/mesmice-scene.js';
import './home-page.css';

const navLinks = [
  { label: 'O produto', href: '#produto' },
  { label: 'Comunidades', href: '#comunidades' },
  { label: 'Manifesto', href: '#manifesto' }
];

const benefits = [
  {
    number: '01',
    icon: Compass,
    title: 'Encontra os teus',
    description: 'Descobre conversas que têm a tua cara, sem precisar performar uma versão de ti.'
  },
  {
    number: '02',
    icon: MessageCircle,
    title: 'Fala do que importa',
    description: 'Salas leves, profundas ou completamente aleatórias. A pauta é estar presente.'
  },
  {
    number: '03',
    icon: UsersRound,
    title: 'Fica por aí',
    description: 'Constrói vínculos no teu ritmo e deixa a comunidade virar parte do teu dia.'
  }
];

export function HomePage() {
  return (
    <div className="new-landing">
      <div className="new-landing__noise" aria-hidden="true" />
      <header className="new-landing__header">
        <Link to="/" className="new-landing__brand" aria-label="Mesmice, página inicial">
          <span className="new-landing__brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>mesmice</span>
        </Link>

        <nav className="new-landing__nav" aria-label="Navegação principal">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="new-landing__header-actions">
          <Link to="/login" className="new-landing__login-link">
            Entrar
          </Link>
          <Link to="/register" className="new-landing__small-cta">
            Criar conta <ArrowUpRight size={15} strokeWidth={2.5} />
          </Link>
        </div>
      </header>

      <main>
        <section className="new-landing__hero" aria-labelledby="hero-title">
          <div className="new-landing__hero-copy">
            <div className="new-landing__eyebrow">
              <span className="new-landing__eyebrow-dot" />
              uma rede para estar junto
            </div>
            <h1 id="hero-title">
              A internet fica melhor
              <span>quando tem gente.</span>
            </h1>
            <p className="new-landing__hero-description">
              Conversas, comunidades e encontros para quem quer menos barulho e mais presença.
              Encontra os teus. Fica por aí.
            </p>
            <div className="new-landing__hero-actions">
              <Link to="/register" className="new-landing__primary-cta">
                Entrar na comunidade <ArrowUpRight size={18} strokeWidth={2.5} />
              </Link>
              <a href="#produto" className="new-landing__text-cta">
                Descobrir como funciona <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="new-landing__proof">
              <div className="new-landing__avatar-stack" aria-hidden="true">
                <span className="avatar avatar--one">L</span>
                <span className="avatar avatar--two">M</span>
                <span className="avatar avatar--three">A</span>
                <span className="avatar avatar--four">+</span>
              </div>
              <p>
                <strong>feito para pessoas reais</strong>
                <span>e conversas que continuam depois do olá</span>
              </p>
            </div>
          </div>

          <div className="new-landing__hero-scene">
            <div className="new-landing__scene-kicker">conexões em órbita</div>
            <MesmiceScene />
            <div className="new-landing__scene-card new-landing__scene-card--top">
              <span>agora</span>
              <strong>1.284 pessoas online</strong>
            </div>
            <div className="new-landing__scene-card new-landing__scene-card--bottom">
              <span className="new-landing__scene-card-icon">
                <MessageCircle size={14} />
              </span>
              <span>conversa boa acontecendo</span>
            </div>
          </div>
        </section>

        <section className="new-landing__manifesto" id="manifesto" aria-label="Manifesto">
          <div className="new-landing__manifesto-label">/ manifesto</div>
          <p>
            Não é sobre estar em todo lugar.
            <span>É sobre encontrar um lugar para ficar.</span>
          </p>
          <div className="new-landing__manifesto-line" aria-hidden="true" />
        </section>

        <section className="new-landing__product" id="produto" aria-labelledby="product-title">
          <div className="new-landing__section-intro">
            <div className="new-landing__eyebrow">
              <span className="new-landing__eyebrow-dot" />
              do teu jeito
            </div>
            <h2 id="product-title">
              Um canto da internet
              <span>que parece teu.</span>
            </h2>
            <p>
              A Mesmice junta a simplicidade de uma conversa com a energia de uma comunidade viva.
            </p>
          </div>

          <div className="new-landing__benefits">
            {benefits.map(({ number, icon: Icon, title, description }) => (
              <article className="benefit-card" key={number}>
                <div className="benefit-card__topline">
                  <span>{number}</span>
                  <Icon size={22} strokeWidth={1.7} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="benefit-card__arrow" aria-hidden="true">
                  <ArrowUpRight size={18} />
                </span>
              </article>
            ))}
          </div>
        </section>

        <section
          className="new-landing__community"
          id="comunidades"
          aria-labelledby="community-title"
        >
          <div className="new-landing__community-copy">
            <div className="new-landing__eyebrow new-landing__eyebrow--light">
              <span className="new-landing__eyebrow-dot" />a comunidade é tua
            </div>
            <h2 id="community-title">
              Chega como és.
              <span>Fica porque fez sentido.</span>
            </h2>
            <p>
              Sem feed infinito, sem disputa por atenção. Só espaços feitos para trocar, criar e
              encontrar pessoas com interesses que cruzam os teus.
            </p>
            <ul>
              <li>
                <Check size={16} /> perfis que não precisam gritar
              </li>
              <li>
                <Check size={16} /> comunidades para cada versão tua
              </li>
              <li>
                <Check size={16} /> controle sobre o teu tempo e espaço
              </li>
            </ul>
            <Link to="/register" className="new-landing__community-cta">
              Criar meu espaço <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="new-landing__community-art" aria-hidden="true">
            <span className="community-orbit community-orbit--one" />
            <span className="community-orbit community-orbit--two" />
            <span className="community-orbit community-orbit--three" />
            <div className="community-quote">
              <span>“</span>
              <p>às vezes a gente só precisava de um lugar assim.</p>
              <small>— alguém da comunidade</small>
            </div>
          </div>
        </section>
      </main>

      <footer className="new-landing__footer">
        <Link to="/" className="new-landing__brand" aria-label="Mesmice, página inicial">
          <span className="new-landing__brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>mesmice</span>
        </Link>
        <span>mais do mesmo. ainda bem.</span>
        <span>© 2026 mesmice</span>
      </footer>
    </div>
  );
}
