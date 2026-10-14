import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { FretBoard } from '@/components/lesson/fret-board/fret-board';
import { useFretCheckpoint } from '@/components/lesson/fret-checkpoint/hooks/use-fret-checkpoint';
import type { FretCheckpointProps } from '@/components/lesson/fret-checkpoint/types';
import { lastFret } from '@/data/lessons/stage-03-lesson-01-model/constants';

const allFrets = Array.from({ length: lastFret + 1 }, (_, fret) => fret);

export function FretCheckpoint({ content, board, openString, noteFret, findNote, describe, passed, onPass }: FretCheckpointProps) {
  const { solved, fret, verdict, selectFret, checkFret, answer, noteOfFret } = useFretCheckpoint({ openString, findNote, onPass });
  const { noteTask, findTask, twelveTask } = content;
  return <div className="space-y-8">
    <section aria-labelledby="fret-task-note" className="space-y-3">
      <h3 id="fret-task-note" className="font-semibold text-primary">{noteTask.title}</h3>
      <FretBoard content={board} selected={noteFret} describe={describe} />
      <ChoiceQuestion question={noteTask.question} choices={noteTask.choices} correctChoiceId={noteTask.correctChoiceId} onCheck={answer('note')} />
    </section>
    <section aria-labelledby="fret-task-find" className="space-y-3">
      <h3 id="fret-task-find" className="font-semibold text-primary">{findTask.title}</h3>
      <p className="text-secondary">{findTask.question}</p>
      <FretBoard content={board} selected={fret} selectable={allFrets} onSelect={selectFret} describe={describe} />
      <Button color="secondary" onClick={checkFret}>{findTask.check}</Button>
      <p role="status" className="text-secondary">{verdict ? (verdict.right ? findTask.right(verdict.fret) : findTask.wrong(verdict.fret, noteOfFret)) : null}</p>
    </section>
    <section aria-labelledby="fret-task-twelve" className="space-y-3">
      <h3 id="fret-task-twelve" className="font-semibold text-primary">{twelveTask.title}</h3>
      <ChoiceQuestion question={twelveTask.question} choices={twelveTask.choices} correctChoiceId={twelveTask.correctChoiceId} onCheck={answer('twelve')} />
    </section>
    <p role="status" className="font-medium text-primary">{passed ? content.passed : content.solvedStatus(solved.length)}</p>
  </div>;
}
