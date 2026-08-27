import { useEffect, useRef, useState } from 'react';
import './faq-section.css';

type FaqItem = {
  answer: string;
  question: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'O Mesmice é gratuito?',
    answer:
      'O Mesmice está sendo desenvolvido para tornar conversas e comunidades acessíveis sem complicação. Mais detalhes sobre planos e recursos serão divulgados conforme a plataforma se aproxima do lançamento.'
  },
  {
    question: 'O que são Spaces?',
    answer:
      'Spaces são ambientes para reunir pessoas, conversas e canais em torno de comunidades, grupos ou interesses em comum.'
  },
  {
    question: 'Posso usar no computador e no celular?',
    answer:
      'Sim. O Mesmice está sendo pensado para oferecer uma experiência consistente entre Web e aplicativo.'
  },
  {
    question: 'Como funciona a privacidade?',
    answer:
      'Privacidade e segurança fazem parte da arquitetura do Mesmice desde o início. Controles, permissões e proteção dos dados são tratados como parte central da experiência.'
  },
  {
    question: 'Quando o Mesmice estará disponível?',
    answer:
      'O Mesmice ainda está em desenvolvimento. Novidades sobre disponibilidade e lançamento serão divulgadas pelos canais oficiais do projeto.'
  },
  {
    question: 'Posso conversar em privado com outras pessoas?',
    answer:
      'Sim. Conversas privadas fazem parte da experiência planejada do Mesmice, junto com comunidades e outros espaços de comunicação.'
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLSpanElement>(null);
  const releaseRef = useRef<HTMLSpanElement>(null);
  const toggleItem = (index: number) => {
    setOpenIndex((currentIndex) => (currentIndex === index ? null : index));
  };

  useEffect(() => {
    const reveal = revealRef.current;
    const start = startRef.current;
    const release = releaseRef.current;

    if (!reveal || !start || !release || !window.IntersectionObserver) {
      return undefined;
    }

    const updateRevealState = () => {
      const rect = reveal.getBoundingClientRect();
      const releaseRect = release.getBoundingClientRect();
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      reveal.classList.toggle('faq-reveal--active', isDesktop && rect.top < 0 && releaseRect.top > 0);
    };

    const observer = new IntersectionObserver(updateRevealState, { threshold: [0, 1] });
    observer.observe(start);
    observer.observe(release);
    updateRevealState();

    return () => {
      observer.disconnect();
      reveal.classList.remove('faq-reveal--active');
    };
  }, []);

  return (
    <div className="faq-reveal" ref={revealRef}>
      <span className="faq-reveal__sentinel faq-reveal__sentinel--start" ref={startRef} aria-hidden="true" />
      <span className="faq-reveal__sentinel faq-reveal__sentinel--release" ref={releaseRef} aria-hidden="true" />
      <section className="faq-section" aria-labelledby="faq-title">
        <div className="faq-section__inner">
          <header className="faq-section__header">
            <h2 id="faq-title">Perguntas frequentes</h2>
            <p>Algumas respostas rápidas antes de você entrar.</p>
          </header>

          <div className="faq-section__list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openIndex === index;
              const answerId = `faq-answer-${index}`;
              const triggerId = `faq-trigger-${index}`;

              return (
                <article className="faq-item" key={item.question}>
                  <h3 className="faq-item__heading">
                    <button
                      id={triggerId}
                      className="faq-item__trigger"
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => toggleItem(index)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          toggleItem(index);
                        }
                      }}
                    >
                      <span>{item.question}</span>
                      <span className="faq-item__icon" aria-hidden="true" />
                    </button>
                  </h3>
                  <div
                    id={answerId}
                    className="faq-item__panel"
                    role="region"
                    aria-labelledby={triggerId}
                    aria-hidden={!isOpen}
                    data-open={isOpen}
                  >
                    <div className="faq-item__panel-inner">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <img
          className="faq-section__mascot"
          src="/images/landing-page/faq/mascote-duvidas-darkmode.png"
          alt=""
          aria-hidden="true"
        />
      </section>
    </div>
  );
}
