import { ArrowLeft, ArrowRight, CheckCircle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { SoundPropagationLab } from '@/components/lesson/sound-propagation-lab/sound-propagation-lab';
import { SoundPathCheckpoint } from '@/components/lesson/sound-path-checkpoint/sound-path-checkpoint';
import { VirtualGuitarString } from '@/components/lesson/virtual-guitar-string/virtual-guitar-string';
import { lessonOneContent } from '@/data/lessons/stage-01-lesson-01/constants';
import type { LessonOneStepId } from '@/data/lessons/stage-01-lesson-01/types';
import { useLessonOnePage } from '@/pages/lesson-one-page/hooks/use-lesson-one-page';

export function LessonOnePage() {
  const { progress, setProgress, storageAvailable, sync, accountState, importGuestProgress, confirmGuestImport, keepGuestProgressSeparate, clearCurrentAccountCache, retrySync, shouldFocusIntro, setShouldFocusIntro, shouldFocusString, setShouldFocusString, shouldFocusAir, setShouldFocusAir, shouldFocusCheckpoint, setShouldFocusCheckpoint, shouldFocusComplete, setShouldFocusComplete, reflection, setReflection, explainedAloud, setExplainedAloud, prefersReducedMotion, isStringStep, isAirStep, isCheckpointStep, isCompleteStep, staticMode, begin, openAirLab, openCheckpoint, openCompletion, finishLesson } = useLessonOnePage();
  return <LessonShell {...lessonOneContent} currentStop={isCheckpointStep || isCompleteStep ? 5 : isAirStep ? 4 : 1} backTo="/">
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
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="min-w-0 flex-1 text-sm leading-6 text-gray-600">
        <p className="font-semibold text-gray-950">Рух на екрані</p>
        <p>{prefersReducedMotion ? 'Системне налаштування зменшеного руху активне: досліди показуються покадрово.' : staticMode ? 'Покадровий режим активний. Кадри змінюються лише після твоєї дії.' : 'Короткі моделі можуть рухатися автоматично після запуску.'}</p>
      </div>
      <Button color="secondary" size="lg" isDisabled={prefersReducedMotion} aria-pressed={staticMode} onClick={() => setProgress((current) => ({ ...current, prefersStatic: !current.prefersStatic }))}>
        {prefersReducedMotion ? 'Покадрово: системне' : staticMode ? 'Показувати рух' : 'Показувати покадрово'}
      </Button>
    </div>
    {!isStringStep && !isAirStep && !isCheckpointStep && !isCompleteStep ? <LessonStep title={lessonOneContent.intro.title} intro={lessonOneContent.intro.invitation} shouldFocus={shouldFocusIntro}>
      <div className="rounded-lg border border-brand-200 bg-brand-25 p-5"><p className="text-lg font-medium text-gray-950">{lessonOneContent.intro.question}</p><p className="mt-3 text-sm leading-6 text-gray-700">{lessonOneContent.intro.reassurance}</p></div>
      <Button color="secondary" size="lg" className="mt-4" onClick={() => setProgress((current) => ({ ...current, audioEnabled: !current.audioEnabled }))} aria-pressed={progress.audioEnabled}>
        {progress.audioEnabled ? 'Звук: увімкнено' : 'Звук: вимкнено'}
      </Button>
      <Button size="lg" className="mt-6" iconTrailing={ArrowRight} onClick={begin}>{lessonOneContent.intro.startLabel}</Button>
      <p className="mt-4 text-sm text-gray-600">Аудіо не запускається автоматично й не потрібне, щоб пройти урок.</p>
    </LessonStep> : isStringStep ? <div className="space-y-5">
      <LessonStep title={lessonOneContent.string.title} intro={lessonOneContent.string.instruction} shouldFocus={shouldFocusString}>
        <VirtualGuitarString observationChoices={lessonOneContent.string.observationChoices} predictionChoices={lessonOneContent.string.predictionChoices} audioEnabled={progress.audioEnabled} staticMode={staticMode} onAudioEnabledChange={(audioEnabled) => setProgress((current) => ({ ...current, audioEnabled }))} onExperimentComplete={() => setProgress((current) => ({ ...current, completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'string'])) }))} />
      </LessonStep>
      <RealWorldExperiment title={lessonOneContent.experiment.title} withGuitar={lessonOneContent.experiment.guitar} withoutGuitar={lessonOneContent.experiment.alternative} safetyNote={lessonOneContent.experiment.safety} />
      {progress.completedStepIds.includes('string') && <Button size="lg" iconTrailing={ArrowRight} onClick={openAirLab}>Дослідити рух у повітрі</Button>}
      <Button color="link-gray" size="md" iconLeading={ArrowLeft} onClick={() => { setShouldFocusString(false); setShouldFocusIntro(true); setProgress((current) => ({ ...current, currentStepId: 'intro' })); }}>До вступу</Button>
    </div> : isAirStep ? <div className="space-y-5">
      <LessonStep title={lessonOneContent.air.title} intro={lessonOneContent.air.instruction} shouldFocus={shouldFocusAir}>
        <SoundPropagationLab content={lessonOneContent.air} staticMode={staticMode} onComplete={() => setProgress((current) => ({ ...current, completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'air'])) }))} />
      </LessonStep>
      <RealWorldExperiment title={lessonOneContent.air.experiment.title} withGuitar={lessonOneContent.air.experiment.guitar} withoutGuitar={lessonOneContent.air.experiment.alternative} safetyNote={lessonOneContent.air.experiment.safety} />
      {progress.completedStepIds.includes('air') && <Button size="lg" iconTrailing={ArrowRight} onClick={openCheckpoint}>Зібрати шлях звуку</Button>}
      <Button color="link-gray" size="md" iconLeading={ArrowLeft} onClick={() => { setShouldFocusAir(false); setShouldFocusString(true); setProgress((current) => ({ ...current, currentStepId: 'string' })); }}>До досліду зі струною</Button>
    </div> : isCheckpointStep ? <div className="space-y-5">
      <LessonStep title={lessonOneContent.checkpoint.title} intro={lessonOneContent.checkpoint.instruction} shouldFocus={shouldFocusCheckpoint}>
        <SoundPathCheckpoint content={lessonOneContent.checkpoint} initiallyPassed={progress.checkpointPassed} onComplete={() => setProgress((current) => ({ ...current, checkpointPassed: true, completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'checkpoint'])) }))} />
      </LessonStep>
      {progress.checkpointPassed && <Button size="lg" iconTrailing={ArrowRight} onClick={openCompletion}>Перейти до підсумку</Button>}
      <Button color="link-gray" size="md" iconLeading={ArrowLeft} onClick={() => { setShouldFocusCheckpoint(false); setShouldFocusAir(true); setProgress((current) => ({ ...current, currentStepId: 'air' })); }}>До досліду з повітрям</Button>
    </div> : <div className="space-y-5">
      <LessonStep key={progress.completedAt ? 'completed' : 'completion'} title={progress.completedAt ? lessonOneContent.completion.completedTitle : lessonOneContent.completion.title} intro={lessonOneContent.completion.instruction} shouldFocus={shouldFocusComplete}>
        <div className="rounded-lg border border-brand-200 bg-brand-25 p-5">
          <p className="text-sm font-semibold text-brand-700">Повний шлях звуку</p>
          <p className="mt-2 text-base font-medium leading-7 text-gray-950">{lessonOneContent.completion.chain}</p>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-950">Три відкриття</h3>
          <ul className="mt-3 space-y-2">
            {lessonOneContent.completion.discoveries.map((discovery) => <li key={discovery} className="flex gap-3 text-sm leading-6 text-gray-700"><CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" /><span>{discovery}</span></li>)}
          </ul>
        </div>
        {!progress.completedAt ? <div className="mt-7 border-t border-gray-200 pt-6">
          <label htmlFor="lesson-reflection" className="text-sm font-semibold text-gray-950">{lessonOneContent.completion.reflectionLabel}</label>
          <textarea id="lesson-reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder={lessonOneContent.completion.reflectionPlaceholder} rows={3} className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
          <p className="mt-2 text-xs leading-5 text-gray-500">Цей текст приватний і не зберігається.</p>
          <Button color="secondary" size="lg" className="mt-4" aria-pressed={explainedAloud} onClick={() => setExplainedAloud((current) => !current)}>{explainedAloud ? 'Пояснення вголос позначено' : lessonOneContent.completion.spokenLabel}</Button>
          <div><Button size="lg" className="mt-6" iconTrailing={CheckCircle} onClick={finishLesson}>{lessonOneContent.completion.finishLabel}</Button></div>
        </div> : <div className="mt-7 rounded-lg border border-success-200 bg-success-50 p-5" role="status" aria-live="polite">
          <p className="font-semibold text-gray-950">Урок завершено.</p>
          <p className="mt-1 text-sm leading-6 text-gray-700">{lessonOneContent.completion.completedMessage}</p>
        </div>}
        <div className="mt-8 border-t border-gray-200 pt-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Питання до наступного уроку</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-950">{lessonOneContent.completion.bridgeQuestion}</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-hidden="true">
            <div className="flex h-20 items-center rounded-lg border border-gray-200 bg-gray-50 px-5"><span className="h-1 w-full rounded-full bg-gray-700" /></div>
            <div className="flex h-20 items-center rounded-lg border border-gray-200 bg-gray-50 px-5"><span className="h-3 w-full rounded-full bg-gray-700" /></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-700">{lessonOneContent.completion.bridgeTeaser}</p>
          <p className="mt-3 text-sm leading-6 text-gray-600">{lessonOneContent.completion.experiment}</p>
        </div>
      </LessonStep>
      <Button color="link-gray" size="md" iconLeading={ArrowLeft} onClick={() => { setShouldFocusComplete(false); setShouldFocusCheckpoint(true); setProgress((current) => ({ ...current, currentStepId: 'checkpoint' })); }}>До шляху звуку</Button>
    </div>}
  </LessonShell>;
}
