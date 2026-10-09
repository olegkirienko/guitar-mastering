import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { useNoteNameCheckpoint } from '@/components/lesson/note-name-checkpoint/hooks/use-note-name-checkpoint';
import type { NoteNameCheckpointProps } from '@/components/lesson/note-name-checkpoint/types';

export function NoteNameCheckpoint({ content, passed, onPass }: NoteNameCheckpointProps) {
  const { answer } = useNoteNameCheckpoint({ content, onPass });
  return <div className="space-y-8">
    {content.tasks.map((task) => <ChoiceQuestion
      key={task.id}
      question={task.question}
      choices={task.choices}
      correctChoiceId={task.correctChoiceId}
      onCheck={(_choiceId, isCorrect) => answer(task.id, isCorrect)}
    />)}
    {passed && <p role="status" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-4 font-medium text-primary">{content.solved}</p>}
  </div>;
}
