import { useCallback, useEffect, useRef, useState } from 'react';
import { type PitchPath } from '@/components/lesson/same-string-pitch-experience/types';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import type { LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02/types';
import { useAuth } from '@/hooks/use-auth';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion/use-prefers-reduced-motion';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { lessonTwoProgressAdapter } from '@/progress/lesson-two/lesson-two';
import { useLessonTwoProgress } from '@/progress/use-lesson-two-progress';

export function useLessonTwoPage() {
  const {
    progress,
    setProgress,
    loaded,
    loadFailed,
    sync,
    retrySync,
    reset,
  } = useLessonTwoProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [preferredPath, setPreferredPath] = useState<PitchPath>('guitar');
  const [stringReady, setStringReady] = useState(false);
  const [focusedStep, setFocusedStep] = useState<LessonTwoStepId | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [reflection, setReflection] = useState('');
  const [focusFinishStatus, setFocusFinishStatus] = useState(false);
  const finishStatus = useRef<HTMLDivElement>(null);
  const { intro, string, preferences, repeats, frequency, loudness, guitar, checkpoint, complete } = lessonTwoContent;
  const { route, goTo: openStep } = useLessonRoute('02', lessonTwoProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const staticMode = prefersReducedMotion || lessonPreferences.prefersStatic;
  const isCompleted = (step: LessonTwoStepId) => progress.completedStepIds.includes(step);


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

  const completeStep = useCallback((step: LessonTwoStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonTwoStepId>([...current.completedStepIds, step])) }), [setProgress]);
  const goTo = (step: LessonTwoStepId) => {
    setFocusedStep(step);
    openStep(step);
  };
  const begin = (path: PitchPath) => {
    setPreferredPath(path);
    setFocusedStep('string');
    // One write for both the reach and the new position.
    setProgress((current) => ({
      ...current,
      currentStepId: 'string',
      completedStepIds: Array.from(new Set<LessonTwoStepId>([...current.completedStepIds, 'intro'])),
    }));
    openStep('string');
  };
  const toggleAudio = () => {
    if (lessonPreferences.audioEnabled) setAudioEnabled(false);
    else void audio.enable();
  };
  const completeRepeats = useCallback(() => completeStep('repeats'), [completeStep]);
  const completeFrequency = useCallback(() => completeStep('frequency'), [completeStep]);
  const completeLoudness = useCallback(() => completeStep('loudness'), [completeStep]);
  const completeGuitar = useCallback(() => completeStep('guitar'), [completeStep]);
  const passCheckpoint = useCallback(() => setProgress((current) => ({
    ...current,
    checkpointPassed: true,
    completedStepIds: Array.from(new Set<LessonTwoStepId>([...current.completedStepIds, 'checkpoint'])),
  })), [setProgress]);
  const finishLesson = () => {
    setFocusFinishStatus(true);
    setProgress((current) => ({
      ...current,
      completedAt: current.completedAt ?? new Date().toISOString(),
      completedStepIds: Array.from(new Set<LessonTwoStepId>([...current.completedStepIds, 'complete'])),
    }));
  };

  const audioMessage = audio.status === 'unavailable'
    ? preferences.audioUnavailable
    : audio.status === 'blocked'
      ? preferences.audioBlocked
      : null;

  const restartLesson = useCallback(async () => {
    await reset();
    setFocusedStep('intro');
    openStep('intro');
  }, [reset, openStep]);

  return { restartLesson, route, progress, setProgress, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled, preferredPath, stringReady, setStringReady, focusedStep, reflection, setReflection, finishStatus, intro, string, repeats, frequency, loudness, guitar, checkpoint, complete, visibleStep, staticMode, isCompleted, audio, completeStep, goTo, begin, toggleAudio, completeRepeats, completeFrequency, completeLoudness, completeGuitar, passCheckpoint, finishLesson, audioMessage };
}
