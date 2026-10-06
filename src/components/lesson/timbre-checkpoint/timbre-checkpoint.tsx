import { Tabs } from '@/components/application/tabs/tabs';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { useTimbreCheckpoint } from '@/components/lesson/timbre-checkpoint/hooks/use-timbre-checkpoint';
import type { TimbreCheckpointProps } from '@/components/lesson/timbre-checkpoint/types';
import { TimbreLab } from '@/components/lesson/timbre-lab/timbre-lab';
import { checkpointStarts } from '@/data/lessons/stage-01-lesson-04-model/constants';

// Screen `checkpoint`: two whole sounds the learner builds side by side, then three
// causal questions. The pitches stay visible above the tabs, so the half of the task
// that is about keeping them equal never hides behind the other tab.
export function TimbreCheckpoint({ content, lab, words, envelopeWords, audio, passed, onPass }: TimbreCheckpointProps) {
  const { sounds, summary, changeSound, check, checkStatus, answerQuestion, isPassed } = useTimbreCheckpoint({ content, passed, onPass });
  return <div className="space-y-8">
    <section aria-labelledby="timbre-checkpoint-task-title" className="space-y-4">
      <div>
        <h3 id="timbre-checkpoint-task-title" className="font-semibold text-primary">{content.taskTitle}</h3>
        <p className="mt-1 text-sm text-tertiary">{content.taskGoal}</p>
      </div>
      <p role="status" className="rounded-lg bg-secondary p-3 text-sm font-medium text-primary">{summary}</p>
      <Tabs>
        <Tabs.List type="button-border" size="md">
          {content.tabs.map((tab) => <Tabs.Item key={tab.id} id={tab.id} label={tab.label} />)}
        </Tabs.List>
        {content.tabs.map((tab) => <Tabs.Panel key={tab.id} id={tab.id} className="pt-5">
          <TimbreLab
            mode="full"
            content={lab}
            words={words}
            envelopeWords={envelopeWords}
            sound={sounds[tab.id]}
            start={checkpointStarts[tab.id]}
            onChange={(next) => changeSound(tab.id, next)}
            audio={audio}
          />
        </Tabs.Panel>)}
      </Tabs>
      <div className="space-y-3">
        <Button size="lg" onClick={check}>{content.checkLabel}</Button>
        <p role="status" className="text-sm font-medium text-primary">{checkStatus}</p>
      </div>
    </section>

    <section aria-labelledby="timbre-checkpoint-questions-title" className="space-y-6">
      <h3 id="timbre-checkpoint-questions-title" className="font-semibold text-primary">{content.questionsTitle}</h3>
      {content.questions.map((question) => <ChoiceQuestion
        key={question.id}
        question={question.question}
        choices={question.choices}
        correctChoiceId={question.correctChoiceId}
        onCheck={(_choiceId, isCorrect) => answerQuestion(question.id, isCorrect)}
      />)}
    </section>

    <div aria-live="polite" className="text-sm font-semibold text-primary">{isPassed && <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">{content.passed}</p>}</div>
  </div>;
}
