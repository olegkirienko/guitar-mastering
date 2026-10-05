import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { usePitchLoudnessComparison } from '@/components/lesson/pitch-loudness-comparison/hooks/use-pitch-loudness-comparison';
import type { PitchLoudnessComparisonProps } from '@/components/lesson/pitch-loudness-comparison/types';
import { RepeatDensityTrack } from '@/components/lesson/repeat-density-track/repeat-density-track';

// Screen 4: the same 330 Hz tone quieter and louder; only loudness changes.
export function PitchLoudnessComparison({ content, audio, onComplete }: PitchLoudnessComparisonProps) {
  const { answered, setAnswered, examples } = usePitchLoudnessComparison({ content });
  return <div className="space-y-5">
    <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-4 text-sm text-secondary">{content.comfort}</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {examples.map((example) => <section key={example.id} aria-labelledby={`loudness-${example.id}`} className="rounded-lg border border-secondary bg-primary p-4">
        <h3 id={`loudness-${example.id}`} className="font-semibold text-primary">{example.label}</h3>
        <p className="mt-1 text-sm text-tertiary">{content.frequencyLabel}</p>
        <div className="mt-2"><RepeatDensityTrack frequency={330} /></div>
        {audio.enabled && <Button color="secondary" size="lg" className="mt-3" onClick={() => audio.playTone(330, example.gain)}>{example.listen}</Button>}
      </section>)}
    </div>
    <ChoiceQuestion
      question={content.question}
      choices={content.choices}
      correctChoiceId={content.correctChoiceId}
      onCheck={() => {
        if (!answered) onComplete();
        setAnswered(true);
      }}
    />
    <div aria-live="polite" className="text-sm text-secondary">
      {answered && <p><strong className="font-semibold text-primary">{content.explanation}</strong></p>}
    </div>
  </div>;
}
