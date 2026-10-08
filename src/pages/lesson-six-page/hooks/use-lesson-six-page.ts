import { useCallback, useEffect, useRef, useState } from 'react';
import { sameNameFrequencies } from '@/data/lessons/stage-02-lesson-01/constants';
import type { LessonSixStepId } from '@/data/lessons/stage-02-lesson-01/types';
import { lessonSixContent } from '@/data/lessons/stage-02-lesson-01/constants';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { lessonSixProgressAdapter } from '@/progress/stage-02-lesson-01/stage-02-lesson-01';
import { useLessonSixProgress } from '@/progress/use-lesson-six-progress';

// Gentle enough for the highest tone of the lesson on headphones.
export const toneGain = 0.08;

export function useLessonSixPage() {
  const { progress, setProgress, loaded, loadFailed, sync, retrySync, reset } = useLessonSixProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [focusedStep, setFocusedStep] = useState<LessonSixStepId | null>(null);
  // Session-only: what was heard or found on a screen is never saved, only which steps are done.
  const [betweenFound, setBetweenFound] = useState(0);
  const [sameNamePredicted, setSameNamePredicted] = useState(false);
  const [heard, setHeard] = useState<readonly number[]>([]);
  const [focusFinishStatus, setFocusFinishStatus] = useState(false);
  const finishStatus = useRef<HTMLDivElement>(null);
  const { route, goTo: openStep } = useLessonRoute('06', lessonSixProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isCompleted = (step: LessonSixStepId) => progress.completedStepIds.includes(step);

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

  const completeStep = useCallback((step: LessonSixStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonSixStepId>([...current.completedStepIds, step])) }), [setProgress]);
  const goTo = (step: LessonSixStepId) => {
    setFocusedStep(step);
    openStep(step);
  };
  // «Далі» both finishes the screen and opens the next one.
  const advance = (from: LessonSixStepId, to: LessonSixStepId) => {
    completeStep(from);
    goTo(to);
  };
  const toggleAudio = () => {
    if (lessonPreferences.audioEnabled) setAudioEnabled(false);
    else void audio.enable();
  };

  const listen = (frequency: number) => {
    audio.playTone(frequency, toneGain);
    setHeard((current) => current.includes(frequency) ? current : [...current, frequency]);
  };
  // With sound every card has to be heard; without it the answer alone is enough.
  const sameNameDone = (sameNamePredicted || isCompleted('same-name'))
    && (!audio.enabled || sameNameFrequencies.every((frequency) => heard.includes(frequency)));

  const passCheckpoint = useCallback(() => setProgress((current) => ({
    ...current,
    checkpointPassed: true,
    completedStepIds: Array.from(new Set<LessonSixStepId>([...current.completedStepIds, 'checkpoint'])),
  })), [setProgress]);
  const finishDoubler = useCallback(() => completeStep('doubler'), [completeStep]);
  // Only the right answer opens «Далі» on `octave`; a wrong one can be tried again.
  const answerOctave = (_choiceId: string, isCorrect: boolean) => { if (isCorrect) completeStep('octave'); };

  const finishLesson = () => {
    setFocusFinishStatus(true);
    setProgress((current) => ({
      ...current,
      completedAt: current.completedAt ?? new Date().toISOString(),
      completedStepIds: Array.from(new Set<LessonSixStepId>([...current.completedStepIds, 'complete'])),
    }));
  };

  const audioMessage = audio.status === 'unavailable'
    ? lessonSixContent.preferences.audioUnavailable
    : audio.status === 'blocked'
      ? lessonSixContent.preferences.audioBlocked
      : null;

  const restartLesson = useCallback(async () => {
    await reset();
    setFocusedStep('intro');
    openStep('intro');
  }, [reset, openStep]);

  return {
    restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled,
    focusedStep, visibleStep, isCompleted, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus,
    betweenFound, findBetween: () => setBetweenFound((current) => current + 1),
    answerSameName: () => setSameNamePredicted(true), sameNamePredicted: sameNamePredicted || isCompleted('same-name'),
    passCheckpoint, finishDoubler, answerOctave,
    listen, isHeard: (frequency: number) => heard.includes(frequency), sameNameDone,
  };
}
