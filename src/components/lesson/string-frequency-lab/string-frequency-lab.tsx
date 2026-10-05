import { RefreshCcw01 } from '@untitledui/icons';
import { Badge } from '@/components/base/badges/badges';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { FactorRegulator } from '@/components/lesson/factor-regulator/factor-regulator';
import { RepeatDensityTrack } from '@/components/lesson/repeat-density-track/repeat-density-track';
import { StringSchematic } from '@/components/lesson/string-schematic/string-schematic';
import { useStringFrequencyLab } from '@/components/lesson/string-frequency-lab/hooks/use-string-frequency-lab';
import type { StringFrequencyLabProps } from '@/components/lesson/string-frequency-lab/types';
import { factorOrder, levelLabels } from '@/data/lessons/stage-01-lesson-03-model/constants';
import { factorLevelIndex } from '@/data/lessons/stage-01-lesson-03-model/utils/frequency';
import { pluckGain } from '@/data/lessons/stage-01-lesson-03-model/utils/gain';
import { cx } from '@/utils/cx';

// All three factors at once: guesses about combinations first, then the lab tests them.
export function StringFrequencyLab({ content, predictions, audio, completed, onComplete }: StringFrequencyLabProps) {
  const { settings, frequency, lastChanged, announcement, chooseLevel, reset, answer, isAnswered, isVerified, done } = useStringFrequencyLab({ content, predictions, completed, onComplete });
  return <div className="space-y-6">
    <section aria-labelledby="lab-predictions-title" className="space-y-5">
      <h3 id="lab-predictions-title" className="font-semibold text-primary">{content.predictionsTitle}</h3>
      <ol className="space-y-6">
        {predictions.map((item) => <li key={item.id} className="space-y-3">
          <ChoiceQuestion question={item.question} choices={item.choices} correctChoiceId={item.correctChoiceId} mode="prediction" onCheck={() => answer(item.id)} />
          {isVerified(item.id)
            ? <p className="rounded-lg border border-brand-200 bg-brand-25 p-4 text-sm font-medium text-primary">{item.checked}</p>
            : isAnswered(item.id) && <p className="text-sm text-tertiary">{item.setupHint}</p>}
        </li>)}
      </ol>
    </section>

    <section aria-labelledby="frequency-lab-title" className="space-y-5 rounded-lg border border-secondary bg-primary p-5">
      <div>
        <h3 id="frequency-lab-title" className="font-semibold text-primary">{content.title}</h3>
        <p className="mt-1 text-sm text-tertiary">{content.note}</p>
      </div>
      <div className="space-y-4">
        {factorOrder.map((factor) => <FactorRegulator
          key={factor}
          label={content.factorLabels[factor]}
          levels={levelLabels[factor]}
          value={factorLevelIndex(settings, factor)}
          onChange={(index) => chooseLevel(factor, index)}
        />)}
      </div>
      <div className="space-y-3">
        <StringSchematic settings={settings} />
        <p className="text-lg font-semibold text-primary">{content.frequencyLabel}: {frequency} Гц</p>
        <RepeatDensityTrack frequency={frequency} />
        <p className="text-sm text-tertiary">{content.trackNote}</p>
        <p role="status" className="text-sm font-medium text-secondary">{announcement}</p>
        <div className="flex flex-wrap gap-3">
          {audio.enabled && <Button color="secondary" size="lg" onClick={() => audio.playPluck(frequency, pluckGain(frequency))}>{content.pluckLabel}</Button>}
          <Button color="secondary" size="lg" iconLeading={RefreshCcw01} onClick={reset}>{content.resetLabel}</Button>
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold text-primary">{content.rulesTitle}</h4>
        <ul className="space-y-2">
          {factorOrder.map((factor) => <li
            key={factor}
            className={cx('flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm', factor === lastChanged ? 'border-brand-200 bg-brand-25 font-semibold text-primary' : 'border-secondary text-secondary')}
          >
            <span>{content.rules[factor]}</span>
            {factor === lastChanged && <Badge type="pill-color" color="brand" size="sm">{content.lastChangedLabel}</Badge>}
          </li>)}
        </ul>
      </div>
    </section>

    {done && <p className="rounded-lg border border-brand-200 bg-brand-25 p-5 font-medium text-primary">{content.doneText}</p>}
  </div>;
}
