import { WhyMesmiceCard } from './why-mesmice-card.js';
import './why-mesmice-section.css';

type Reason = { description: string; label: string; title: string };

const REASONS: Reason[] = [
  {
    label: 'CONVERSAS',
    title: 'Nem toda conversa precisa virar conteúdo.',
    description:
      'Fale, compartilhe e fique por perto sem transformar cada interação em uma disputa por atenção.'
  },
  {
    label: 'PESSOAS',
    title: 'Pessoas antes dos números.',
    description:
      'Amizades, grupos e comunidades sem seguidores, alcance ou métricas dominando a experiência.'
  },
  {
    label: 'O SEU ESPAÇO',
    title: 'Um canto que parece seu.',
    description:
      'Organize conversas, canais e comunidades do seu jeito, com as pessoas que realmente fazem parte deles.'
  },
  {
    label: 'PRIVACIDADE',
    title: 'Seus dados continuam seus.',
    description:
      'Privacidade e controle fazem parte do Mesmice desde o início — não como algo adicionado depois.'
  }
];

export function WhyMesmiceSection() {
  return (
    <section
      id="por-que-mesmice"
      className="why-mesmice-section relative text-[var(--landing-context-text)]"
      aria-labelledby="why-mesmice-title"
    >
      <div className="mx-auto grid w-[min(calc(100%_-_2rem),var(--landing-content-max))] grid-cols-1 gap-16 py-24 sm:w-[min(calc(100%_-_4rem),var(--landing-content-max))] sm:py-32 lg:grid-cols-[minmax(300px,0.82fr)_minmax(500px,1.18fr)] lg:gap-[clamp(4.5rem,8vw,9rem)] lg:py-0">
        <header className="why-mesmice-intro lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center lg:self-start lg:pt-[6svh]">
          <h2
            id="why-mesmice-title"
            aria-label="Por que escolher o Mesmice?"
            className="mt-6 text-[clamp(2.9rem,4.8vw,5rem)] leading-[0.98] font-bold tracking-[-0.06em]"
          >
            <span>Por que escolher</span>
            <span>
              o <strong>Mesmice?</strong>
            </span>
          </h2>
          <p className="mt-7 max-w-[460px] text-[clamp(0.95rem,1.2vw,1.05rem)] leading-[1.75] font-medium text-[var(--landing-context-copy)]">
            A internet já tem lugares suficientes para aparecer.
            <span>O Mesmice é um lugar para ficar.</span>
          </p>
        </header>
        <div
          className="why-mesmice-story grid content-start gap-8 lg:py-[42svh]"
          aria-label="Razões para escolher o Mesmice"
        >
          {REASONS.map((reason, index) => (
            <WhyMesmiceCard {...reason} index={index} key={reason.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
