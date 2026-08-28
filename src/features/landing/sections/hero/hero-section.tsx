import { useEffect, useRef } from 'react';

import { ButtonLink } from '../../../../components/ui/button.js';

const mascotUrl = '/images/landing-page/hero/mesmice-hero-mascote.png';

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const supportsPointerGlow = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
    );

    if (!hero || !supportsPointerGlow.matches) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();

      hero.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
      hero.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
      hero.style.setProperty('--pointer-glow-opacity', '1');
    };

    const handlePointerLeave = () => {
      hero.style.setProperty('--pointer-glow-opacity', '0');
    };

    hero.addEventListener('pointermove', handlePointerMove);
    hero.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      hero.removeEventListener('pointermove', handlePointerMove);
      hero.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return (
    <section ref={heroRef} className="hero" aria-labelledby="hero-title">
      <div className="hero__inner">
        <div className="hero__content">
          <p className="hero__eyebrow">mais do mesmo. ainda bem.</p>
          <h1 id="hero-title" className="hero__title">
            <span className="hero__title-line">Encontre os teus.</span>
            <span className="hero__title-line hero__title-line--accent">Fique por aqui.</span>
          </h1>
          <p className="hero__description">
            Conversas, comunidades e pessoas num lugar feito para <strong>estar junto.</strong>
          </p>
          <div className="hero__actions">
            <ButtonLink to="/register" className="hero__button" wave>
              Criar conta
            </ButtonLink>
            <ButtonLink to="/login" variant="secondary" className="hero__button" wave>
              Entrar
            </ButtonLink>
          </div>
        </div>
        <div className="hero__visual" aria-hidden="true">
          <img className="hero__mascot" src={mascotUrl} alt="" />
        </div>
      </div>
    </section>
  );
}
