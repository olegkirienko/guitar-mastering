import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { useStringCheckpoint } from '@/components/lesson/string-checkpoint/hooks/use-string-checkpoint';
import type { StringCheckpointProps } from '@/components/lesson/string-checkpoint/types';

export function StringCheckpoint({ content, passed, onPass }: StringCheckpointProps) {
  const { solved, total, answer } = useStringCheckpoint({ content, onPass });
  return <div className="space-y-8">
    {content.tasks.map((task) => <section key={task.id} aria-labelledby={`string-task-${task.id}`} className="space-y-4">
      <h3 id={`string-task-${task.id}`} className="font-semibold text-primary">{task.title}</h3>
      {task.questions.map((item) => <ChoiceQuestion key={item.id} question={item.question} choices={item.choices} correctChoiceId={item.correctChoiceId} onCheck={answer(item.id)} />)}
    </section>)}
    <p role="status" className="font-medium text-primary">{passed ? content.passed : content.solvedStatus(solved.length, total)}</p>
  </div>;
}
