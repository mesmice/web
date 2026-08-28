const MARQUEE_TEXT = 'encontre a sua turma · comece a conversa · fique por aqui ·';

function MarqueeGroup() {
  return (
    <span className="landing-marquee__group">
      {Array.from({ length: 4 }, (_, index) => (
        <span className="landing-marquee__phrase" key={index}>
          {MARQUEE_TEXT}
        </span>
      ))}
    </span>
  );
}

export function LandingMarquee() {
  return (
    <div className="landing-marquee">
      <span className="visually-hidden">
        Encontre a sua turma, comece a conversa, fique por aqui.
      </span>
      <div className="landing-marquee__track" aria-hidden="true">
        <MarqueeGroup />
        <MarqueeGroup />
      </div>
    </div>
  );
}
