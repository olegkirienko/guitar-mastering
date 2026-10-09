import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { useOctaveLab } from '@/components/lesson/octave-lab/hooks/use-octave-lab';
import type { OctaveLabProps } from '@/components/lesson/octave-lab/types';
import { octaveAnswer } from '@/components/lesson/octave-lab/utils/grading';
import { ToneSequence } from '@/components/lesson/tone-sequence/tone-sequence';
import { maxFrequency, minFrequency } from '@/data/lessons/stage-02-lesson-01-model/constants';
import { octaveTasks } from '@/data/lessons/stage-02-lesson-05/constants';

export function OctaveLab({ content, audio, gain, onSolved }: OctaveLabProps) {
  const { values, setValue, verdicts, shown, isSolved, check, show } = useOctaveLab({ onSolved });
  const message = (id: string, verdict: string | undefined) => {
    if (shown.includes(id)) return content.shown(octaveAnswer(octaveTasks.find((task) => task.id === id) ?? octaveTasks[0]));
    if (verdict === 'right') return content.right;
    if (verdict === 'range') return content.range(minFrequency, maxFrequency);
    if (verdict === 'wrong') return content.wrong;
    return verdict === 'empty' ? content.empty : null;
  };
  return <div className="space-y-6">
    <ul className="space-y-4">
      {octaveTasks.map((task) => <li key={task.id} className="space-y-3 rounded-lg border border-secondary bg-primary p-4">
        <p className="font-medium text-primary">{content.taskLabel(task)}</p>
        <div className="flex flex-wrap items-end gap-3">
          <Input label={content.inputLabel} inputMode="decimal" value={values[task.id] ?? ''} onChange={(value) => setValue(task.id, value)} />
          <Button size="lg" onClick={() => check(task.id)}>{content.checkLabel}</Button>
          <Button size="lg" color="tertiary" onClick={() => show(task.id)}>{content.showLabel}</Button>
        </div>
        <p role="status" className="text-sm text-secondary">{message(task.id, verdicts[task.id])}</p>
        {isSolved(task.id) && <ToneSequence
          sequences={[{ id: task.id, label: content.listenLabel(task.frequency, octaveAnswer(task)), frequencies: [task.frequency, octaveAnswer(task)] }]}
          stopLabel={content.stopLabel}
          audio={audio}
          gain={gain}
        />}
      </li>)}
    </ul>
    {!audio.enabled && <p className="text-secondary">{content.withoutAudio}</p>}
  </div>;
}
