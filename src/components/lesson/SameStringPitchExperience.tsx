import { useState } from 'react';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02';

type StringContent = typeof lessonTwoContent.string;
export type PitchPath = 'guitar' | 'virtual';

interface SameStringPitchExperienceProps {
  content: StringContent;
  preferredPath: PitchPath;
  onReady: () => void;
}

// Two states of the same first string, experienced on a real guitar or on a
// virtual card with a text result. Both paths carry the same weight.
export function SameStringPitchExperience({ content, preferredPath, onReady }: SameStringPitchExperienceProps) {
  const [openPlucked, setOpenPlucked] = useState(false);
  const [pressedPlucked, setPressedPlucked] = useState(false);

  const pluckOpen = () => setOpenPlucked(true);
  const pluckPressed = () => {
    setPressedPlucked(true);
    onReady();
  };

  const guitarCard = <section key="guitar" aria-labelledby="same-string-guitar" className="rounded-lg border border-gray-200 bg-white p-5">
    <h3 id="same-string-guitar" className="font-semibold text-gray-950">{content.guitar.title}</h3>
    <ol className="mt-3 list-decimal space-y-2 pl-5 text-gray-700">
      {content.guitar.steps.map((step) => <li key={step}>{step}</li>)}
    </ol>
    <p className="mt-3 text-sm text-gray-600">{content.guitar.safety}</p>
    <p className="mt-1 text-sm text-gray-600">{content.guitar.buzz}</p>
    <button type="button" onClick={onReady} className="mt-4 min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
      {content.guitar.doneLabel}
    </button>
  </section>;

  const virtualCard = <section key="virtual" aria-labelledby="same-string-virtual" className="rounded-lg border border-gray-200 bg-white p-5">
    <h3 id="same-string-virtual" className="font-semibold text-gray-950">{content.virtual.title}</h3>
    <dl className="mt-3 space-y-1 text-sm text-gray-600">
      <div><dt className="inline font-medium text-gray-950">1. </dt><dd className="inline">{content.states.open}</dd></div>
      <div><dt className="inline font-medium text-gray-950">2. </dt><dd className="inline">{content.states.pressed}</dd></div>
    </dl>
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="button" onClick={pluckOpen} className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
        {content.virtual.openLabel}
      </button>
      <button type="button" disabled={!openPlucked} onClick={pluckPressed} className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
        {content.virtual.pressedLabel}
      </button>
    </div>
    <div className="mt-3 space-y-1 text-sm text-gray-700" aria-live="polite">
      {openPlucked && <p>{content.virtual.openResult}</p>}
      {pressedPlucked && <p>{content.virtual.pressedResult}</p>}
    </div>
  </section>;

  return <div className="grid gap-4 sm:grid-cols-2">
    {preferredPath === 'guitar' ? [guitarCard, virtualCard] : [virtualCard, guitarCard]}
  </div>;
}
