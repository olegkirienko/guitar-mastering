import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { useCallback, useEffect, useState } from 'react';
import { ChoiceQuestion } from '@/components/lesson/ChoiceQuestion';
import { FrequencyComparison } from '@/components/lesson/FrequencyComparison';
import { FrequencyPitchLab } from '@/components/lesson/FrequencyPitchLab';
import { LessonProgressPanel } from '@/components/lesson/LessonProgressPanel';
import { LessonShell } from '@/components/lesson/LessonShell';
import { LessonStep } from '@/components/lesson/LessonStep';
import { PitchLoudnessComparison } from '@/components/lesson/PitchLoudnessComparison';
import { SameStringPitchExperience, type PitchPath } from '@/components/lesson/SameStringPitchExperience';
import { useLessonTwoAudio } from '@/components/lesson/useLessonTwoAudio';
import { lessonTwoContent, type LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02';
import { useLessonTwoProgress } from '@/progress/useLessonTwoProgress';

const stopByStep: Record<LessonTwoStepId, number> = {
  intro: 1,
  string: 1,
  repeats: 2,
  frequency: 3,
  loudness: 3,
  guitar: 4,
  checkpoint: 5,
  complete: 5,
};

// Screens implemented so far; later step IDs render the last implemented screen.
const implementedSteps: readonly LessonTwoStepId[] = ['intro', 'string', 'repeats', 'frequency', 'loudness'];

const primaryButton = 'inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';
const backButton = 'inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';

export function LessonTwoPage() {
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
  } = useLessonTwoProgress();
  const [preferredPath, setPreferredPath] = useState<PitchPath>('guitar');
  const [stringReady, setStringReady] = useState(false);
  const [focusedStep, setFocusedStep] = useState<LessonTwoStepId | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { intro, string, preferences, repeats, frequency, loudness } = lessonTwoContent;
  const visibleStep = implementedSteps.includes(progress.currentStepId) ? progress.currentStepId : 'loudness';
  const staticMode = prefersReducedMotion || progress.prefersStatic;
  const isCompleted = (step: LessonTwoStepId) => progress.completedStepIds.includes(step);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    setProgress((current) => current.audioEnabled === enabled ? current : { ...current, audioEnabled: enabled });
  }, [setProgress]);
  const audio = useLessonTwoAudio(progress.audioEnabled, setAudioEnabled, visibleStep);

  const completeStep = useCallback((step: LessonTwoStepId) => setProgress((current) => current.completedStepIds.includes(step)
    ? current
    : { ...current, completedStepIds: Array.from(new Set<LessonTwoStepId>([...current.completedStepIds, step])) }), [setProgress]);
  const goTo = (step: LessonTwoStepId) => {
    setFocusedStep(step);
    setProgress((current) => ({ ...current, currentStepId: step }));
  };
  const begin = (path: PitchPath) => {
    setPreferredPath(path);
    setFocusedStep('string');
    setProgress((current) => ({
      ...current,
      currentStepId: 'string',
      completedStepIds: Array.from(new Set<LessonTwoStepId>([...current.completedStepIds, 'intro'])),
    }));
  };
  const toggleAudio = () => {
    if (progress.audioEnabled) setAudioEnabled(false);
    else void audio.enable();
  };
  const completeRepeats = useCallback(() => completeStep('repeats'), [completeStep]);
  const completeFrequency = useCallback(() => completeStep('frequency'), [completeStep]);
  const completeLoudness = useCallback(() => completeStep('loudness'), [completeStep]);

  const audioMessage = audio.status === 'unavailable'
    ? preferences.audioUnavailable
    : audio.status === 'blocked'
      ? preferences.audioBlocked
      : null;

  return <LessonShell {...lessonTwoContent} currentStop={stopByStep[visibleStep]} backTo="/">
    <LessonProgressPanel
      storageAvailable={storageAvailable}
      sync={sync}
      accountState={accountState}
      importGuestProgress={importGuestProgress}
      confirmGuestImport={confirmGuestImport}
      keepGuestProgressSeparate={keepGuestProgressSeparate}
      clearCurrentAccountCache={clearCurrentAccountCache}
      retrySync={retrySync}
    />
    <div className="mb-5 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 sm:grid-cols-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 text-sm leading-6 text-gray-600">
          <p className="font-semibold text-gray-950">{preferences.motionTitle}</p>
          <p>{prefersReducedMotion ? preferences.motionSystem : preferences.motionManual}</p>
        </div>
        <button type="button" disabled={prefersReducedMotion} aria-pressed={staticMode} onClick={() => setProgress((current) => ({ ...current, prefersStatic: !current.prefersStatic }))} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
          {prefersReducedMotion ? preferences.motionSystemLabel : staticMode ? preferences.motionStaticLabel : preferences.motionAnimatedLabel}
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 text-sm leading-6 text-gray-600">
          <p className="font-semibold text-gray-950">{preferences.audioTitle}</p>
          <p>{preferences.audioNote}</p>
        </div>
        <button type="button" aria-pressed={progress.audioEnabled} onClick={toggleAudio} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
          {progress.audioEnabled ? preferences.audioOnLabel : preferences.audioOffLabel}
        </button>
      </div>
      <div aria-live="polite" className="text-sm text-gray-700 sm:col-span-2">{audioMessage && <p>{audioMessage}</p>}</div>
    </div>

    {visibleStep === 'intro' && <LessonStep title={intro.title} intro={intro.invitation} shouldFocus={focusedStep === 'intro'}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-700" aria-label="Що ми вже знаємо з уроку 1">
        {intro.chain.map((link, index) => <li key={link} className="flex items-center gap-2">
          {index > 0 && <ArrowRight className="size-4 text-gray-400" aria-hidden="true" />}
          <span className="rounded-md bg-gray-100 px-2 py-1">{link}</span>
        </li>)}
      </ol>
      <div className="mt-5 rounded-lg border border-brand-200 bg-brand-25 p-5">
        <p className="text-lg font-medium text-gray-950">{intro.question}</p>
        <p className="mt-2 text-sm text-gray-600">{intro.hypothesisNote}</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => begin('guitar')} className={primaryButton}>
          {intro.guitarLabel}<ArrowRight className="size-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => begin('virtual')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-600 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 outline-none hover:bg-brand-25 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
          {intro.virtualLabel}
        </button>
      </div>
      <p className="mt-4 text-sm text-gray-600">{intro.reassurance}</p>
    </LessonStep>}

    {visibleStep === 'string' && <div className="space-y-5">
      <LessonStep title={string.title} intro={string.instruction} shouldFocus={focusedStep === 'string'}>
        <SameStringPitchExperience content={string} preferredPath={preferredPath} audio={audio} onReady={() => setStringReady(true)} />
        {(stringReady || isCompleted('string')) && <div className="mt-6">
          <ChoiceQuestion
            question={string.question}
            choices={string.choices}
            correctChoiceId={string.correctChoiceId}
            onCheck={(_choiceId, isCorrect) => { if (isCorrect) completeStep('string'); }}
          />
        </div>}
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => goTo('intro')} className={backButton}><ArrowLeft className="size-4" aria-hidden="true" />{string.backLabel}</button>
        {isCompleted('string') && <button type="button" onClick={() => goTo('repeats')} className={primaryButton}>{string.nextLabel}<ArrowRight className="size-4" aria-hidden="true" /></button>}
      </div>
    </div>}

    {visibleStep === 'repeats' && <div className="space-y-5">
      <LessonStep title={repeats.title} intro={repeats.instruction} shouldFocus={focusedStep === 'repeats'}>
        <FrequencyComparison content={repeats} staticMode={staticMode} audio={audio} onComplete={completeRepeats} />
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => goTo('string')} className={backButton}><ArrowLeft className="size-4" aria-hidden="true" />{repeats.backLabel}</button>
        {isCompleted('repeats') && <button type="button" onClick={() => goTo('frequency')} className={primaryButton}>{repeats.nextLabel}<ArrowRight className="size-4" aria-hidden="true" /></button>}
      </div>
    </div>}

    {visibleStep === 'frequency' && <div className="space-y-5">
      <LessonStep title={frequency.title} intro={frequency.instruction} shouldFocus={focusedStep === 'frequency'}>
        <FrequencyPitchLab content={frequency} audio={audio} onComplete={completeFrequency} />
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => goTo('repeats')} className={backButton}><ArrowLeft className="size-4" aria-hidden="true" />{frequency.backLabel}</button>
        {isCompleted('frequency') && <button type="button" onClick={() => goTo('loudness')} className={primaryButton}>{frequency.nextLabel}<ArrowRight className="size-4" aria-hidden="true" /></button>}
      </div>
    </div>}

    {visibleStep === 'loudness' && <div className="space-y-5">
      <LessonStep title={loudness.title} intro={loudness.instruction} shouldFocus={focusedStep === 'loudness'}>
        <PitchLoudnessComparison content={loudness} audio={audio} onComplete={completeLoudness} />
      </LessonStep>
      <button type="button" onClick={() => goTo('frequency')} className={backButton}><ArrowLeft className="size-4" aria-hidden="true" />{loudness.backLabel}</button>
    </div>}
  </LessonShell>;
}
