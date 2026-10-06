import { ArrowRight, CheckCircle } from '@untitledui/icons';
import { Link } from 'react-router';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { FrequencyComparison } from '@/components/lesson/frequency-comparison/frequency-comparison';
import { FrequencyPitchCheckpoint } from '@/components/lesson/frequency-pitch-checkpoint/frequency-pitch-checkpoint';
import { FrequencyPitchLab } from '@/components/lesson/frequency-pitch-lab/frequency-pitch-lab';
import { GuitarApplication } from '@/components/lesson/guitar-application/guitar-application';
import { LessonAudioToggle } from '@/components/lesson/lesson-audio-toggle/lesson-audio-toggle';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStepNav } from '@/components/lesson/lesson-step-nav/lesson-step-nav';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { PitchLoudnessComparison } from '@/components/lesson/pitch-loudness-comparison/pitch-loudness-comparison';
import { SameStringPitchExperience } from '@/components/lesson/same-string-pitch-experience/same-string-pitch-experience';
import { lessonTwoContent } from '@/data/lessons/stage-01-lesson-02/constants';
import { primaryButton } from '@/pages/lesson-two-page/constants';
import { useLessonTwoPage } from '@/pages/lesson-two-page/hooks/use-lesson-two-page';

export function LessonTwoPage() {
  const { route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled, preferredPath, stringReady, setStringReady, focusedStep, reflection, setReflection, finishStatus, intro, string, repeats, frequency, loudness, guitar, checkpoint, complete, visibleStep, staticMode, isCompleted, audio, completeStep, goTo, begin, toggleAudio, completeRepeats, completeFrequency, completeLoudness, completeGuitar, passCheckpoint, finishLesson, audioMessage } = useLessonTwoPage();
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  return <LessonShell {...lessonTwoContent} steps={route.steps} currentStepId={route.stepId}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
    {visibleStep === 'intro' && <LessonStep title={intro.title} intro={intro.invitation} shouldFocus={focusedStep === 'intro'}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-secondary" aria-label="Що ми вже знаємо з уроку 1">
        {intro.chain.map((link, index) => <li key={link} className="flex items-center gap-2">
          {index > 0 && <ArrowRight className="size-4 text-fg-quaternary" aria-hidden="true" />}
          <span className="rounded-md bg-tertiary px-2 py-1">{link}</span>
        </li>)}
      </ol>
      <div className="mt-5 rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
        <p className="text-lg font-medium text-primary">{intro.question}</p>
        <p className="mt-2 text-sm text-tertiary">{intro.hypothesisNote}</p>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <LessonStepNav next={{ label: intro.guitarLabel, onClick: () => begin('guitar') }} />
        <Button color="secondary" size="lg" onClick={() => begin('virtual')}>{intro.virtualLabel}</Button>
      </div>
      <p className="mt-4 text-sm text-tertiary">{intro.reassurance}</p>
    </LessonStep>}

    {visibleStep === 'string' && <div className="space-y-5">
      <LessonStep title={string.title} intro={string.instruction} shouldFocus={focusedStep === 'string'}>
        <SameStringPitchExperience content={string} preferredPath={preferredPath} audio={audio} onReady={() => setStringReady(true)} />
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
        {(stringReady || isCompleted('string')) && <div className="mt-6">
          <ChoiceQuestion
            question={string.question}
            choices={string.choices}
            correctChoiceId={string.correctChoiceId}
            onCheck={(_choiceId, isCorrect) => { if (isCorrect) completeStep('string'); }}
          />
        </div>}
      </LessonStep>
      <LessonStepNav back={{ label: string.backLabel, onClick: () => goTo('intro') }} next={isCompleted('string') ? { label: string.nextLabel, onClick: () => goTo('repeats') } : undefined} />
    </div>}

    {visibleStep === 'repeats' && <div className="space-y-5">
      <LessonStep title={repeats.title} intro={repeats.instruction} shouldFocus={focusedStep === 'repeats'}>
        <FrequencyComparison content={repeats} staticMode={staticMode} audio={audio} onComplete={completeRepeats} />
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
      </LessonStep>
      <LessonStepNav back={{ label: repeats.backLabel, onClick: () => goTo('string') }} next={isCompleted('repeats') ? { label: repeats.nextLabel, onClick: () => goTo('frequency') } : undefined} />
    </div>}

    {visibleStep === 'frequency' && <div className="space-y-5">
      <LessonStep title={frequency.title} intro={frequency.instruction} shouldFocus={focusedStep === 'frequency'}>
        <FrequencyPitchLab content={frequency} audio={audio} onComplete={completeFrequency} />
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
      </LessonStep>
      <LessonStepNav back={{ label: frequency.backLabel, onClick: () => goTo('repeats') }} next={isCompleted('frequency') ? { label: frequency.nextLabel, onClick: () => goTo('loudness') } : undefined} />
    </div>}

    {visibleStep === 'loudness' && <div className="space-y-5">
      <LessonStep title={loudness.title} intro={loudness.instruction} shouldFocus={focusedStep === 'loudness'}>
        <PitchLoudnessComparison content={loudness} audio={audio} onComplete={completeLoudness} />
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
      </LessonStep>
      <LessonStepNav back={{ label: loudness.backLabel, onClick: () => goTo('frequency') }} next={isCompleted('loudness') ? { label: loudness.nextLabel, onClick: () => goTo('guitar') } : undefined} />
    </div>}

    {visibleStep === 'guitar' && <div className="space-y-5">
      <LessonStep title={guitar.title} intro={guitar.instruction} shouldFocus={focusedStep === 'guitar'}>
        <GuitarApplication content={guitar} preferredPath={preferredPath} audio={audio} completed={isCompleted('guitar')} onComplete={completeGuitar} />
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
      </LessonStep>
      <LessonStepNav back={{ label: guitar.backLabel, onClick: () => goTo('loudness') }} next={isCompleted('guitar') ? { label: guitar.nextLabel, onClick: () => goTo('checkpoint') } : undefined} />
    </div>}

    {visibleStep === 'checkpoint' && <div className="space-y-5">
      <LessonStep title={checkpoint.title} intro={checkpoint.instruction} shouldFocus={focusedStep === 'checkpoint'}>
        <FrequencyPitchCheckpoint content={checkpoint} passed={progress.checkpointPassed} onPass={passCheckpoint} />
      </LessonStep>
      <LessonStepNav back={{ label: checkpoint.backLabel, onClick: () => goTo('guitar') }} next={progress.checkpointPassed ? { label: checkpoint.nextLabel, onClick: () => goTo('complete') } : undefined} />
    </div>}

    {visibleStep === 'complete' && <div className="space-y-5">
      <LessonStep title={complete.title} shouldFocus={focusedStep === 'complete'}>
        <ul className="space-y-2 text-secondary">
          {complete.discoveries.map((discovery) => <li key={discovery} className="flex gap-2"><CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" />{discovery}</li>)}
        </ul>
        <ul className="mt-4 space-y-1 rounded-lg bg-secondary p-4 text-sm font-medium text-primary">
          {complete.chains.map((chain) => <li key={chain}>{chain}</li>)}
        </ul>
        {progress.completedAt === null && <div className="mt-5 space-y-3">
          <label htmlFor="lesson-two-reflection" className="block text-sm text-secondary">{complete.reflectionLabel}</label>
          <textarea id="lesson-two-reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} rows={2} className="w-full rounded-lg border border-primary p-3 text-sm text-primary outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" />
          <Button size="lg" onClick={finishLesson}>{complete.finishLabel}</Button>
        </div>}
        <div ref={finishStatus} tabIndex={-1} role="status" data-testid="finish-status" className="mt-5 space-y-3 outline-none empty:mt-0">
          {progress.completedAt !== null && <>
            <p className="font-semibold text-primary">{complete.finished}</p>
            <p className="text-secondary">{complete.feedback}</p>
          </>}
        </div>
        {progress.completedAt !== null && <section aria-labelledby="lesson-two-bridge" className="mt-6 rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
          <h3 id="lesson-two-bridge" className="font-semibold text-primary">{complete.bridgeTitle}</h3>
          <p className="mt-2 text-lg font-medium text-primary">{complete.bridge}</p>
          <p className="mt-2 text-sm text-tertiary">{complete.bridgeNote}</p>
        </section>}
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <LessonStepNav back={{ label: complete.backLabel, onClick: () => goTo('checkpoint') }} />
        {progress.completedAt !== null && <Link to="/" className={primaryButton}>{complete.backToCourse}</Link>}
      </div>
    </div>}
  </LessonShell>;
}
