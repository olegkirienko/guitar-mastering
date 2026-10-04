import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { RepeatDensityTrack } from '@/components/lesson/repeat-density-track/repeat-density-track';
import { FactorRegulator } from '@/components/lesson/string-factor-experiment/components/factor-regulator/factor-regulator';
import { StringSchematic } from '@/components/lesson/string-schematic/string-schematic';
import { factorOrder } from '@/components/lesson/string-factor-experiment/constants';
import { useStringFactorExperiment } from '@/components/lesson/string-factor-experiment/hooks/use-string-factor-experiment';
import type { StringFactorExperimentProps } from '@/components/lesson/string-factor-experiment/types';
import { levelLabels } from '@/data/lessons/stage-01-lesson-03-model/constants';
import { factorLevelIndex } from '@/data/lessons/stage-01-lesson-03-model/utils/frequency';
import { pluckGain } from '@/data/lessons/stage-01-lesson-03-model/utils/gain';

// One factor changes, the other two stay visible and locked: prediction → experiment → observations → name.
export function StringFactorExperiment({ factor, prediction, content, audio, completed, onComplete }: StringFactorExperimentProps) {
  const { settings, frequency, levelIndex, announcement, observations, predict, chooseLevel, showExperiment, showNaming, needsMoreLevels } = useStringFactorExperiment({ factor, content, completed, onComplete });
  return <div className="space-y-6">
    <ChoiceQuestion question={prediction.question} choices={prediction.choices} correctChoiceId={prediction.correctChoiceId} mode="prediction" onCheck={predict} />
    {showExperiment && <section aria-labelledby={`${factor}-experiment-title`} className="space-y-5 rounded-lg border border-secondary bg-primary p-5">
      <div>
        <h3 id={`${factor}-experiment-title`} className="font-semibold text-primary">{content.title}</h3>
        <p className="mt-1 text-sm text-tertiary">{content.note}</p>
      </div>
      <div className="space-y-4">
        {factorOrder.map((regulator) => <FactorRegulator
          key={regulator}
          label={content.factorLabels[regulator]}
          levels={levelLabels[regulator]}
          value={regulator === factor ? levelIndex : factorLevelIndex(settings, regulator)}
          lockedNote={regulator === factor ? undefined : content.lockedNote}
          onChange={chooseLevel}
        />)}
      </div>
      <div className="space-y-3">
        <StringSchematic settings={settings} />
        <p className="text-lg font-semibold text-primary">{content.frequencyLabel}: {frequency} Гц</p>
        <RepeatDensityTrack frequency={frequency} />
        <p className="text-sm text-tertiary">{content.trackNote}</p>
        <p role="status" className="text-sm font-medium text-secondary">{announcement}</p>
        {audio.enabled && <Button color="secondary" size="lg" onClick={() => audio.playPluck(frequency, pluckGain(frequency))}>{content.pluckLabel}</Button>}
      </div>
      <table className="w-full text-left text-sm">
        <caption className="mb-2 text-left font-semibold text-primary">{content.tableCaption}</caption>
        <thead>
          <tr className="border-b border-secondary text-tertiary">
            <th scope="col" className="py-2 pr-3 font-medium">{content.levelHeader}</th>
            <th scope="col" className="py-2 font-medium">{content.frequencyHeader}</th>
          </tr>
        </thead>
        <tbody>
          {observations.map((row) => <tr key={row.index} className="border-b border-secondary text-secondary">
            <th scope="row" className="py-2 pr-3 font-normal">{levelLabels[factor][row.index]}</th>
            <td className="py-2">{row.frequency === null ? content.notTried : `${row.frequency} Гц`}</td>
          </tr>)}
        </tbody>
      </table>
      {needsMoreLevels && <p className="text-sm text-tertiary">{content.tryMore}</p>}
    </section>}
    {showNaming && <section aria-label={content.naming.term} className="space-y-3 rounded-lg border border-brand-200 bg-brand-25 p-5 text-secondary">
      <p>{content.naming.before}<strong className="text-primary">{content.naming.term}</strong>{content.naming.after}</p>
      <p className="font-semibold text-primary">{content.naming.rule}</p>
      <p>{content.application}</p>
    </section>}
  </div>;
}
