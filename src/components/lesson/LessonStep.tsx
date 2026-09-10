import { useEffect, useId, useRef } from 'react';

interface LessonStepProps { title: string; intro?: string; shouldFocus?: boolean; children: React.ReactNode; }

export function LessonStep({ title, intro, shouldFocus = false, children }: LessonStepProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  useEffect(() => { if (shouldFocus) headingRef.current?.focus(); }, [shouldFocus]);
  return <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8" aria-labelledby={titleId}>
    <h2 ref={headingRef} id={titleId} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-gray-950 outline-none focus-visible:ring-2 focus-visible:ring-brand-600">{title}</h2>
    {intro && <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">{intro}</p>}
    <div className="mt-6">{children}</div>
  </section>;
}
