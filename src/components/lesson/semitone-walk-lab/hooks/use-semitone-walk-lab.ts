import { useState } from 'react';
import type { SemitoneWalkLabProps } from '@/components/lesson/semitone-walk-lab/types';
import { isNameOfStep, namesOfStep, spellName } from '@/components/lesson/semitone-walk-lab/utils/walk';
import { walkSteps } from '@/data/lessons/stage-02-lesson-05/constants';
import { isWhiteKey } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';

type NameVerdict = 'right' | 'wrong' | null;

export function useSemitoneWalkLab({ onSolved }: Pick<SemitoneWalkLabProps, 'onSolved'>) {
  // Session-only: the start, the steps and the names are never saved.
  const [start, setStart] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [named, setNamed] = useState<readonly number[]>([]);
  const [letter, setLetter] = useState<string | null>(null);
  const [sign, setSign] = useState('');
  const [verdict, setVerdict] = useState<NameVerdict>(null);
  const [sentenceSolved, setSentenceSolved] = useState(false);

  const finished = named.includes(walkSteps);
  const report = (nextFinished: boolean, nextSentence: boolean) => {
    if (nextFinished && nextSentence) onSolved();
  };

  // Only a white key can be a start; the first key is named for free.
  const chooseStart = (key: number): boolean => {
    const absolute = key % 12;
    if (!isWhiteKey(absolute)) return false;
    setStart(absolute);
    setStep(0);
    setNamed([0]);
    setLetter(null);
    setSign('');
    setVerdict(null);
    return true;
  };
  const restart = () => {
    setStart(null);
    setStep(0);
    setNamed([]);
    setLetter(null);
    setSign('');
    setVerdict(null);
  };
  const stepUp = () => {
    if (step >= walkSteps || !named.includes(step)) return;
    setStep(step + 1);
    setLetter(null);
    setSign('');
    setVerdict(null);
  };
  const submitName = () => {
    if (start === null || letter === null) return;
    const right = isNameOfStep(start, step, spellName(letter, sign));
    setVerdict(right ? 'right' : 'wrong');
    if (!right) return;
    const next = named.includes(step) ? named : [...named, step];
    setNamed(next);
    report(next.includes(walkSteps), sentenceSolved);
  };
  const answerSentence = (_choiceId: string, isCorrect: boolean) => {
    if (!isCorrect) return;
    setSentenceSolved(true);
    report(finished, true);
  };
  const captions = Object.fromEntries(named.map((done) => [done, start === null ? '' : namesOfStep(start, done).join('\n')]));

  return { start, step, named, finished, letter, setLetter, sign, setSign, verdict, chooseStart, restart, stepUp, submitName, answerSentence, sentenceSolved, captions };
}
