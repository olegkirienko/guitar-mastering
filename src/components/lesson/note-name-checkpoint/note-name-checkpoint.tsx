import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { KeyRow } from '@/components/lesson/key-row/key-row';
import { useNoteNameCheckpoint } from '@/components/lesson/note-name-checkpoint/hooks/use-note-name-checkpoint';
import type { NoteNameCheckpointProps } from '@/components/lesson/note-name-checkpoint/types';
import { blackKeyPositions, lastKeyNumber } from '@/data/lessons/stage-02-lesson-03-model/constants';

export function NoteNameCheckpoint({ content, keys, passed, onPass }: NoteNameCheckpointProps) {
  const { answer } = useNoteNameCheckpoint({ content, onPass });
  return <div className="space-y-8">
    {content.tasks.map((task) => <div key={task.id} className="space-y-3">
      {task.highlightKey !== undefined && <KeyRow
        label={keys.label}
        count={lastKeyNumber + 1}
        base={keys.base}
        keyLabel={keys.keyLabel}
        onPlay={keys.onPlay}
        highlighted={[task.highlightKey]}
        narrowKeys={blackKeyPositions}
      />}
      <ChoiceQuestion
        question={task.question}
        choices={task.choices}
        correctChoiceId={task.correctChoiceId}
        onCheck={(_choiceId, isCorrect) => answer(task.id, isCorrect)}
      />
    </div>)}
    {passed && <p role="status" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-4 font-medium text-primary">{content.solved}</p>}
  </div>;
}
