import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { useCountLab } from '@/components/lesson/count-lab/hooks/use-count-lab';
import type { CountLabProps } from '@/components/lesson/count-lab/types';
import { countSemitones } from '@/components/lesson/count-lab/utils/grading';
import { OffsetKeyRow } from '@/components/lesson/offset-key-row/offset-key-row';
import { offsetFrequency } from '@/components/lesson/offset-key-row/utils/offset';
import { countTasks } from '@/data/lessons/stage-02-lesson-05/constants';
import { keyOfSpelledName, spokenName } from '@/data/lessons/stage-02-lesson-04-model/utils/names';

export function CountLab({ content, keys, audio, gain, onSolved }: CountLabProps) {
  const { values, setValue, verdicts, shown, check, show } = useCountLab({ onSolved });
  const message = (id: string, verdict: string | undefined, trap?: string) => {
    if (shown.includes(id)) {
      const task = countTasks.find((candidate) => candidate.id === id) ?? countTasks[0];
      const semitones = countSemitones(task);
      return [content.shown(semitones, semitones / 2), trap].filter(Boolean).join(' ');
    }
    if (verdict === 'right') return [content.right, trap].filter(Boolean).join(' ');
    if (verdict === 'wrong') return content.wrong;
    return verdict === 'empty' ? content.empty : null;
  };
  return <div className="space-y-6">
    <p className="text-secondary">{content.keyRowCaption}</p>
    <ul className="space-y-4">
      {countTasks.map((task) => {
        const start = keyOfSpelledName(task.from) ?? 0;
        const distance = countSemitones(task);
        const fields = values[task.id] ?? { semitones: '', tones: '' };
        const revealTrap = verdicts[task.id] === 'right' || shown.includes(task.id) ? task.trap : undefined;
        return <li key={task.id} className="space-y-3 rounded-lg border border-secondary bg-primary p-4">
          <p className="font-medium text-primary">
            <span className="sr-only">{content.taskLabel({ ...task, from: spokenName(task.from), to: spokenName(task.to) })}</span>
            <span aria-hidden="true">{content.taskLabel(task)}</span>
          </p>
          <OffsetKeyRow
            label={keys.keyRowLabel}
            start={start}
            colors={keys.colors}
            keyLabel={keys.keyLabel}
            onPlay={(key) => audio.playTone(offsetFrequency(start, key), gain)}
            highlighted={[0, distance]}
            captions={{ 0: task.from, [distance]: task.to }}
          />
          <div className="flex flex-wrap items-end gap-3">
            <Input label={content.semitonesLabel} inputMode="numeric" value={fields.semitones} onChange={(value) => setValue(task.id, 'semitones', value)} />
            <Input label={content.tonesLabel} inputMode="decimal" value={fields.tones} onChange={(value) => setValue(task.id, 'tones', value)} />
            <Button size="lg" onClick={() => check(task.id)}>{content.checkLabel}</Button>
            <Button size="lg" color="tertiary" onClick={() => show(task.id)}>{content.showLabel}</Button>
          </div>
          <p role="status" className="text-sm text-secondary">{message(task.id, verdicts[task.id], revealTrap)}</p>
        </li>;
      })}
    </ul>
    {!audio.enabled && <p className="text-secondary">{content.withoutAudio}</p>}
  </div>;
}
