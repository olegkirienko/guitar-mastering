import { useEffect, useState } from 'react';
import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01/types';
import { useLessonOneProgress } from '@/progress/use-lesson-one-progress';

export function useLessonOnePage() {
  const {
    progress,
    setProgress,
    storageAvailable,
    sync,
    accountState,
    importGuestProgress,
    confirmGuestImport,
    keepGuestProgressSeparate,
    clearCurrentAccountCache,
    retrySync,
  } = useLessonOneProgress();
  const [shouldFocusIntro, setShouldFocusIntro] = useState(false);
  const [shouldFocusString, setShouldFocusString] = useState(false);
  const [shouldFocusAir, setShouldFocusAir] = useState(false);
  const [shouldFocusCheckpoint, setShouldFocusCheckpoint] = useState(false);
  const [shouldFocusComplete, setShouldFocusComplete] = useState(false);
  const [reflection, setReflection] = useState('');
  const [explainedAloud, setExplainedAloud] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isStringStep = progress.currentStepId === 'string';
  const isAirStep = progress.currentStepId === 'air';
  const isCheckpointStep = progress.currentStepId === 'checkpoint';
  const isCompleteStep = progress.currentStepId === 'complete';
  const staticMode = prefersReducedMotion || progress.prefersStatic;
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);
  const begin = () => { setShouldFocusIntro(false); setShouldFocusString(true); setProgress((current) => ({ ...current, currentStepId: 'string', completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'intro'])) })); };

  const openAirLab = () => { setShouldFocusString(false); setShouldFocusAir(true); setProgress((current) => ({ ...current, currentStepId: 'air' })); };
  const openCheckpoint = () => { setShouldFocusAir(false); setShouldFocusCheckpoint(true); setProgress((current) => ({ ...current, currentStepId: 'checkpoint' })); };
  const openCompletion = () => { setShouldFocusCheckpoint(false); setShouldFocusComplete(true); setProgress((current) => ({ ...current, currentStepId: 'complete' })); };
  const finishLesson = () => setProgress((current) => ({
    ...current,
    completedAt: current.completedAt ?? new Date().toISOString(),
    completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'complete'])),
  }));

  return { progress, setProgress, storageAvailable, sync, accountState, importGuestProgress, confirmGuestImport, keepGuestProgressSeparate, clearCurrentAccountCache, retrySync, shouldFocusIntro, setShouldFocusIntro, shouldFocusString, setShouldFocusString, shouldFocusAir, setShouldFocusAir, shouldFocusCheckpoint, setShouldFocusCheckpoint, shouldFocusComplete, setShouldFocusComplete, reflection, setReflection, explainedAloud, setExplainedAloud, prefersReducedMotion, isStringStep, isAirStep, isCheckpointStep, isCompleteStep, staticMode, begin, openAirLab, openCheckpoint, openCompletion, finishLesson };
}
