import { useCallback, useEffect, useRef, useState } from 'react';
import { requiredPairs, requiredWhiteKeys, lessonEightContent } from '@/data/lessons/stage-02-lesson-03/constants';
import type { LessonEightStepId } from '@/data/lessons/stage-02-lesson-03/types';
import { baseFrequency, keyOfA, whiteKeyPositions } from '@/data/lessons/stage-02-lesson-03-model/constants';
import { isWhiteKey, noteNameOf } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';
import { gradePair, whitePairs } from '@/data/lessons/stage-02-lesson-03-model/utils/pairs';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { useLessonEightProgress } from '@/progress/use-lesson-eight-progress';
import { lessonEightProgressAdapter } from '@/progress/stage-02-lesson-03/stage-02-lesson-03';

// Gentle enough for the highest tone of the lesson on headphones.
export const toneGain = 0.08;

const pairs = whitePairs();

export function useLessonEightPage() {
  const { progress, setProgress, loaded, loadFailed, sync, retrySync, reset } = useLessonEightProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [focusedStep, setFocusedStep] = useState<LessonEightStepId | null>(null);
  // Session-only: what was pressed or chosen on a screen is never saved, only which steps are done.
  const [pressedKeys, setPressedKeys] = useState<readonly number[]>([]);
  const [lastKey, setLastKey] = useState<number | null>(null);
  const [patternPredicted, setPatternPredicted] = useState(false);
  const [pairChoices, setPairChoices] = useState<Readonly<Record<number, number>>>({});
  const [solvedAnchor, setSolvedAnchor] = useState<readonly string[]>([]);
  const [focusFinishStatus, setFocusFinishStatus] = useState(false);
  const finishStatus = useRef<HTMLDivElement>(null);
  const { route, goTo: openStep } = useLessonRoute('08', lessonEightProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isCompleted = (step: LessonEightStepId) => progress.completedStepIds.includes(step);

  // «Завершити урок» disappears once pressed, so focus moves to the result.
  useEffect(() => {
    if (!focusFinishStatus) return;
    setFocusFinishStatus(false);
    finishStatus.current?.focus();
  }, [focusFinishStatus]);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    if (lessonPreferences.audioEnabled !== enabled) void updatePreferences({ audioEnabled: enabled });
  }, [lessonPreferences.audioEnabled, updatePreferences]);
  const audio = useLessonTwoAudio(lessonPreferences.audioEnabled, setAudioEnabled, visibleStep);

  const completeStep = useCallback((step: LessonEightStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonEightStepId>([...current.completedStepIds, step])) }), [setProgress]);
  const goTo = (step: LessonEightStepId) => {
    setPressedKeys([]);
    setLastKey(null);
    setFocusedStep(step);
    openStep(step);
  };
  // «Далі» both finishes the screen and opens the next one.
  const advance = (from: LessonEightStepId, to: LessonEightStepId) => {
    completeStep(from);
    goTo(to);
  };
  const toggleAudio = () => {
    if (lessonPreferences.audioEnabled) setAudioEnabled(false);
    else void audio.enable();
  };

  const pressKey = (key: number) => {
    audio.playTone(keyFrequency(baseFrequency, key), toneGain);
    setLastKey(key);
    setPressedKeys((current) => current.includes(key) ? current : [...current, key]);
  };

  // On `pattern` only white keys 0–11 count towards the seven.
  const whitesFound = pressedKeys.filter((key) => isWhiteKey(key) && key < 12).length;
  const pairsRight = pairs.filter((pair, index) => pairChoices[index] !== undefined && gradePair(pair, pairChoices[index])).length;
  const patternDone = isCompleted('pattern') || (whitesFound >= requiredWhiteKeys && pairsRight >= requiredPairs);
  const choosePair = (index: number, semitones: number) => setPairChoices((current) => ({ ...current, [index]: semitones }));
  const revealPattern = () => {
    setPairChoices(Object.fromEntries(pairs.map((pair, index) => [index, pair.semitones])));
    setPressedKeys((current) => Array.from(new Set([...current, ...whiteKeyPositions])));
  };

  const captions = Object.fromEntries(pressedKeys.flatMap((key) => {
    const name = noteNameOf(key);
    return name === null ? [] : [[key, name]];
  }));
  const blackPressed = lastKey !== null && !isWhiteKey(lastKey);
  const anchorFound = pressedKeys.includes(keyOfA);

  const answerNames = (_choiceId: string, isCorrect: boolean) => { if (isCorrect) completeStep('names'); };
  const answerAnchor = (id: string, isCorrect: boolean) => {
    if (!isCorrect) return;
    const next = solvedAnchor.includes(id) ? solvedAnchor : [...solvedAnchor, id];
    setSolvedAnchor(next);
    if (lessonEightContent.anchor.questions.every((question) => next.includes(question.id))) completeStep('anchor');
  };

  const passCheckpoint = useCallback(() => setProgress((current) => ({
    ...current,
    checkpointPassed: true,
    completedStepIds: Array.from(new Set<LessonEightStepId>([...current.completedStepIds, 'checkpoint'])),
  })), [setProgress]);
  const finishPattern = () => advance('pattern', 'names');

  const finishLesson = () => {
    setFocusFinishStatus(true);
    setProgress((current) => ({
      ...current,
      completedAt: current.completedAt ?? new Date().toISOString(),
      completedStepIds: Array.from(new Set<LessonEightStepId>([...current.completedStepIds, 'complete'])),
    }));
  };

  const audioMessage = audio.status === 'unavailable'
    ? lessonEightContent.preferences.audioUnavailable
    : audio.status === 'blocked'
      ? lessonEightContent.preferences.audioBlocked
      : null;

  const restartLesson = useCallback(async () => {
    await reset();
    setPressedKeys([]);
    setPairChoices({});
    setSolvedAnchor([]);
    setPatternPredicted(false);
    setFocusedStep('intro');
    openStep('intro');
  }, [reset, openStep]);

  return {
    restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled,
    focusedStep, visibleStep, isCompleted, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus,
    pressedKeys, pressKey, captions, blackPressed, anchorFound,
    patternPredicted: patternPredicted || isCompleted('pattern'), answerPattern: () => setPatternPredicted(true),
    whitesFound, pairChoices, choosePair, revealPattern, patternDone, finishPattern,
    answerNames, answerAnchor, passCheckpoint,
  };
}
