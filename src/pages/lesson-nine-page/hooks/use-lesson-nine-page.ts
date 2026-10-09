import { useCallback, useEffect, useRef, useState } from 'react';
import { edgeCases } from '@/data/lessons/stage-02-lesson-04/constants';
import type { LessonNineStepId } from '@/data/lessons/stage-02-lesson-04/types';
import { lessonNineContent } from '@/data/lessons/stage-02-lesson-04/constants';
import { baseFrequency } from '@/data/lessons/stage-02-lesson-03-model/constants';
import { flatOf, sharpOf } from '@/data/lessons/stage-02-lesson-04-model/utils/names';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { useLessonTwoAudio } from '@/hooks/use-lesson-two-audio/use-lesson-two-audio';
import { lessonNineProgressAdapter } from '@/progress/stage-02-lesson-04/stage-02-lesson-04';
import { useLessonNineProgress } from '@/progress/use-lesson-nine-progress';
import { keyNames, toCaptions } from '@/pages/lesson-nine-page/utils/captions';
import { applyMovePress, initialMove } from '@/pages/lesson-nine-page/utils/moves';

// Gentle enough for the highest tone of the lesson on headphones.
export const toneGain = 0.08;

export function useLessonNinePage() {
  const { progress, setProgress, loaded, loadFailed, sync, retrySync, reset } = useLessonNineProgress();
  const { preferences: lessonPreferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [focusedStep, setFocusedStep] = useState<LessonNineStepId | null>(null);
  // Session-only: what was pressed or chosen on a screen is never saved, only which steps are done.
  const [pressedKeys, setPressedKeys] = useState<readonly number[]>([]);
  const [up, setUp] = useState(initialMove);
  const [down, setDown] = useState(initialMove);
  const [introPredicted, setIntroPredicted] = useState(false);
  const [lowerPredicted, setLowerPredicted] = useState(false);
  const [edgesPredicted, setEdgesPredicted] = useState(false);
  const [sameAnswered, setSameAnswered] = useState(false);
  const [pairsDone, setPairsDone] = useState(false);
  const [checkedCases, setCheckedCases] = useState<readonly string[]>([]);
  const [controlSolved, setControlSolved] = useState(false);
  const [naturalShown, setNaturalShown] = useState(false);
  const [focusFinishStatus, setFocusFinishStatus] = useState(false);
  const finishStatus = useRef<HTMLDivElement>(null);
  const { route, goTo: openStep } = useLessonRoute('09', lessonNineProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const visibleStep = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isCompleted = (step: LessonNineStepId) => progress.completedStepIds.includes(step);

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

  const completeStep = useCallback((step: LessonNineStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonNineStepId>([...current.completedStepIds, step])) }), [setProgress]);
  const goTo = (step: LessonNineStepId) => {
    setPressedKeys([]);
    setFocusedStep(step);
    openStep(step);
  };
  // «Далі» both finishes the screen and opens the next one.
  const advance = (from: LessonNineStepId, to: LessonNineStepId) => {
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
    if (visibleStep === 'raise') setUp((current) => applyMovePress(current, key, 'up'));
    if (visibleStep === 'lower') setDown((current) => applyMovePress(current, key, 'down'));
  };

  const names = keyNames(up.found, visibleStep === 'raise' ? [] : down.found);
  const captions = toCaptions(names);
  // Flats stay hidden until `lower`; the sharps found on `raise` are the trail there.
  const trail = visibleStep === 'lower' ? up.found.map(sharpOf) : [];
  const foundKeys = { up: up.found.map(sharpOf), down: down.found.map(flatOf) };

  const answerSame = (_choiceId: string, isCorrect: boolean) => {
    if (!isCorrect) return;
    setSameAnswered(true);
    if (pairsDone) completeStep('same');
  };
  const solvePairs = () => {
    setPairsDone(true);
    if (sameAnswered) completeStep('same');
  };
  const checkCase = (name: string) => setCheckedCases((current) => current.includes(name) ? current : [...current, name]);
  const answerControl = (_choiceId: string, isCorrect: boolean) => {
    if (!isCorrect) return;
    setControlSolved(true);
    completeStep('edges');
  };

  const passCheckpoint = useCallback(() => setProgress((current) => ({
    ...current,
    checkpointPassed: true,
    completedStepIds: Array.from(new Set<LessonNineStepId>([...current.completedStepIds, 'checkpoint'])),
  })), [setProgress]);

  const finishLesson = () => {
    setFocusFinishStatus(true);
    setProgress((current) => ({
      ...current,
      completedAt: current.completedAt ?? new Date().toISOString(),
      completedStepIds: Array.from(new Set<LessonNineStepId>([...current.completedStepIds, 'complete'])),
    }));
  };

  const audioMessage = audio.status === 'unavailable'
    ? lessonNineContent.preferences.audioUnavailable
    : audio.status === 'blocked'
      ? lessonNineContent.preferences.audioBlocked
      : null;

  const restartLesson = useCallback(async () => {
    await reset();
    setPressedKeys([]);
    setUp(initialMove);
    setDown(initialMove);
    setIntroPredicted(false);
    setLowerPredicted(false);
    setEdgesPredicted(false);
    setSameAnswered(false);
    setPairsDone(false);
    setCheckedCases([]);
    setControlSolved(false);
    setNaturalShown(false);
    setFocusedStep('intro');
    openStep('intro');
  }, [reset, openStep]);

  return {
    restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled: lessonPreferences.audioEnabled,
    focusedStep, visibleStep, isCompleted, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus,
    pressedKeys, pressKey, captions, names, trail, foundKeys, up, down,
    introPredicted: introPredicted || isCompleted('intro'), answerIntro: () => setIntroPredicted(true),
    lowerPredicted: lowerPredicted || isCompleted('lower'), answerLower: () => setLowerPredicted(true),
    edgesPredicted: edgesPredicted || isCompleted('edges'), answerEdges: () => setEdgesPredicted(true),
    sameAnswered: sameAnswered || isCompleted('same'), pairsDone: pairsDone || isCompleted('same'), answerSame, solvePairs,
    checkedCases: isCompleted('edges') ? [...edgeCases] : checkedCases, checkCase,
    controlSolved: controlSolved || isCompleted('edges'), answerControl,
    naturalShown, showNatural: () => setNaturalShown(true),
    passCheckpoint,
  };
}
