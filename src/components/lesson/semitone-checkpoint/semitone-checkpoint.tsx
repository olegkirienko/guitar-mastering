import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { useSemitoneCheckpoint } from '@/components/lesson/semitone-checkpoint/hooks/use-semitone-checkpoint';
import type { SemitoneCheckpointProps } from '@/components/lesson/semitone-checkpoint/types';

export function SemitoneCheckpoint({ content, passed, onPass }: SemitoneCheckpointProps) {
  const { values, setValue, verdicts, check } = useSemitoneCheckpoint({ content, onPass });
  const { task1, task2, task3 } = content;
  const message = (verdict: string | undefined, right: string, wrong: string) => verdict === 'right' ? right : verdict === 'range' ? content.rangeError : verdict === 'wrong' ? wrong : null;
  return <div className="space-y-8">
    <section aria-labelledby="seven-task-1" className="space-y-3">
      <p id="seven-task-1" className="font-medium text-primary">{task1.question}</p>
      <div className="flex flex-wrap items-end gap-3">
        <Input label={task1.semitonesLabel} inputMode="numeric" value={values.semitones} onChange={(value) => setValue('semitones', value)} />
        <Input label={task1.tonesLabel} inputMode="decimal" value={values.tones} onChange={(value) => setValue('tones', value)} />
        <Button size="lg" onClick={() => check('distance')}>{content.checkLabel}</Button>
      </div>
      <p role="status" className="text-sm text-secondary">{message(verdicts.distance, task1.right, task1.wrong)}</p>
    </section>
    <section aria-labelledby="seven-task-2" className="space-y-3">
      <p id="seven-task-2" className="font-medium text-primary">{task2.question}</p>
      <div className="flex flex-wrap items-end gap-3">
        <Input label={task2.answerLabel} inputMode="numeric" value={values.after} onChange={(value) => setValue('after', value)} />
        <Button size="lg" onClick={() => check('after')}>{content.checkLabel}</Button>
      </div>
      <p role="status" className="text-sm text-secondary">{message(verdicts.after, task2.right, task2.wrong)}</p>
    </section>
    <section aria-labelledby="seven-task-3" className="space-y-3">
      <p id="seven-task-3" className="font-medium text-primary">{task3.question}</p>
      <div className="flex flex-wrap items-end gap-3">
        <Input label={task3.answerLabel} inputMode="numeric" value={values.return} onChange={(value) => setValue('return', value)} />
        <Button size="lg" onClick={() => check('return')}>{content.checkLabel}</Button>
      </div>
      <p role="status" className="text-sm text-secondary">{message(verdicts.return, task3.right, task3.wrong)}</p>
    </section>
    {passed && <p role="status" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-4 font-medium text-primary">{content.solved}</p>}
  </div>;
}
