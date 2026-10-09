import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { KeyRow } from '@/components/lesson/key-row/key-row';
import { useAccidentalCheckpoint } from '@/components/lesson/accidental-checkpoint/hooks/use-accidental-checkpoint';
import type { AccidentalCheckpointProps } from '@/components/lesson/accidental-checkpoint/types';
import { SignedName } from '@/components/lesson/signed-name/signed-name';
import { blackKeyPositions, lastKeyNumber } from '@/data/lessons/stage-02-lesson-03-model/constants';

export function AccidentalCheckpoint({ content, keys, passed, onPass }: AccidentalCheckpointProps) {
  const { picked, namesVerdict, pressedKey, pairAnswers, togglePicked, checkNames, pressKey, answerPair, answerNatural } = useAccidentalCheckpoint({ content, keys, onPass });
  const { names, find, pairs, natural } = content;
  const row = (highlighted: readonly number[], onPlay: (key: number) => void) => <KeyRow
    label={keys.label}
    count={lastKeyNumber + 1}
    base={keys.base}
    keyLabel={keys.keyLabel}
    onPlay={onPlay}
    highlighted={highlighted}
    narrowKeys={blackKeyPositions}
  />;
  return <div className="space-y-8">
    <section aria-labelledby="accidental-names" className="space-y-3">
      <h3 id="accidental-names" className="font-semibold text-primary">{names.question}</h3>
      {row([names.highlightKey], keys.onPlay)}
      <div role="group" aria-label={names.question} className="flex flex-wrap gap-3">
        {names.options.map((name) => <Button key={name} color={picked.includes(name) ? 'primary' : 'secondary'} aria-pressed={picked.includes(name)} onClick={() => togglePicked(name)}><SignedName name={name} /></Button>)}
      </div>
      <Button color="secondary" isDisabled={picked.length === 0} onClick={checkNames}>{names.checkLabel}</Button>
      <p role="status" className="text-sm text-secondary">{namesVerdict === null ? null : namesVerdict === 'right' ? names.right : names.wrong}</p>
    </section>

    <section aria-labelledby="accidental-find" className="space-y-3">
      <h3 id="accidental-find" className="font-semibold text-primary">{find.question}</h3>
      {row([], pressKey)}
      <p role="status" className="text-sm text-secondary">{pressedKey === null ? null : pressedKey === find.targetKey ? find.right : find.wrong(pressedKey)}</p>
    </section>

    <section aria-labelledby="accidental-pairs" className="space-y-3">
      <h3 id="accidental-pairs" className="font-semibold text-primary">{pairs.question}</h3>
      <ul className="space-y-3">
        {pairs.items.map((item, index) => {
          const answer = pairAnswers[index];
          return <li key={`${item.first}-${item.second}`} className="space-y-2 rounded-lg border border-secondary bg-primary p-4">
            <div role="group" aria-label={`${item.first} і ${item.second}`} className="flex flex-wrap items-center gap-3">
              <p className="font-medium text-primary"><SignedName name={item.first} /> – <SignedName name={item.second} /></p>
              <Button color={answer === true ? 'primary' : 'secondary'} aria-pressed={answer === true} onClick={() => answerPair(index, true)}>{pairs.sameLabel}</Button>
              <Button color={answer === false ? 'primary' : 'secondary'} aria-pressed={answer === false} onClick={() => answerPair(index, false)}>{pairs.differentLabel}</Button>
            </div>
            <p role="status" className="text-sm text-secondary">{answer === undefined ? null : answer === item.same ? `${pairs.right} ${item.explanation}` : pairs.wrong}</p>
          </li>;
        })}
      </ul>
    </section>

    <ChoiceQuestion question={natural.question} choices={natural.choices} correctChoiceId={natural.correctChoiceId} onCheck={(_choiceId, isCorrect) => answerNatural(isCorrect)} />
    {passed && <p role="status" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-4 font-medium text-primary">{content.solved}</p>}
  </div>;
}
