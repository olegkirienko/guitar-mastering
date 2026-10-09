import { useCallback, useEffect, useRef, useState } from 'react';
import { requiredKeys } from '@/data/lessons/stage-02-lesson-02/constants';
import { baseFrequency } from '@/data/lessons/stage-02-lesson-02-model/constants';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';
import type { LessonSevenStepId } from '@/data/lessons/stage-02-lesson-02/types';
import { lessonSevenContent } from '@/data/lessons/stage-02-lesson-02/constants';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { lessonSevenProgressAdapter } from '@/progress/stage-02-lesson-02/stage-02-lesson-02';
import { useLessonSevenProgress } from '@/progress/use-lesson-seven-progress';

// Gentle enough for the highest tone of the lesson on headphones.
export const toneGain = 0.08;

export function useLessonSevenPage() {
  const { progress, setProgress, loaded, loadFailed, sync, retrySync, reset } = useLessonSevenProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [focusedStep, setFocusedStep] = useState<LessonSevenStepId | null>(null);
  // Session-only: what was pressed or shown on a screen is never saved, only which steps are done.
  const [pressedKeys, setPressedKeys] = useState<readonly number[]>([]);
  const [keysPredicted, setKeysPredicted] = useState(false);
  const [comparePredicted, setComparePredicted] = useState(false);
  const [numbersShown, setNumbersShown] = useState(false);
  const [chainCount, setChainCount] = useState(0);
  const [focusFinishStatus, setFocusFinishStatus] = useState(false);
  const finishStatus = useRef<HTMLDivElement>(null);
  const { route, goTo: openStep } = useLessonRoute('07', lessonSevenProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isCompleted = (step: LessonSevenStepId) => progress.completedStepIds.includes(step);

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

  const completeStep = useCallback((step: LessonSevenStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonSevenStepId>([...current.completedStepIds, step])) }), [setProgress]);
  const goTo = (step: LessonSevenStepId) => {
    setFocusedStep(step);
    openStep(step);
  };
  // «Далі» both finishes the screen and opens the next one.
  const advance = (from: LessonSevenStepId, to: LessonSevenStepId) => {
    completeStep(from);
    goTo(to);
  };
  const toggleAudio = () => {
    if (lessonPreferences.audioEnabled) setAudioEnabled(false);
    else void audio.enable();
  };

  const pressKey = (key: number) => {
    audio.playTone(keyFrequency(baseFrequency, key), toneGain);
    setPressedKeys((current) => current.includes(key) ? current : [...current, key]);
  };
  // Pressing the three keys counts as listening, with or without sound.
  const keysDone = (keysPredicted || isCompleted('keys')) && requiredKeys.every((key) => pressedKeys.includes(key));

  const passCheckpoint = useCallback(() => setProgress((current) => ({
    ...current,
    checkpointPassed: true,
    completedStepIds: Array.from(new Set<LessonSevenStepId>([...current.completedStepIds, 'checkpoint'])),
  })), [setProgress]);
  const finishSteps = useCallback(() => completeStep('steps'), [completeStep]);
  // Only the right answer opens «Далі» on `semitone`; a wrong one can be tried again.
  const answerSemitone = (_choiceId: string, isCorrect: boolean) => { if (isCorrect) completeStep('semitone'); };

  const finishLesson = () => {
    setFocusFinishStatus(true);
    setProgress((current) => ({
      ...current,
      completedAt: current.completedAt ?? new Date().toISOString(),
      completedStepIds: Array.from(new Set<LessonSevenStepId>([...current.completedStepIds, 'complete'])),
    }));
  };

  const audioMessage = audio.status === 'unavailable'
    ? lessonSevenContent.preferences.audioUnavailable
    : audio.status === 'blocked'
      ? lessonSevenContent.preferences.audioBlocked
      : null;

  const restartLesson = useCallback(async () => {
    await reset();
    setFocusedStep('intro');
    openStep('intro');
  }, [reset, openStep]);

  return {
    restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled,
    focusedStep, visibleStep, isCompleted, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus,
    pressedKeys, pressKey, keysPredicted: keysPredicted || isCompleted('keys'), answerKeys: () => setKeysPredicted(true), keysDone,
    comparePredicted: comparePredicted || isCompleted('compare'), answerCompare: () => setComparePredicted(true),
    numbersShown: numbersShown || isCompleted('compare'), showNumbers: () => setNumbersShown(true),
    chainCount, multiply: () => setChainCount((current) => Math.min(current + 1, 12)), resetChain: () => setChainCount(0),
    passCheckpoint, finishSteps, answerSemitone,
  };
}
