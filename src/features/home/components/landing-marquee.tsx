const MARQUEE_TEXT = 'encontra os teus · começa a conversa · fica por aí ·';

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
      <span className="visually-hidden">Encontra os teus, começa a conversa, fica por aí.</span>
      <div className="landing-marquee__track" aria-hidden="true">
        <MarqueeGroup />
        <MarqueeGroup />
      </div>
    </div>
  );
}
