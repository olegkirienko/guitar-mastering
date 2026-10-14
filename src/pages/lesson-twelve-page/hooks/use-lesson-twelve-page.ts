import { useCallback, useEffect, useRef, useState } from 'react';
import { linkPairs, lessonTwelveContent, requiredHeardStrings } from '@/data/lessons/stage-03-lesson-02/constants';
import type { LessonTwelveStepId } from '@/data/lessons/stage-03-lesson-02/types';
import { fretFrequency } from '@/data/lessons/stage-03-lesson-01-model/utils/frets';
import { openStrings } from '@/data/lessons/stage-03-lesson-02-model/constants';
import { fretToNextString, openStringAfter, stringByNumber } from '@/data/lessons/stage-03-lesson-02-model/utils/strings';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { lessonTwelveProgressAdapter } from '@/progress/stage-03-lesson-02/stage-03-lesson-02';
import { useLessonTwelveProgress } from '@/progress/use-lesson-twelve-progress';

const noteGap = 700;

export function useLessonTwelvePage() {
  const { progress, setProgress, loaded, loadFailed, sync, retrySync, reset } = useLessonTwelveProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [focusedStep, setFocusedStep] = useState<LessonTwelveStepId | null>(null);
  // Session-only: what was heard or chosen on a screen is never saved, only which steps are done.
  const [heardStrings, setHeardStrings] = useState<readonly number[]>([]);
  const [stringsPredicted, setStringsPredicted] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [linkPredicted, setLinkPredicted] = useState(false);
  const [pair, setPair] = useState<number>(linkPairs[0]);
  const [fret, setFret] = useState(0);
  const [comparison, setComparison] = useState<{ pair: number; fret: number } | null>(null);
  const [foundPairs, setFoundPairs] = useState<readonly number[]>([]);
  const [patternPredicted, setPatternPredicted] = useState(false);
  const [lastChecked, setLastChecked] = useState(false);
  const [patternSolved, setPatternSolved] = useState(false);
  const [focusFinishStatus, setFocusFinishStatus] = useState(false);
  const finishStatus = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const { route, goTo: openStep } = useLessonRoute('12', lessonTwelveProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isCompleted = (step: LessonTwelveStepId) => progress.completedStepIds.includes(step);

  // «Завершити урок» disappears once pressed, so focus moves to the result.
  useEffect(() => {
    if (!focusFinishStatus) return;
    setFocusFinishStatus(false);
    finishStatus.current?.focus();
  }, [focusFinishStatus]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    if (lessonPreferences.audioEnabled !== enabled) void updatePreferences({ audioEnabled: enabled });
  }, [lessonPreferences.audioEnabled, updatePreferences]);
  const audio = useLessonTwoAudio(lessonPreferences.audioEnabled, setAudioEnabled, visibleStep);

  const completeStep = useCallback((step: LessonTwelveStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonTwelveStepId>([...current.completedStepIds, step])) }), [setProgress]);
  const goTo = (step: LessonTwelveStepId) => {
    clearTimers();
    setFocusedStep(step);
    openStep(step);
  };
  // «Далі» both finishes the screen and opens the next one.
  const advance = (from: LessonTwelveStepId, to: LessonTwelveStepId) => {
    completeStep(from);
    goTo(to);
  };
  const toggleAudio = () => {
    if (lessonPreferences.audioEnabled) setAudioEnabled(false);
    else void audio.enable();
  };

  const pluck = (frequency: number) => audio.playPluck(frequency);
  const playSequence = (frequencies: readonly number[]) => {
    clearTimers();
    frequencies.forEach((frequency, index) => {
      if (index === 0) pluck(frequency);
      else timers.current.push(window.setTimeout(() => pluck(frequency), index * noteGap));
    });
  };
  const stopAll = () => {
    clearTimers();
    audio.stop();
  };
  const playAll = () => playSequence(openStrings.map((item) => item.frequency));
  const pressedFrequency = (number: number, atFret: number) => fretFrequency(stringByNumber(number).frequency, atFret);
  const playPair = (number: number, atFret: number) => playSequence([pressedFrequency(number, atFret), openStringAfter(number)?.frequency ?? 0]);

  const playOctaves = () => playSequence([stringByNumber(6).frequency, stringByNumber(1).frequency]);

  const touchString = (number: number) => {
    setHeardStrings((current) => current.includes(number) ? current : [...current, number]);
    pluck(stringByNumber(number).frequency);
  };
  const stringsDone = isCompleted('strings') || (orderSubmitted && heardStrings.length >= requiredHeardStrings);

  const selectPair = (number: number) => {
    setPair(number);
    setFret(0);
    setComparison(null);
  };
  const compare = () => {
    setComparison({ pair, fret });
    playPair(pair, fret);
    if (fret !== fretToNextString(pair)) return;
    const next = foundPairs.includes(pair) ? foundPairs : [...foundPairs, pair];
    setFoundPairs(next);
    if (linkPairs.every((number) => next.includes(number))) completeStep('link');
  };
  const checkLast = () => {
    setLastChecked(true);
    playPair(2, 5);
  };
  const answerPattern = (_choiceId: string, isCorrect: boolean) => {
    if (!isCorrect) return;
    setPatternSolved(true);
    completeStep('pattern');
  };

  const passCheckpoint = useCallback(() => setProgress((current) => ({
    ...current,
    checkpointPassed: true,
    completedStepIds: Array.from(new Set<LessonTwelveStepId>([...current.completedStepIds, 'checkpoint'])),
  })), [setProgress]);

  const finishLesson = () => {
    setFocusFinishStatus(true);
    setProgress((current) => ({
      ...current,
      completedAt: current.completedAt ?? new Date().toISOString(),
      completedStepIds: Array.from(new Set<LessonTwelveStepId>([...current.completedStepIds, 'complete'])),
    }));
  };

  const audioMessage = audio.status === 'unavailable'
    ? lessonTwelveContent.preferences.audioUnavailable
    : audio.status === 'blocked'
      ? lessonTwelveContent.preferences.audioBlocked
      : null;

  const restartLesson = useCallback(async () => {
    await reset();
    clearTimers();
    setHeardStrings([]);
    setStringsPredicted(false);
    setOrderSubmitted(false);
    setLinkPredicted(false);
    setPair(linkPairs[0]);
    setFret(0);
    setComparison(null);
    setFoundPairs([]);
    setPatternPredicted(false);
    setLastChecked(false);
    setPatternSolved(false);
    setFocusedStep('intro');
    openStep('intro');
  }, [reset, openStep, clearTimers]);

  return {
    restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled,
    focusedStep, visibleStep, isCompleted, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus,
    pluck, playAll, stopAll, playPair, playOctaves, passCheckpoint, completeStep,

    heardStrings, touchString, stringsPredicted: stringsPredicted || isCompleted('strings'), answerStringsPrediction: () => setStringsPredicted(true),
    submitOrder: () => setOrderSubmitted(true), stringsDone,
    linkPredicted: linkPredicted || isCompleted('link'), answerLinkPrediction: () => setLinkPredicted(true),
    pair, selectPair, fret, selectFret: (next: number) => { setFret(next); setComparison(null); }, comparison, compare,
    foundPairs: isCompleted('link') ? linkPairs : foundPairs,
    patternPredicted: patternPredicted || isCompleted('pattern'), answerPatternPrediction: () => setPatternPredicted(true),
    lastChecked: lastChecked || isCompleted('pattern'), checkLast,
    patternSolved: patternSolved || isCompleted('pattern'), answerPattern,
  };
}
