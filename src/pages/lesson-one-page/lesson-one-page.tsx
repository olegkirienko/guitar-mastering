import { CheckCircle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStepNav } from '@/components/lesson/lesson-step-nav/lesson-step-nav';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { SoundPropagationLab } from '@/components/lesson/sound-propagation-lab/sound-propagation-lab';
import { SoundPathCheckpoint } from '@/components/lesson/sound-path-checkpoint/sound-path-checkpoint';
import { VirtualGuitarString } from '@/components/lesson/virtual-guitar-string/virtual-guitar-string';
import { lessonOneContent } from '@/data/lessons/stage-01-lesson-01/constants';
import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01/types';
import { useLessonOnePage } from '@/pages/lesson-one-page/hooks/use-lesson-one-page';

export function LessonOnePage() {
  const { restartLesson, route, goTo, progress, setProgress, sync, retrySync, preferencesSaveFailed, audioEnabled, setAudioEnabled, shouldFocusIntro, setShouldFocusIntro, shouldFocusString, setShouldFocusString, shouldFocusAir, setShouldFocusAir, shouldFocusCheckpoint, setShouldFocusCheckpoint, shouldFocusComplete, setShouldFocusComplete, reflection, setReflection, explainedAloud, setExplainedAloud, isStringStep, isAirStep, isCheckpointStep, isCompleteStep, staticMode, begin, openAirLab, openCheckpoint, openCompletion, finishLesson } = useLessonOnePage();
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  return <LessonShell {...lessonOneContent} steps={route.steps} currentStepId={route.stepId} onRestart={restartLesson}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
    {!isStringStep && !isAirStep && !isCheckpointStep && !isCompleteStep ? <LessonStep title={lessonOneContent.intro.title} intro={lessonOneContent.intro.invitation} shouldFocus={shouldFocusIntro}>
      <div className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5"><p className="text-lg font-medium text-primary">{lessonOneContent.intro.question}</p><p className="mt-3 text-sm leading-6 text-secondary">{lessonOneContent.intro.reassurance}</p></div>
      <div className="mt-6"><LessonStepNav next={{ label: lessonOneContent.intro.startLabel, onClick: begin }} /></div>
      <p className="mt-4 text-sm text-tertiary">Аудіо не запускається автоматично й не потрібне, щоб пройти урок.</p>
    </LessonStep> : isStringStep ? <div className="space-y-5">
      <LessonStep title={lessonOneContent.string.title} intro={lessonOneContent.string.instruction} shouldFocus={shouldFocusString}>
        <VirtualGuitarString observationChoices={lessonOneContent.string.observationChoices} predictionChoices={lessonOneContent.string.predictionChoices} audioEnabled={audioEnabled} staticMode={staticMode} onAudioEnabledChange={setAudioEnabled} onExperimentComplete={() => setProgress((current) => ({ ...current, completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'string'])) }))} />
      </LessonStep>
      <RealWorldExperiment title={lessonOneContent.experiment.title} withGuitar={lessonOneContent.experiment.guitar} withoutGuitar={lessonOneContent.experiment.alternative} safetyNote={lessonOneContent.experiment.safety} />
      <LessonStepNav back={{ label: 'До вступу', onClick: () => { setShouldFocusString(false); setShouldFocusIntro(true); goTo('intro'); } }} next={progress.completedStepIds.includes('string') ? { label: 'Дослідити рух у повітрі', onClick: openAirLab } : undefined} />
    </div> : isAirStep ? <div className="space-y-5">
      <LessonStep title={lessonOneContent.air.title} intro={lessonOneContent.air.instruction} shouldFocus={shouldFocusAir}>
        <SoundPropagationLab content={lessonOneContent.air} staticMode={staticMode} onComplete={() => setProgress((current) => ({ ...current, completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'air'])) }))} />
      </LessonStep>
      <RealWorldExperiment title={lessonOneContent.air.experiment.title} withGuitar={lessonOneContent.air.experiment.guitar} withoutGuitar={lessonOneContent.air.experiment.alternative} safetyNote={lessonOneContent.air.experiment.safety} />
      <LessonStepNav back={{ label: 'До досліду зі струною', onClick: () => { setShouldFocusAir(false); setShouldFocusString(true); goTo('string'); } }} next={progress.completedStepIds.includes('air') ? { label: 'Зібрати шлях звуку', onClick: openCheckpoint } : undefined} />
    </div> : isCheckpointStep ? <div className="space-y-5">
      <LessonStep title={lessonOneContent.checkpoint.title} intro={lessonOneContent.checkpoint.instruction} shouldFocus={shouldFocusCheckpoint}>
        <SoundPathCheckpoint content={lessonOneContent.checkpoint} initiallyPassed={progress.checkpointPassed} onComplete={() => setProgress((current) => ({ ...current, checkpointPassed: true, completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'checkpoint'])) }))} />
      </LessonStep>
      <LessonStepNav back={{ label: 'До досліду з повітрям', onClick: () => { setShouldFocusCheckpoint(false); setShouldFocusAir(true); goTo('air'); } }} next={progress.checkpointPassed ? { label: 'Перейти до підсумку', onClick: openCompletion } : undefined} />
    </div> : <div className="space-y-5">
      <LessonStep key={progress.completedAt ? 'completed' : 'completion'} title={progress.completedAt ? lessonOneContent.completion.completedTitle : lessonOneContent.completion.title} intro={lessonOneContent.completion.instruction} shouldFocus={shouldFocusComplete}>
        <div className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
          <p className="text-sm font-semibold text-brand-secondary">Повний шлях звуку</p>
          <p className="mt-2 text-base font-medium leading-7 text-primary">{lessonOneContent.completion.chain}</p>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-primary">Три відкриття</h3>
          <ul className="mt-3 space-y-2">
            {lessonOneContent.completion.discoveries.map((discovery) => <li key={discovery} className="flex gap-3 text-sm leading-6 text-secondary"><CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" /><span>{discovery}</span></li>)}
          </ul>
        </div>
        {!progress.completedAt ? <div className="mt-7 border-t border-secondary pt-6">
          <label htmlFor="lesson-reflection" className="text-sm font-semibold text-primary">{lessonOneContent.completion.reflectionLabel}</label>
          <textarea id="lesson-reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder={lessonOneContent.completion.reflectionPlaceholder} rows={3} className="mt-2 block w-full rounded-lg border border-primary px-3 py-2 text-sm text-primary outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-utility-brand-200" />
          <p className="mt-2 text-xs leading-5 text-quaternary">Цей текст приватний і не зберігається.</p>
          <Button color="secondary" size="lg" className="mt-4" aria-pressed={explainedAloud} onClick={() => setExplainedAloud((current) => !current)}>{explainedAloud ? 'Пояснення вголос позначено' : lessonOneContent.completion.spokenLabel}</Button>
          <div><Button size="lg" className="mt-6" iconTrailing={CheckCircle} onClick={finishLesson}>{lessonOneContent.completion.finishLabel}</Button></div>
        </div> : <div className="mt-7 rounded-lg border border-success-200 bg-success-50 p-5" role="status" aria-live="polite">
          <p className="font-semibold text-primary">Урок завершено.</p>
          <p className="mt-1 text-sm leading-6 text-secondary">{lessonOneContent.completion.completedMessage}</p>
        </div>}
        <div className="mt-8 border-t border-secondary pt-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-secondary">Питання до наступного уроку</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-primary">{lessonOneContent.completion.bridgeQuestion}</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-hidden="true">
            <div className="flex h-20 items-center rounded-lg border border-secondary bg-secondary px-5"><span className="h-1 w-full rounded-full bg-fg-secondary" /></div>
            <div className="flex h-20 items-center rounded-lg border border-secondary bg-secondary px-5"><span className="h-3 w-full rounded-full bg-fg-secondary" /></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-secondary">{lessonOneContent.completion.bridgeTeaser}</p>
          <p className="mt-3 text-sm leading-6 text-tertiary">{lessonOneContent.completion.experiment}</p>
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: 'До шляху звуку', onClick: () => { setShouldFocusComplete(false); setShouldFocusCheckpoint(true); goTo('checkpoint'); } }} />
    </div>}
  </LessonShell>;
}
