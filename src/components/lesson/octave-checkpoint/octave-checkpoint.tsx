import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { useOctaveCheckpoint } from '@/components/lesson/octave-checkpoint/hooks/use-octave-checkpoint';
import type { OctaveCheckpointProps } from '@/components/lesson/octave-checkpoint/types';

export function OctaveCheckpoint({ content, audio, gain, passed, onPass }: OctaveCheckpointProps) {
  const { listenPair, selected, pairsChecked, pairsRight, answerFind, togglePair, checkPairs } = useOctaveCheckpoint({ content, audio, gain, onPass });
  const { pairs } = content;
  return <div className="space-y-8">
    <div className="space-y-6">
      {content.find.map((task) => <ChoiceQuestion key={task.id} question={task.question} choices={task.choices} correctChoiceId={task.correctChoiceId} onCheck={(choiceId) => answerFind(task.id, choiceId)} />)}
    </div>
    <fieldset className="space-y-4">
      <legend className="text-lg font-semibold text-primary">{pairs.title}</legend>
      <p className="text-sm text-tertiary">{pairs.instruction}</p>
      <ul className="space-y-2">
        {pairs.items.map((pair) => <li key={pair.id} className="flex flex-wrap items-center gap-3">
          <Checkbox size="md" className="min-h-11 rounded-lg border border-secondary p-3" label={`${pair.low} і ${pair.high} Гц`} isSelected={selected.includes(pair.id)} onChange={(isSelected) => togglePair(pair.id, isSelected)} />
          {audio.enabled && <Button color="secondary" size="md" onClick={() => listenPair(pair.low, pair.high)}>{pairs.listenLabel(pair.low, pair.high)}</Button>}
        </li>)}
      </ul>
      <Button size="lg" isDisabled={selected.length === 0} onClick={checkPairs}>{pairs.checkLabel}</Button>
      {pairsChecked && <div role="status" className="space-y-2 rounded-lg bg-secondary p-4 text-sm leading-6 text-secondary">
        <p className="font-medium text-primary">{pairsRight ? pairs.allRight : pairs.tryAgain}</p>
        <ul className="list-disc pl-5">{pairs.items.map((pair) => <li key={pair.id}>{pair.feedback}</li>)}</ul>
      </div>}
    </fieldset>
    {passed && <p role="status" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-4 font-medium text-primary">{content.solved}</p>}
  </div>;
}
