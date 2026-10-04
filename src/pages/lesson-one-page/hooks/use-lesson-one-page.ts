import { useCallback, useEffect, useState } from 'react';
import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01/types';
import { useAuth } from '@/hooks/use-auth';
import { useLessonRoute } from '@/hooks/use-lesson-route/use-lesson-route';
import { lessonOneProgressAdapter } from '@/progress/lesson-one/lesson-one';
import { useLessonOneProgress } from '@/progress/use-lesson-one-progress';

export function useLessonOnePage() {
  const {
    progress,
    setProgress,
    loaded,
    loadFailed,
    sync,
    retrySync,
  } = useLessonOneProgress();
  const { preferences, preferencesSaveFailed, updatePreferences } = useAuth();
  const [shouldFocusIntro, setShouldFocusIntro] = useState(false);
  const [shouldFocusString, setShouldFocusString] = useState(false);
  const [shouldFocusAir, setShouldFocusAir] = useState(false);
  const [shouldFocusCheckpoint, setShouldFocusCheckpoint] = useState(false);
  const [shouldFocusComplete, setShouldFocusComplete] = useState(false);
  const [reflection, setReflection] = useState('');
  const [explainedAloud, setExplainedAloud] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { route, goTo } = useLessonRoute('01', lessonOneProgressAdapter, { progress, loaded, loadFailed, retrySync, setProgress });
  const stepId = route.kind === 'ready' ? route.stepId : progress.currentStepId;
  const isStringStep = stepId === 'string';
  const isAirStep = stepId === 'air';
  const isCheckpointStep = stepId === 'checkpoint';
  const isCompleteStep = stepId === 'complete';
  const staticMode = prefersReducedMotion || preferences.prefersStatic;
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);
  const setAudioEnabled = useCallback((audioEnabled: boolean) => { void updatePreferences({ audioEnabled }); }, [updatePreferences]);
  const toggleStatic = () => { void updatePreferences({ prefersStatic: !preferences.prefersStatic }); };
  const begin = () => { setShouldFocusIntro(false); setShouldFocusString(true); setProgress((current) => ({ ...current, currentStepId: 'string', completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'intro'])) })); goTo('string'); };

  const openAirLab = () => { setShouldFocusString(false); setShouldFocusAir(true); goTo('air'); };
  const openCheckpoint = () => { setShouldFocusAir(false); setShouldFocusCheckpoint(true); goTo('checkpoint'); };
  const openCompletion = () => { setShouldFocusCheckpoint(false); setShouldFocusComplete(true); goTo('complete'); };
  const finishLesson = () => setProgress((current) => ({
    ...current,
    completedAt: current.completedAt ?? new Date().toISOString(),
    completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'complete'])),
  }));

  return { route, goTo, progress, setProgress, sync, retrySync, preferencesSaveFailed, audioEnabled: preferences.audioEnabled, setAudioEnabled, toggleStatic, shouldFocusIntro, setShouldFocusIntro, shouldFocusString, setShouldFocusString, shouldFocusAir, setShouldFocusAir, shouldFocusCheckpoint, setShouldFocusCheckpoint, shouldFocusComplete, setShouldFocusComplete, reflection, setReflection, explainedAloud, setExplainedAloud, prefersReducedMotion, isStringStep, isAirStep, isCheckpointStep, isCompleteStep, staticMode, begin, openAirLab, openCheckpoint, openCompletion, finishLesson };
}
