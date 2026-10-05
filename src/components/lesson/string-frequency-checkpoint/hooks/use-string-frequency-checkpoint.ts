import { useRef, useState } from 'react';
import type { StringFrequencyCheckpointProps } from '@/components/lesson/string-frequency-checkpoint/types';
import type { LabTask } from '@/components/lesson/string-frequency-lab/types';
import { checkpointTasks } from '@/data/lessons/stage-01-lesson-03-model/constants';
import { checkpointPassed } from '@/data/lessons/stage-01-lesson-03-model/utils/checkpoint';

export function useStringFrequencyCheckpoint({ content, passed, onPass }: Pick<StringFrequencyCheckpointProps, 'content' | 'passed' | 'onPass'>) {
  // Session-only, like Lesson 2: only `checkpointPassed` is saved, never attempts.
  const [solvedTaskIds, setSolvedTaskIds] = useState<readonly string[]>([]);
  const [correctQuestionIds, setCorrectQuestionIds] = useState<readonly string[]>([]);
  const reported = useRef(passed);
  const taskIds = checkpointTasks.map((task) => task.id);
  const questionIds = content.questions.map((question) => question.id);
  const tasks: LabTask[] = checkpointTasks.flatMap((model) => content.tasks
    .filter((text) => text.id === model.id)
    .map((text) => ({ ...text, model, lockedNote: content.lockedNote, checkLabel: content.checkLabel, resetLabel: content.resetLabel, startText: content.startText })));

  const report = (solved: readonly string[], correct: readonly string[]) => {
    if (reported.current || !checkpointPassed(solved, correct, taskIds, questionIds)) return;
    reported.current = true;
    onPass();
  };
  const solveTask = (id: string) => {
    const next = Array.from(new Set([...solvedTaskIds, id]));
    setSolvedTaskIds(next);
    report(next, correctQuestionIds);
  };
  const answerQuestion = (id: string, isCorrect: boolean) => {
    if (!isCorrect) return;
    const next = Array.from(new Set([...correctQuestionIds, id]));
    setCorrectQuestionIds(next);
    report(solvedTaskIds, next);
  };

  return {
    tasks,
    solveTask,
    answerQuestion,
    isPassed: passed || checkpointPassed(solvedTaskIds, correctQuestionIds, taskIds, questionIds),
  };
}
