interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-base leading-7 text-gray-600">{description}</p>}
    </div>
  );
}
