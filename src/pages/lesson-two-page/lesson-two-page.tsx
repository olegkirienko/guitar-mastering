import { Button } from '@/components/base/buttons/button';
import { ArrowLeft, ArrowRight, CheckCircle } from '@untitledui/icons';
import { Link } from 'react-router';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { FrequencyComparison } from '@/components/lesson/frequency-comparison/frequency-comparison';
import { FrequencyPitchCheckpoint } from '@/components/lesson/frequency-pitch-checkpoint/frequency-pitch-checkpoint';
import { FrequencyPitchLab } from '@/components/lesson/frequency-pitch-lab/frequency-pitch-lab';
import { GuitarApplication } from '@/components/lesson/guitar-application/guitar-application';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { PitchLoudnessComparison } from '@/components/lesson/pitch-loudness-comparison/pitch-loudness-comparison';
import { SameStringPitchExperience } from '@/components/lesson/same-string-pitch-experience/same-string-pitch-experience';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { stopByStep, primaryButton } from '@/pages/lesson-two-page/constants';
import { useLessonTwoPage } from '@/pages/lesson-two-page/hooks/use-lesson-two-page';

export function LessonTwoPage() {
  const { progress, setProgress, storageAvailable, sync, accountState, importGuestProgress, confirmGuestImport, keepGuestProgressSeparate, clearCurrentAccountCache, retrySync, preferredPath, stringReady, setStringReady, focusedStep, prefersReducedMotion, reflection, setReflection, finishStatus, intro, string, preferences, repeats, frequency, loudness, guitar, checkpoint, complete, visibleStep, staticMode, isCompleted, audio, completeStep, goTo, begin, toggleAudio, completeRepeats, completeFrequency, completeLoudness, completeGuitar, passCheckpoint, finishLesson, audioMessage } = useLessonTwoPage();
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
        <Button color="secondary" size="lg" isDisabled={prefersReducedMotion} aria-pressed={staticMode} onClick={() => setProgress((current) => ({ ...current, prefersStatic: !current.prefersStatic }))}>{prefersReducedMotion ? preferences.motionSystemLabel : staticMode ? preferences.motionStaticLabel : preferences.motionAnimatedLabel}</Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 text-sm leading-6 text-gray-600">
          <p className="font-semibold text-gray-950">{preferences.audioTitle}</p>
          <p>{preferences.audioNote}</p>
        </div>
        <Button color="secondary" size="lg" aria-pressed={progress.audioEnabled} onClick={toggleAudio}>{progress.audioEnabled ? preferences.audioOnLabel : preferences.audioOffLabel}</Button>
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
        <Button size="lg" iconTrailing={ArrowRight} onClick={() => begin('guitar')}>{intro.guitarLabel}</Button>
        <Button color="secondary" size="lg" onClick={() => begin('virtual')}>{intro.virtualLabel}</Button>
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
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('intro')}>{string.backLabel}</Button>
        {isCompleted('string') && <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('repeats')}>{string.nextLabel}</Button>}
      </div>
    </div>}

    {visibleStep === 'repeats' && <div className="space-y-5">
      <LessonStep title={repeats.title} intro={repeats.instruction} shouldFocus={focusedStep === 'repeats'}>
        <FrequencyComparison content={repeats} staticMode={staticMode} audio={audio} onComplete={completeRepeats} />
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('string')}>{repeats.backLabel}</Button>
        {isCompleted('repeats') && <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('frequency')}>{repeats.nextLabel}</Button>}
      </div>
    </div>}

    {visibleStep === 'frequency' && <div className="space-y-5">
      <LessonStep title={frequency.title} intro={frequency.instruction} shouldFocus={focusedStep === 'frequency'}>
        <FrequencyPitchLab content={frequency} audio={audio} onComplete={completeFrequency} />
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('repeats')}>{frequency.backLabel}</Button>
        {isCompleted('frequency') && <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('loudness')}>{frequency.nextLabel}</Button>}
      </div>
    </div>}

    {visibleStep === 'loudness' && <div className="space-y-5">
      <LessonStep title={loudness.title} intro={loudness.instruction} shouldFocus={focusedStep === 'loudness'}>
        <PitchLoudnessComparison content={loudness} audio={audio} onComplete={completeLoudness} />
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('frequency')}>{loudness.backLabel}</Button>
        {isCompleted('loudness') && <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('guitar')}>{loudness.nextLabel}</Button>}
      </div>
    </div>}

    {visibleStep === 'guitar' && <div className="space-y-5">
      <LessonStep title={guitar.title} intro={guitar.instruction} shouldFocus={focusedStep === 'guitar'}>
        <GuitarApplication content={guitar} preferredPath={preferredPath} audio={audio} completed={isCompleted('guitar')} onComplete={completeGuitar} />
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('loudness')}>{guitar.backLabel}</Button>
        {isCompleted('guitar') && <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('checkpoint')}>{guitar.nextLabel}</Button>}
      </div>
    </div>}

    {visibleStep === 'checkpoint' && <div className="space-y-5">
      <LessonStep title={checkpoint.title} intro={checkpoint.instruction} shouldFocus={focusedStep === 'checkpoint'}>
        <FrequencyPitchCheckpoint content={checkpoint} passed={progress.checkpointPassed} onPass={passCheckpoint} />
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('guitar')}>{checkpoint.backLabel}</Button>
        {progress.checkpointPassed && <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('complete')}>{checkpoint.nextLabel}</Button>}
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
          <Button size="lg" onClick={finishLesson}>{complete.finishLabel}</Button>
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
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('checkpoint')}>{complete.backLabel}</Button>
        {progress.completedAt !== null && <Link to="/" className={primaryButton}>{complete.backToCourse}</Link>}
      </div>
    </div>}
  </LessonShell>;
}
