type AboutScrollCardProps = {
  description: string;
  image: string;
  index: number;
  label: string;
  title: string;
};

export function AboutScrollCard({
  description,
  image,
  index,
  label,
  title
}: AboutScrollCardProps) {
  return (
    <article
      className="about-scroll-card absolute inset-x-0 top-[54%] mx-auto flex h-[min(70svh,680px)] w-[min(calc(100vw_-_2.5rem),430px)] flex-col gap-5 overflow-hidden rounded-[2rem] bg-[var(--color-landing-card)] p-5 text-left text-[var(--color-brand-ink)] shadow-[0_24px_70px_rgb(43_24_97_/_0.12)] sm:h-[min(72svh,700px)] sm:w-[min(calc(100vw_-_4rem),460px)] sm:gap-6 sm:rounded-[2.25rem] sm:p-6 lg:h-[min(72svh,720px)] lg:w-[min(36vw,480px)] lg:p-7"
      data-about-card
      data-card-index={index}
    >
      <div className="about-card-visual relative min-h-0 flex-1 overflow-hidden rounded-3xl bg-(--color-landing-card-visual)">
        <img className="h-full w-full object-cover" src={image} alt="" />
      </div>
      <div className="shrink-0 px-1 pb-1 sm:px-2 sm:pb-2">
        <p className="mb-2.5 text-[0.7rem] font-bold tracking-[0.12em] text-[var(--color-brand-purple)] sm:text-xs">
          {String(index + 1).padStart(2, '0')} — {label}
        </p>
        <h3 className="text-[clamp(1.65rem,5.6vw,2.3rem)] leading-[1.08] font-bold tracking-[-0.035em]">
          {title}
        </h3>
        <p className="mt-3 text-[0.875rem] leading-relaxed font-medium text-[var(--color-landing-copy)] sm:text-[0.95rem]">
          {description}
        </p>
      </div>
    </article>
  );
}
