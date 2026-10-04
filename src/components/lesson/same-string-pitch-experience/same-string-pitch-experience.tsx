import { Button } from '@/components/base/buttons/button';
import { SameStringDiagram } from '@/components/lesson/same-string-diagram/same-string-diagram';
import { useSameStringPitchExperience } from '@/components/lesson/same-string-pitch-experience/hooks/use-same-string-pitch-experience';
import type { SameStringPitchExperienceProps } from '@/components/lesson/same-string-pitch-experience/types';

// Two states of the same first string, experienced on a real guitar or on a
// virtual card with a text result. Both paths carry the same weight.
export function SameStringPitchExperience({ content, preferredPath, audio, onReady }: SameStringPitchExperienceProps) {
  const { openPlucked, pressedPlucked, pluckOpen, pluckPressed } = useSameStringPitchExperience({ audio, onReady });
  const guitarCard = <section key="guitar" aria-labelledby="same-string-guitar" className="rounded-lg border border-secondary bg-primary p-5">
    <h3 id="same-string-guitar" className="font-semibold text-primary">{content.guitar.title}</h3>
    <ol className="mt-3 list-decimal space-y-2 pl-5 text-secondary">
      {content.guitar.steps.map((step) => <li key={step}>{step}</li>)}
    </ol>
    <p className="mt-3 text-sm text-tertiary">{content.guitar.safety}</p>
    <p className="mt-1 text-sm text-tertiary">{content.guitar.buzz}</p>
    <Button color="secondary" size="lg" className="mt-4" onClick={onReady}>{content.guitar.doneLabel}</Button>
  </section>;

  const virtualCard = <section key="virtual" aria-labelledby="same-string-virtual" className="rounded-lg border border-secondary bg-primary p-5">
    <h3 id="same-string-virtual" className="font-semibold text-primary">{content.virtual.title}</h3>
    <div className="mt-4 flex flex-wrap gap-2">
      <Button size="lg" onClick={pluckOpen}>{content.virtual.openLabel}</Button>
      <Button size="lg" isDisabled={!openPlucked} onClick={pluckPressed}>{content.virtual.pressedLabel}</Button>
    </div>
    <div className="mt-3 space-y-1 text-sm text-secondary" aria-live="polite">
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
