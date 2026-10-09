import { useCallback, useEffect, useRef, useState } from 'react';
import { lessonTenContent } from '@/data/lessons/stage-02-lesson-05/constants';
import type { LessonTenStepId } from '@/data/lessons/stage-02-lesson-05/types';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { lessonTenProgressAdapter } from '@/progress/stage-02-lesson-05/stage-02-lesson-05';
import { useLessonTenProgress } from '@/progress/use-lesson-ten-progress';

// Gentle enough for the highest tone of the lesson on headphones.
export const toneGain = 0.08;

export function useLessonTenPage() {
  const { progress, setProgress, loaded, loadFailed, sync, retrySync, reset } = useLessonTenProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [focusedStep, setFocusedStep] = useState<LessonTenStepId | null>(null);
  // Session-only: the prediction from `intro` is shown again on `walk` and never saved.
  const [introChoiceId, setIntroChoiceId] = useState<string | null>(null);
  const [focusFinishStatus, setFocusFinishStatus] = useState(false);
  const finishStatus = useRef<HTMLDivElement>(null);
  const { route, goTo: openStep } = useLessonRoute('10', lessonTenProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isCompleted = (step: LessonTenStepId) => progress.completedStepIds.includes(step);

  // «Завершити етап II» disappears once pressed, so focus moves to the result.
  useEffect(() => {
    if (!focusFinishStatus) return;
    setFocusFinishStatus(false);
    finishStatus.current?.focus();
  }, [focusFinishStatus]);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    if (lessonPreferences.audioEnabled !== enabled) void updatePreferences({ audioEnabled: enabled });
  }, [lessonPreferences.audioEnabled, updatePreferences]);
  const audio = useLessonTwoAudio(lessonPreferences.audioEnabled, setAudioEnabled, visibleStep);

  const completeStep = useCallback((step: LessonTenStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonTenStepId>([...current.completedStepIds, step])) }), [setProgress]);
  const goTo = (step: LessonTenStepId) => {
    setFocusedStep(step);
    openStep(step);
  };
  // «Далі» both finishes the screen and opens the next one.
  const advance = (from: LessonTenStepId, to: LessonTenStepId) => {
    completeStep(from);
    goTo(to);
  };
  const toggleAudio = () => {
    if (lessonPreferences.audioEnabled) setAudioEnabled(false);
    else void audio.enable();
  };

  const finishLesson = () => {
    setFocusFinishStatus(true);
    setProgress((current) => ({
      ...current,
      completedAt: current.completedAt ?? new Date().toISOString(),
      completedStepIds: Array.from(new Set<LessonTenStepId>([...current.completedStepIds, 'complete'])),
    }));
  };

  const audioMessage = audio.status === 'unavailable'
    ? lessonTenContent.preferences.audioUnavailable
    : audio.status === 'blocked'
      ? lessonTenContent.preferences.audioBlocked
      : null;

  const restartLesson = useCallback(async () => {
    await reset();
    setIntroChoiceId(null);
    setFocusedStep('intro');
    openStep('intro');
  }, [reset, openStep]);

  const predictionLabel = lessonTenContent.intro.prediction.choices.find((choice) => choice.id === introChoiceId)?.label ?? null;

  return {
    restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled,
    focusedStep, visibleStep, isCompleted, completeStep, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus,
    predictionLabel, answerIntro: (choiceId: string) => setIntroChoiceId(choiceId),
  };
}
