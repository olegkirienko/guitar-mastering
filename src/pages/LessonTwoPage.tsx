import { ArrowLeft, ArrowRight, CheckCircle } from '@untitledui/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ChoiceQuestion } from '@/components/lesson/ChoiceQuestion';
import { FrequencyComparison } from '@/components/lesson/FrequencyComparison';
import { FrequencyPitchCheckpoint } from '@/components/lesson/FrequencyPitchCheckpoint';
import { FrequencyPitchLab } from '@/components/lesson/FrequencyPitchLab';
import { GuitarApplication } from '@/components/lesson/GuitarApplication';
import { LessonProgressPanel } from '@/components/lesson/LessonProgressPanel';
import { LessonShell } from '@/components/lesson/LessonShell';
import { LessonStep } from '@/components/lesson/LessonStep';
import { PitchLoudnessComparison } from '@/components/lesson/PitchLoudnessComparison';
import { SameStringPitchExperience, type PitchPath } from '@/components/lesson/SameStringPitchExperience';
import { useLessonTwoAudio } from '@/components/lesson/useLessonTwoAudio';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import type { LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02/types';
import { useLessonTwoProgress } from '@/progress/use-lesson-two-progress';

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
  const [reflection, setReflection] = useState('');
  const [focusFinishStatus, setFocusFinishStatus] = useState(false);
  const finishStatus = useRef<HTMLDivElement>(null);
  const { intro, string, preferences, repeats, frequency, loudness, guitar, checkpoint, complete } = lessonTwoContent;
  const visibleStep = progress.currentStepId;
  const staticMode = prefersReducedMotion || progress.prefersStatic;
  const isCompleted = (step: LessonTwoStepId) => progress.completedStepIds.includes(step);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // «Завершити урок» disappears once pressed, so focus moves to the result.
  useEffect(() => {
    if (!focusFinishStatus) return;
    setFocusFinishStatus(false);
    finishStatus.current?.focus();
  }, [focusFinishStatus]);

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
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => goTo('frequency')} className={backButton}><ArrowLeft className="size-4" aria-hidden="true" />{loudness.backLabel}</button>
        {isCompleted('loudness') && <button type="button" onClick={() => goTo('guitar')} className={primaryButton}>{loudness.nextLabel}<ArrowRight className="size-4" aria-hidden="true" /></button>}
      </div>
    </div>}

    {visibleStep === 'guitar' && <div className="space-y-5">
      <LessonStep title={guitar.title} intro={guitar.instruction} shouldFocus={focusedStep === 'guitar'}>
        <GuitarApplication content={guitar} preferredPath={preferredPath} audio={audio} completed={isCompleted('guitar')} onComplete={completeGuitar} />
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => goTo('loudness')} className={backButton}><ArrowLeft className="size-4" aria-hidden="true" />{guitar.backLabel}</button>
        {isCompleted('guitar') && <button type="button" onClick={() => goTo('checkpoint')} className={primaryButton}>{guitar.nextLabel}<ArrowRight className="size-4" aria-hidden="true" /></button>}
      </div>
    </div>}

    {visibleStep === 'checkpoint' && <div className="space-y-5">
      <LessonStep title={checkpoint.title} intro={checkpoint.instruction} shouldFocus={focusedStep === 'checkpoint'}>
        <FrequencyPitchCheckpoint content={checkpoint} passed={progress.checkpointPassed} onPass={passCheckpoint} />
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => goTo('guitar')} className={backButton}><ArrowLeft className="size-4" aria-hidden="true" />{checkpoint.backLabel}</button>
        {progress.checkpointPassed && <button type="button" onClick={() => goTo('complete')} className={primaryButton}>{checkpoint.nextLabel}<ArrowRight className="size-4" aria-hidden="true" /></button>}
      </div>
    </div>}

    {visibleStep === 'complete' && <div className="space-y-5">
      <LessonStep title={complete.title} shouldFocus={focusedStep === 'complete'}>
        <ul className="space-y-2 text-gray-700">
          {complete.discoveries.map((discovery) => <li key={discovery} className="flex gap-2"><CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" />{discovery}</li>)}
        </ul>
        <ul className="mt-4 space-y-1 rounded-lg bg-gray-50 p-4 text-sm font-medium text-gray-950">
          {complete.chains.map((chain) => <li key={chain}>{chain}</li>)}
        </ul>
        {progress.completedAt === null && <div className="mt-5 space-y-3">
          <label htmlFor="lesson-two-reflection" className="block text-sm text-gray-700">{complete.reflectionLabel}</label>
          <textarea id="lesson-two-reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-950 outline-none focus-visible:ring-2 focus-visible:ring-brand-600" />
          <button type="button" onClick={finishLesson} className={primaryButton}>{complete.finishLabel}</button>
        </div>}
        <div ref={finishStatus} tabIndex={-1} role="status" data-testid="finish-status" className="mt-5 space-y-3 outline-none empty:mt-0">
          {progress.completedAt !== null && <>
            <p className="font-semibold text-gray-950">{complete.finished}</p>
            <p className="text-gray-700">{complete.feedback}</p>
          </>}
        </div>
        {progress.completedAt !== null && <section aria-labelledby="lesson-two-bridge" className="mt-6 rounded-lg border border-brand-200 bg-brand-25 p-5">
          <h3 id="lesson-two-bridge" className="font-semibold text-gray-950">{complete.bridgeTitle}</h3>
          <p className="mt-2 text-lg font-medium text-gray-950">{complete.bridge}</p>
          <p className="mt-2 text-sm text-gray-600">{complete.bridgeNote}</p>
        </section>}
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => goTo('checkpoint')} className={backButton}><ArrowLeft className="size-4" aria-hidden="true" />{complete.backLabel}</button>
        {progress.completedAt !== null && <Link to="/" className={primaryButton}>{complete.backToCourse}</Link>}
      </div>
    </div>}
  </LessonShell>;
}
