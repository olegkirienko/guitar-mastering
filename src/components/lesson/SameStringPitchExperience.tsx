import { useState } from 'react';
import { SameStringDiagram } from '@/components/lesson/SameStringDiagram';
import type { LessonTwoAudio } from '@/components/lesson/useLessonTwoAudio';
import { stringPluckFrequency } from '@/data/lessons/stage-01-lesson-02-model';
import { sameStringExperience } from '@/data/lessons/stage-01-lesson-02';

type StringContent = typeof sameStringExperience;
export type PitchPath = 'guitar' | 'virtual';

interface SameStringPitchExperienceProps {
  content: StringContent;
  preferredPath: PitchPath;
  audio?: LessonTwoAudio;
  onReady: () => void;
}

// Two states of the same first string, experienced on a real guitar or on a
// virtual card with a text result. Both paths carry the same weight.
export function SameStringPitchExperience({ content, preferredPath, audio, onReady }: SameStringPitchExperienceProps) {
  const [openPlucked, setOpenPlucked] = useState(false);
  const [pressedPlucked, setPressedPlucked] = useState(false);

  // With audio on, the same buttons also play short, non-overlapping plucks.
  const pluckOpen = () => {
    setOpenPlucked(true);
    if (audio?.enabled) audio.playPluck(stringPluckFrequency.open);
  };
  const pluckPressed = () => {
    setPressedPlucked(true);
    if (audio?.enabled) audio.playPluck(stringPluckFrequency.pressed);
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

  return <div className="space-y-4">
    <SameStringDiagram caption={content.diagramCaption} openLabel={content.states.open} pressedLabel={content.states.pressed} />
    <div className="grid gap-4 sm:grid-cols-2">
      {preferredPath === 'guitar' ? [guitarCard, virtualCard] : [virtualCard, guitarCard]}
    </div>
  </div>;
}
