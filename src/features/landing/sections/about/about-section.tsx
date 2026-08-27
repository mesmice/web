import { useEffect, useRef } from 'react';
import { AboutScrollCard } from './about-scroll-card.js';
import './about-section.css';

type AboutCard = {
  description: string;
  image: string;
  label: string;
  title: string;
};

const ABOUT_CARDS: AboutCard[] = [
  {
    label: 'CONVERSAS',
    title: 'Converse do seu jeito.',
    description:
      'Canais, grupos e mensagens privadas para falar do que importa, sem transformar tudo em barulho.',
    image: '/images/landing-page/what-is/conversation-card.png'
  },
  {
    label: 'COMUNIDADES',
    title: 'Um canto para cada assunto.',
    description:
      'Crie espaços, organize canais e reúna pessoas em torno das coisas que fazem sentido para vocês.',
    image: '/images/landing-page/what-is/community-card.png'
  },
  {
    label: 'PRIVACIDADE',
    title: 'Seus dados continuam seus.',
    description:
      'Privacidade e controle fazem parte do Mesmice desde o início, não como algo adicionado depois.',
    image: '/images/landing-page/what-is/privacity-card.png'
  }
];

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!section || reduceMotion.matches) return;

    const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-about-card]'));
    let frame = 0;
    let sectionTop = 0;
    let travel = 1;

    const measure = () => {
      const rect = section.getBoundingClientRect();
      sectionTop = window.scrollY + rect.top;
      travel = Math.max(1, section.offsetHeight - window.innerHeight);
    };

    const render = () => {
      frame = 0;
      const progress = clamp((window.scrollY - sectionTop) / travel);
      const cardTimeline = clamp((progress - 0.14) / 0.74);
      section.style.setProperty('--about-heading-scale', String(1 - cardTimeline * 0.16));

      cards.forEach((card, index) => {
        const entrance = clamp((cardTimeline * ABOUT_CARDS.length - index) / 0.72);
        const nextEntrance =
          index < cards.length - 1
            ? clamp((cardTimeline * ABOUT_CARDS.length - (index + 1)) / 0.72)
            : 0;
        const depth = nextEntrance + Math.max(0, cardTimeline * ABOUT_CARDS.length - index - 1.72);
        const mobile = window.innerWidth < 640;
        const depthOffset = mobile ? 10 : window.innerWidth < 1024 ? 14 : 18;
        const depthScale = mobile ? 0.025 : 0.035;
        const incoming = ((1 - entrance) * 112 * window.innerHeight) / 100;
        card.style.setProperty('--card-y', `${incoming - depth * depthOffset}px`);
        card.style.setProperty('--card-scale', String(Math.max(0.88, 1 - depth * depthScale)));
        card.style.zIndex = String(index + 1);
      });
    };

    const requestRender = () => {
      if (frame === 0) frame = window.requestAnimationFrame(render);
    };

    const handleResize = () => {
      measure();
      requestRender();
    };

    measure();
    render();
    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', requestRender);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="o-que-e"
      className="landing-about relative z-[2] text-[var(--color-brand-deep-purple)]"
      aria-labelledby="about-title"
    >
      <div className="landing-about__sticky sticky top-0 h-[100svh] overflow-hidden">
        <header className="landing-about__header absolute inset-0 z-0 mx-auto flex w-[min(calc(100%_-_2.5rem),1040px)] flex-col items-center justify-center text-center">
          <h2
            id="about-title"
            aria-label="Onde os mesmos se encontram."
            className="max-w-[900px] text-[clamp(3rem,7.2vw,6.5rem)] leading-[0.98] font-bold tracking-[-0.06em]"
          >
            <span className="block">
              Onde{' '}
              <strong className="font-[inherit] text-[var(--color-brand-purple)]">os mesmos</strong>
            </span>
            <span className="block">se encontram.</span>
          </h2>
          <p className="mt-7 max-w-[700px] text-[clamp(0.95rem,1.4vw,1.125rem)] leading-[1.75] font-medium sm:mt-9">
            O Mesmice reúne conversas, amizades e comunidades em um só lugar. Crie espaços, entre em
            canais, converse no privado e fique perto das pessoas com quem vale a pena continuar a
            mesma conversa amanhã.
          </p>
        </header>

        <div
          className="landing-about__stack absolute inset-0 z-[1]"
          aria-label="O que você pode fazer no Mesmice"
        >
          {ABOUT_CARDS.map((card, index) => (
            <AboutScrollCard {...card} index={index} key={card.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
