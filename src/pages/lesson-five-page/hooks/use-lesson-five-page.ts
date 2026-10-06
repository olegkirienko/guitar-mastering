import { useCallback, useEffect, useRef, useState } from 'react';
import { baseFrequency } from '@/data/lessons/stage-01-lesson-03-model/constants';
import { pluckGain } from '@/data/lessons/stage-01-lesson-03-model/utils/gain';
import { lessonFiveContent } from '@/data/lessons/stage-01-lesson-05/constants';
import type { LessonFiveStepId } from '@/data/lessons/stage-01-lesson-05/types';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { lessonFiveProgressAdapter } from '@/progress/lesson-five/lesson-five';
import { normalizeLessonFiveProgress } from '@/progress/lesson-five/utils/parse-progress';
import { useLessonFiveProgress } from '@/progress/use-lesson-five-progress';

export function useLessonFivePage() {
  const { progress, setProgress, loaded, loadFailed, sync, retrySync } = useLessonFiveProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [focusedStep, setFocusedStep] = useState<LessonFiveStepId | null>(null);
  // Session-only: the prediction of each task opens its lab, and is never saved.
  const [higherPredicted, setHigherPredicted] = useState(false);
  const [lowerPredicted, setLowerPredicted] = useState(false);
  // Session-only answers: the lesson saves which steps are done, never how they were answered.
  const [timbreCorrect, setTimbreCorrect] = useState<readonly string[]>([]);
  const [pathChainDone, setPathChainDone] = useState(false);
  const [pathCorrect, setPathCorrect] = useState<readonly string[]>([]);
  const [focusFinishStatus, setFocusFinishStatus] = useState(false);
  const finishStatus = useRef<HTMLDivElement>(null);
  const { intro, higher, lower, timbre, path, complete, lab, preferences } = lessonFiveContent;
  const { route, goTo: openStep } = useLessonRoute('05', lessonFiveProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isCompleted = (step: LessonFiveStepId) => progress.completedStepIds.includes(step);

  // «Завершити етап I» disappears once pressed, so focus moves to the result.
  useEffect(() => {
    if (!focusFinishStatus) return;
    setFocusFinishStatus(false);
    finishStatus.current?.focus();
  }, [focusFinishStatus]);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    if (lessonPreferences.audioEnabled !== enabled) void updatePreferences({ audioEnabled: enabled });
  }, [lessonPreferences.audioEnabled, updatePreferences]);
  const audio = useLessonTwoAudio(lessonPreferences.audioEnabled, setAudioEnabled, visibleStep);

  // Normalized on every change, because `checkpointPassed` here is derived from the four
  // task steps instead of being set by a step of its own.
  const completeStep = useCallback((step: LessonFiveStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : normalizeLessonFiveProgress({ ...current, completedStepIds: Array.from(new Set<LessonFiveStepId>([...current.completedStepIds, step])) })), [setProgress]);
  const goTo = (step: LessonFiveStepId) => {
    setFocusedStep(step);
    openStep(step);
  };
  const toggleAudio = () => {
    if (lessonPreferences.audioEnabled) setAudioEnabled(false);
    else void audio.enable();
  };
  // `intro` only sets up the four tasks, so starting them is what finishes it.
  const startTasks = () => {
    completeStep('intro');
    goTo('higher');
  };
  // The pluck of Lesson 1 for whoever has no guitar at hand: the base string, 220 Гц.
  const playIntroPluck = () => audio.playPluck(baseFrequency, pluckGain(baseFrequency));

  // `timbre` is done once both questions are right; wrong answers only explain themselves.
  const answerTimbre = (id: string, isCorrect: boolean) => {
    if (!isCorrect) return;
    const next = Array.from(new Set([...timbreCorrect, id]));
    setTimbreCorrect(next);
    if (timbre.questions.every((question) => next.includes(question.id))) completeStep('timbre');
  };

  // `path` needs all three: the chain with its control question, and both stage questions.
  const finishPath = (chainDone: boolean, correct: readonly string[]) => {
    if (chainDone && path.questions.every((question) => correct.includes(question.id))) completeStep('path');
  };

  const completePathChain = () => {
    setPathChainDone(true);
    finishPath(true, pathCorrect);
  };

  const answerPath = (id: string, isCorrect: boolean) => {
    if (!isCorrect) return;
    const next = Array.from(new Set([...pathCorrect, id]));
    setPathCorrect(next);
    finishPath(pathChainDone, next);
  };

  // Only this button writes `completedAt`; nothing else in the lesson closes Stage I.
  const finishStage = () => {
    setFocusFinishStatus(true);
    setProgress((current) => normalizeLessonFiveProgress({
      ...current,
      completedAt: current.completedAt ?? new Date().toISOString(),
      completedStepIds: Array.from(new Set<LessonFiveStepId>([...current.completedStepIds, 'complete'])),
    }));
  };

  // The bridge plays its own two tones, so it does not depend on the labs above.
  const playBridge = (frequency: number) => audio.playPluck(frequency, pluckGain(frequency));

  const audioMessage = audio.status === 'unavailable'
    ? preferences.audioUnavailable
    : audio.status === 'blocked'
      ? preferences.audioBlocked
      : null;

  return { route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled, focusedStep, intro, higher, lower, complete, lab, visibleStep, isCompleted, audio, goTo, toggleAudio, startTasks, playIntroPluck, finishStage, finishStatus, playBridge, higherOpen: higherPredicted || isCompleted('higher'), answerHigherPrediction: () => setHigherPredicted(true), solveHigher: () => completeStep('higher'), lowerOpen: lowerPredicted || isCompleted('lower'), answerLowerPrediction: () => setLowerPredicted(true), solveLower: () => completeStep('lower'), timbre, path, answerTimbre, completePathChain, answerPath, pathQuestionsOpen: pathChainDone || isCompleted('path'), audioMessage };
}
