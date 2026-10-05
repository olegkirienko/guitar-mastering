import { useCallback, useEffect, useRef, useState } from 'react';
import { lessonThreeContent } from '@/data/lessons/stage-01-lesson-03/constants';
import type { HypothesisId, LessonThreeStepId } from '@/data/lessons/stage-01-lesson-03/types';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { lessonThreeProgressAdapter } from '@/progress/lesson-three/lesson-three';
import { useLessonThreeProgress } from '@/progress/use-lesson-three-progress';

export function useLessonThreePage() {
  const { progress, setProgress, loaded, loadFailed, sync, retrySync } = useLessonThreeProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [focusedStep, setFocusedStep] = useState<LessonThreeStepId | null>(null);
  // Session-only guesses from `intro`; the completion screen compares them with the experiments.
  const [hypotheses, setHypotheses] = useState<readonly HypothesisId[]>([]);
  const [ownHypothesis, setOwnHypothesis] = useState('');
  // Session-only: the question before each experiment opens the rest of its step.
  const [tensionAnswered, setTensionAnswered] = useState(false);
  const [densityAnswered, setDensityAnswered] = useState(false);
  const [focusFinishStatus, setFocusFinishStatus] = useState(false);
  const finishStatus = useRef<HTMLDivElement>(null);
  const { intro, length, tension, density, model, checkpoint, complete, preferences } = lessonThreeContent;
  const { route, goTo: openStep } = useLessonRoute('03', lessonThreeProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isCompleted = (step: LessonThreeStepId) => progress.completedStepIds.includes(step);

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

  const completeStep = useCallback((step: LessonThreeStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonThreeStepId>([...current.completedStepIds, step])) }), [setProgress]);
  const goTo = (step: LessonThreeStepId) => {
    setFocusedStep(step);
    openStep(step);
  };
  const begin = () => {
    setFocusedStep('length');
    // One write for both the reach and the new position.
    setProgress((current) => ({
      ...current,
      currentStepId: 'length',
      completedStepIds: Array.from(new Set<LessonThreeStepId>([...current.completedStepIds, 'intro'])),
    }));
    openStep('length');
  };
  const toggleHypothesis = (id: HypothesisId, isSelected: boolean) => setHypotheses((current) => isSelected
    ? [...current.filter((item) => item !== id), id]
    : current.filter((item) => item !== id));
  const toggleAudio = () => {
    if (lessonPreferences.audioEnabled) setAudioEnabled(false);
    else void audio.enable();
  };
  const completeLength = useCallback(() => completeStep('length'), [completeStep]);
  const completeTension = useCallback(() => completeStep('tension'), [completeStep]);
  const completeDensity = useCallback(() => completeStep('density'), [completeStep]);
  const completeModel = useCallback(() => completeStep('model'), [completeStep]);
  const passCheckpoint = useCallback(() => setProgress((current) => ({
    ...current,
    checkpointPassed: true,
    completedStepIds: Array.from(new Set<LessonThreeStepId>([...current.completedStepIds, 'checkpoint'])),
  })), [setProgress]);
  const finishLesson = () => {
    setFocusFinishStatus(true);
    setProgress((current) => ({
      ...current,
      completedAt: current.completedAt ?? new Date().toISOString(),
      completedStepIds: Array.from(new Set<LessonThreeStepId>([...current.completedStepIds, 'complete'])),
    }));
  };

  const audioMessage = audio.status === 'unavailable'
    ? preferences.audioUnavailable
    : audio.status === 'blocked'
      ? preferences.audioBlocked
      : null;

  return { route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled, focusedStep, hypotheses, toggleHypothesis, ownHypothesis, setOwnHypothesis, finishStatus, intro, length, tension, density, model, checkpoint, complete, preferences, visibleStep, isCompleted, audio, goTo, begin, toggleAudio, completeLength, completeTension, completeDensity, completeModel, passCheckpoint, finishLesson, tensionOpen: tensionAnswered || isCompleted('tension'), answerTension: () => setTensionAnswered(true), densityOpen: densityAnswered || isCompleted('density'), answerDensity: () => setDensityAnswered(true), audioMessage };
}
