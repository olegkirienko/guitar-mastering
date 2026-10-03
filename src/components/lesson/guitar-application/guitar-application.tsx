import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { helpButton } from '@/components/lesson/guitar-application/constants';
import { useGuitarApplication } from '@/components/lesson/guitar-application/hooks/use-guitar-application';
import type { GuitarApplicationProps } from '@/components/lesson/guitar-application/types';
import { SameStringPitchExperience } from '@/components/lesson/same-string-pitch-experience/same-string-pitch-experience';

// Screen 5: apply the discovery to the same string, on either path.
export function GuitarApplication({ content, preferredPath, audio, completed, onComplete }: GuitarApplicationProps) {
  const { predicted, setPredicted, experienced, setExperienced, help, concluded, setConcluded, showHelp } = useGuitarApplication({ completed });
  return <div className="space-y-6">
    <ChoiceQuestion
      question={content.predictionQuestion}
      choices={content.predictionChoices}
      correctChoiceId="pressed"
      mode="prediction"
      onCheck={() => setPredicted(true)}
    />
    {predicted && <>
      <SameStringPitchExperience content={content} preferredPath={preferredPath} audio={audio} onReady={() => setExperienced(true)} />
      <section aria-labelledby="guitar-help-title" className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 id="guitar-help-title" className="text-sm font-semibold text-gray-950">{content.helpTitle}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => showHelp('no-difference')} className={helpButton}>{content.noDifferenceLabel}</button>
          <button type="button" onClick={() => showHelp('buzz')} className={helpButton}>{content.buzzLabel}</button>
        </div>
        <div aria-live="polite" className="mt-3 space-y-1 text-sm text-gray-700">
          {help === 'buzz' && <p>{content.buzzHelp}</p>}
          {help !== 'none' && <p>{content.textResult}</p>}
        </div>
      </section>
    </>}
    {predicted && <section aria-labelledby="guitar-conclusion-title" className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 id="guitar-conclusion-title" className="font-semibold text-gray-950">{content.conclusionTitle}</h3>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="font-medium text-gray-950">{content.frequencySlot}:</dt>
        <dd className={concluded ? 'text-gray-950' : 'text-gray-500'}>{concluded ? content.frequencyConclusion : content.emptySlot}</dd>
        <dt className="font-medium text-gray-950">{content.pitchSlot}:</dt>
        <dd className={concluded ? 'text-gray-950' : 'text-gray-500'}>{concluded ? content.pitchConclusion : content.emptySlot}</dd>
      </dl>
    </section>}
    {experienced && <ChoiceQuestion
      question={content.question}
      choices={content.choices}
      correctChoiceId={content.correctChoiceId}
      onCheck={(_choiceId, isCorrect) => {
        if (!isCorrect) return;
        setConcluded(true);
        onComplete();
      }}
    />}
  </div>;
}
