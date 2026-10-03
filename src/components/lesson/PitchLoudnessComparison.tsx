import { useState } from 'react';
import { ChoiceQuestion } from '@/components/lesson/ChoiceQuestion';
import { RepeatDensityTrack } from '@/components/lesson/FrequencyPitchLab';
import type { LessonTwoAudio } from '@/components/lesson/useLessonTwoAudio';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { loudnessGain } from '@/data/lessons/stage-01-lesson-02-model/constants';

type LoudnessContent = typeof lessonTwoContent.loudness;

interface PitchLoudnessComparisonProps {
  content: LoudnessContent;
  audio: LessonTwoAudio;
  onComplete: () => void;
}

// Screen 4: the same 330 Hz tone quieter and louder; only loudness changes.
export function PitchLoudnessComparison({ content, audio, onComplete }: PitchLoudnessComparisonProps) {
  const [answered, setAnswered] = useState(false);
  const examples = [
    { id: 'quiet', label: content.quietLabel, listen: content.listenQuiet, gain: loudnessGain.quiet },
    { id: 'loud', label: content.loudLabel, listen: content.listenLoud, gain: loudnessGain.loud },
  ] as const;

  return <div className="space-y-5">
    <p className="rounded-lg border border-brand-200 bg-brand-25 p-4 text-sm text-gray-700">{content.comfort}</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {examples.map((example) => <section key={example.id} aria-labelledby={`loudness-${example.id}`} className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 id={`loudness-${example.id}`} className="font-semibold text-gray-950">{example.label}</h3>
        <p className="mt-1 text-sm text-gray-600">{content.frequencyLabel}</p>
        <div className="mt-2"><RepeatDensityTrack frequency={330} /></div>
        {audio.enabled && <button type="button" onClick={() => audio.playTone(330, example.gain)} className="mt-3 min-h-11 rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-semibold text-brand-700 outline-none hover:bg-brand-25 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{example.listen}</button>}
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
    <div aria-live="polite" className="text-sm text-gray-700">
      {answered && <p><strong className="font-semibold text-gray-950">{content.explanation}</strong></p>}
    </div>
  </div>;
}
