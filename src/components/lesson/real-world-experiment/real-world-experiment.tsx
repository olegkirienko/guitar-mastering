import type { RealWorldExperimentProps } from '@/components/lesson/real-world-experiment/types';
import { Lightbulb01, Shield01 } from '@untitledui/icons';
import { useId } from 'react';

export function RealWorldExperiment({ title, withGuitar, withoutGuitar, safetyNote }: RealWorldExperimentProps) {
  const titleId = useId();
  return <aside className="rounded-xl bg-brand-primary_alt p-5" aria-labelledby={titleId}><div className="flex gap-3"><Lightbulb01 className="mt-0.5 size-5 shrink-0 text-brand-secondary" /><div><h3 id={titleId} className="font-semibold text-primary">{title}</h3><p className="mt-3 text-sm leading-6 text-secondary"><strong>Якщо є гітара:</strong> {withGuitar}</p><p className="mt-2 text-sm leading-6 text-secondary"><strong>Без гітари:</strong> {withoutGuitar}</p>{safetyNote && <p className="mt-3 flex gap-2 text-sm leading-6 text-secondary"><Shield01 className="mt-0.5 size-4 shrink-0" />{safetyNote}</p>}</div></div></aside>;
}
