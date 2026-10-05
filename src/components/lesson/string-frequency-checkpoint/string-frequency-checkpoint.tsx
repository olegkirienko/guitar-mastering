import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { useStringFrequencyCheckpoint } from '@/components/lesson/string-frequency-checkpoint/hooks/use-string-frequency-checkpoint';
import type { StringFrequencyCheckpointProps } from '@/components/lesson/string-frequency-checkpoint/types';
import { StringFrequencyLab } from '@/components/lesson/string-frequency-lab/string-frequency-lab';

// Screen `checkpoint`: two goals with one factor locked, then three guitar cases as causal chains.
export function StringFrequencyCheckpoint({ content, lab, audio, passed, onPass }: StringFrequencyCheckpointProps) {
  const { tasks, solveTask, answerQuestion, isPassed } = useStringFrequencyCheckpoint({ content, passed, onPass });
  return <div className="space-y-8">
    <section aria-labelledby="checkpoint-tasks-title" className="space-y-5">
      <h3 id="checkpoint-tasks-title" className="font-semibold text-primary">{content.tasksTitle}</h3>
      {tasks.map((task) => <StringFrequencyLab key={task.model.id} content={lab} task={task} audio={audio} completed={passed} onComplete={() => solveTask(task.model.id)} />)}
    </section>
    <section aria-labelledby="checkpoint-questions-title" className="space-y-6">
      <h3 id="checkpoint-questions-title" className="font-semibold text-primary">{content.questionsTitle}</h3>
      {content.questions.map((question) => <ChoiceQuestion
        key={question.id}
        question={question.question}
        choices={question.choices}
        correctChoiceId={question.correctChoiceId}
        onCheck={(_choiceId, isCorrect) => answerQuestion(question.id, isCorrect)}
      />)}
    </section>
    <div aria-live="polite" className="text-sm font-semibold text-primary">{isPassed && <p className="rounded-lg border border-brand-200 bg-brand-25 p-5">{content.passed}</p>}</div>
  </div>;
}
