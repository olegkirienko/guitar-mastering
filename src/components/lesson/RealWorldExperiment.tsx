import { Lightbulb01, Shield01 } from '@untitledui/icons';
import { useId } from 'react';

interface RealWorldExperimentProps { title: string; withGuitar: string; withoutGuitar: string; safetyNote?: string; }
export function RealWorldExperiment({ title, withGuitar, withoutGuitar, safetyNote }: RealWorldExperimentProps) {
  const titleId = useId();
  return <aside className="rounded-xl bg-brand-25 p-5" aria-labelledby={titleId}><div className="flex gap-3"><Lightbulb01 className="mt-0.5 size-5 shrink-0 text-brand-700" /><div><h3 id={titleId} className="font-semibold text-gray-950">{title}</h3><p className="mt-3 text-sm leading-6 text-gray-700"><strong>Якщо є гітара:</strong> {withGuitar}</p><p className="mt-2 text-sm leading-6 text-gray-700"><strong>Без гітари:</strong> {withoutGuitar}</p>{safetyNote && <p className="mt-3 flex gap-2 text-sm leading-6 text-gray-700"><Shield01 className="mt-0.5 size-4 shrink-0" />{safetyNote}</p>}</div></div></aside>;
}
