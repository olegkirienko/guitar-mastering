import { useCallback, useEffect, useRef, useState } from 'react';
import { lessonElevenContent, requiredPressFrets } from '@/data/lessons/stage-03-lesson-01/constants';
import type { LessonElevenStepId } from '@/data/lessons/stage-03-lesson-01/types';
import { fifthString } from '@/data/lessons/stage-03-lesson-01-model/constants';
import { fretFrequency } from '@/data/lessons/stage-03-lesson-01-model/utils/frets';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { lessonElevenProgressAdapter } from '@/progress/stage-03-lesson-01/stage-03-lesson-01';
import { useLessonElevenProgress } from '@/progress/use-lesson-eleven-progress';

export function useLessonElevenPage() {
  const { progress, setProgress, loaded, loadFailed, sync, retrySync, reset } = useLessonElevenProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [focusedStep, setFocusedStep] = useState<LessonElevenStepId | null>(null);
  // Session-only: what was heard or chosen on a screen is never saved, only which steps are done.
  const [pressPredicted, setPressPredicted] = useState(false);
  const [pressFret, setPressFret] = useState(0);
  const [heardFrets, setHeardFrets] = useState<readonly number[]>([]);
  const [patternSolved, setPatternSolved] = useState(false);
  const [twelvePredicted, setTwelvePredicted] = useState(false);
  const [twelveFret, setTwelveFret] = useState(0);
  const [twelveViewed, setTwelveViewed] = useState(false);
  const [twelveSolved, setTwelveSolved] = useState(false);
  const [focusFinishStatus, setFocusFinishStatus] = useState(false);
  const finishStatus = useRef<HTMLDivElement>(null);
  const { route, goTo: openStep } = useLessonRoute('11', lessonElevenProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isCompleted = (step: LessonElevenStepId) => progress.completedStepIds.includes(step);

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

  const completeStep = useCallback((step: LessonElevenStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonElevenStepId>([...current.completedStepIds, step])) }), [setProgress]);
  const goTo = (step: LessonElevenStepId) => {
    setFocusedStep(step);
    openStep(step);
  };
  // «Далі» both finishes the screen and opens the next one.
  const advance = (from: LessonElevenStepId, to: LessonElevenStepId) => {
    completeStep(from);
    goTo(to);
  };
  const toggleAudio = () => {
    if (lessonPreferences.audioEnabled) setAudioEnabled(false);
    else void audio.enable();
  };

  const pluck = (frequency: number) => audio.playPluck(frequency);
  const pluckFret = (fret: number) => pluck(fretFrequency(fifthString.frequency, fret));

  const selectPressFret = (fret: number) => {
    setPressFret(fret);
    setHeardFrets((current) => current.includes(fret) ? current : [...current, fret]);
    pluckFret(fret);
  };
  const answerPattern = (_choiceId: string, isCorrect: boolean) => {
    if (!isCorrect) return;
    setPatternSolved(true);
    completeStep('press');
  };
  const pressReady = requiredPressFrets.every((fret) => heardFrets.includes(fret));

  const selectTwelveFret = (fret: number) => {
    setTwelveFret(fret);
    if (fret === 12) setTwelveViewed(true);
  };
  const answerTwelve = (_choiceId: string, isCorrect: boolean) => {
    if (!isCorrect) return;
    setTwelveSolved(true);
    completeStep('twelve');
  };

  const passCheckpoint = useCallback(() => setProgress((current) => ({
    ...current,
    checkpointPassed: true,
    completedStepIds: Array.from(new Set<LessonElevenStepId>([...current.completedStepIds, 'checkpoint'])),
  })), [setProgress]);

  const finishLesson = () => {
    setFocusFinishStatus(true);
    setProgress((current) => ({
      ...current,
      completedAt: current.completedAt ?? new Date().toISOString(),
      completedStepIds: Array.from(new Set<LessonElevenStepId>([...current.completedStepIds, 'complete'])),
    }));
  };

  const audioMessage = audio.status === 'unavailable'
    ? lessonElevenContent.preferences.audioUnavailable
    : audio.status === 'blocked'
      ? lessonElevenContent.preferences.audioBlocked
      : null;

  const restartLesson = useCallback(async () => {
    await reset();
    setPressPredicted(false);
    setPressFret(0);
    setHeardFrets([]);
    setPatternSolved(false);
    setTwelvePredicted(false);
    setTwelveFret(0);
    setTwelveViewed(false);
    setTwelveSolved(false);
    setFocusedStep('intro');
    openStep('intro');
  }, [reset, openStep]);

  return {
    restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled,
    focusedStep, visibleStep, isCompleted, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus,
    pluck, pluckFret, passCheckpoint, completeStep,
   
    pressPredicted: pressPredicted || isCompleted('press'), answerPressPrediction: () => setPressPredicted(true),
    pressFret, selectPressFret, pressReady, patternSolved: patternSolved || isCompleted('press'), answerPattern,
    heardCount: requiredPressFrets.filter((fret) => heardFrets.includes(fret)).length,
    twelvePredicted: twelvePredicted || isCompleted('twelve'), answerTwelvePrediction: () => setTwelvePredicted(true),
    twelveFret, selectTwelveFret, twelveViewed: twelveViewed || isCompleted('twelve'), twelveSolved: twelveSolved || isCompleted('twelve'), answerTwelve,
  };
}
