type Props = {
  description: string;
  index: number;
  label: string;
  title: string;
};

export function WhyMesmiceCard({ description, index, label, title }: Props) {
  return (
    <article className="why-mesmice-card rounded-[1.5rem] border border-[rgb(43_24_97_/_0.1)] bg-[var(--color-brand-white)] px-8 py-9 text-[var(--color-brand-ink)] shadow-[0_10px_30px_rgb(8_6_17_/_0.06)] transition-[transform,box-shadow,border-color] duration-200 sm:px-10 sm:py-10 lg:min-h-[300px] lg:px-[clamp(2.5rem,4vw,4rem)] lg:py-[clamp(2.5rem,5vh,3.5rem)]">
      <p className="mb-6 text-[0.7rem] font-bold tracking-[0.13em] text-[var(--color-brand-purple)] sm:text-xs">
        {String(index + 1).padStart(2, '0')} — {label}
      </p>
      <h3 className="max-w-[650px] text-[clamp(1.75rem,2.6vw,2.75rem)] leading-[1.08] font-bold tracking-[-0.04em]">
        {title}
      </h3>
      <p className="mt-5 max-w-[610px] text-[0.95rem] leading-[1.7] font-medium text-[var(--color-landing-copy)] sm:text-base">
        {description}
      </p>
    </article>
  );
}
