import type { SectionHeadingProps } from '@/components/section-heading/types';

export function SectionHeading({ id, eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-brand-secondary">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-primary sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-lg leading-8 text-tertiary">{description}</p>}
    </div>
  );
}
