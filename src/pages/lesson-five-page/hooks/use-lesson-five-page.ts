import { useCallback, useState } from 'react';
import { baseFrequency } from '@/data/lessons/stage-01-lesson-03-model/constants';
import { pluckGain } from '@/data/lessons/stage-01-lesson-03-model/utils/gain';
import { lessonFiveContent } from '@/data/lessons/stage-01-lesson-05/constants';
import type { LessonFiveStepId } from '@/data/lessons/stage-01-lesson-05/types';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { lessonFiveProgressAdapter } from '@/progress/lesson-five/lesson-five';
import { useLessonFiveProgress } from '@/progress/use-lesson-five-progress';

export function useLessonFivePage() {
  const { progress, setProgress, loaded, loadFailed, sync, retrySync } = useLessonFiveProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [focusedStep, setFocusedStep] = useState<LessonFiveStepId | null>(null);
  // Session-only: the prediction of each task opens its lab, and is never saved.
  const [higherPredicted, setHigherPredicted] = useState(false);
  const [lowerPredicted, setLowerPredicted] = useState(false);
  const { intro, higher, lower, lab, preferences } = lessonFiveContent;
  const { route, goTo: openStep } = useLessonRoute('05', lessonFiveProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isCompleted = (step: LessonFiveStepId) => progress.completedStepIds.includes(step);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    if (lessonPreferences.audioEnabled !== enabled) void updatePreferences({ audioEnabled: enabled });
  }, [lessonPreferences.audioEnabled, updatePreferences]);
  const audio = useLessonTwoAudio(lessonPreferences.audioEnabled, setAudioEnabled, visibleStep);

  const completeStep = useCallback((step: LessonFiveStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonFiveStepId>([...current.completedStepIds, step])) }), [setProgress]);
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

  const audioMessage = audio.status === 'unavailable'
    ? preferences.audioUnavailable
    : audio.status === 'blocked'
      ? preferences.audioBlocked
      : null;

  return { route, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled, focusedStep, intro, higher, lower, lab, preferences, visibleStep, isCompleted, audio, goTo, toggleAudio, startTasks, playIntroPluck, higherOpen: higherPredicted || isCompleted('higher'), answerHigherPrediction: () => setHigherPredicted(true), solveHigher: () => completeStep('higher'), lowerOpen: lowerPredicted || isCompleted('lower'), answerLowerPrediction: () => setLowerPredicted(true), solveLower: () => completeStep('lower'), audioMessage };
}
