import { useCallback, useState } from 'react';
import { lessonFourContent } from '@/data/lessons/stage-01-lesson-04/constants';
import type { DescriptionId, LessonFourStepId } from '@/data/lessons/stage-01-lesson-04/types';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { lessonFourProgressAdapter } from '@/progress/lesson-four/lesson-four';
import { useLessonFourProgress } from '@/progress/use-lesson-four-progress';

export function useLessonFourPage() {
  const { progress, setProgress, loaded, loadFailed, sync, retrySync } = useLessonFourProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [focusedStep, setFocusedStep] = useState<LessonFourStepId | null>(null);
  // Session-only descriptions from `intro`; the completion screen compares them with the experiments.
  const [descriptions, setDescriptions] = useState<readonly DescriptionId[]>([]);
  const [ownDescription, setOwnDescription] = useState('');
  // Session-only: each answer opens the rest of its step.
  const [introAnswered, setIntroAnswered] = useState(false);
  const [shapePredicted, setShapePredicted] = useState(false);
  const { intro, shape, preferences, waveWords } = lessonFourContent;
  const { route, goTo: openStep } = useLessonRoute('04', lessonFourProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isCompleted = (step: LessonFourStepId) => progress.completedStepIds.includes(step);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    if (lessonPreferences.audioEnabled !== enabled) void updatePreferences({ audioEnabled: enabled });
  }, [lessonPreferences.audioEnabled, updatePreferences]);
  const audio = useLessonTwoAudio(lessonPreferences.audioEnabled, setAudioEnabled, visibleStep);

  const completeStep = useCallback((step: LessonFourStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonFourStepId>([...current.completedStepIds, step])) }), [setProgress]);
  const goTo = (step: LessonFourStepId) => {
    setFocusedStep(step);
    openStep(step);
  };
  const toggleDescription = (id: DescriptionId, isSelected: boolean) => setDescriptions((current) => isSelected
    ? [...current.filter((item) => item !== id), id]
    : current.filter((item) => item !== id));
  const toggleAudio = () => {
    if (lessonPreferences.audioEnabled) setAudioEnabled(false);
    else void audio.enable();
  };
  // Any answer finishes `intro`; the question is about noticing, not about being right.
  const answerIntro = useCallback(() => {
    setIntroAnswered(true);
    completeStep('intro');
  }, [completeStep]);
  const answerShapeCount = useCallback(() => completeStep('shape'), [completeStep]);

  const audioMessage = audio.status === 'unavailable'
    ? preferences.audioUnavailable
    : audio.status === 'blocked'
      ? preferences.audioBlocked
      : null;

  return { route, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled, focusedStep, descriptions, toggleDescription, ownDescription, setOwnDescription, intro, shape, preferences, waveWords, visibleStep, isCompleted, audio, goTo, toggleAudio, answerIntro, answerShapeCount, introOpen: introAnswered || isCompleted('intro'), shapeOpen: shapePredicted || isCompleted('shape'), answerShapePrediction: () => setShapePredicted(true), audioMessage };
}
