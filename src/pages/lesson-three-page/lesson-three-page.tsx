import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { SameStringDiagram } from '@/components/lesson/same-string-diagram/same-string-diagram';
import { StringFactorExperiment } from '@/components/lesson/string-factor-experiment/string-factor-experiment';
import { StringHypotheses } from '@/components/lesson/string-hypotheses/string-hypotheses';
import { lessonThreeContent } from '@/data/lessons/stage-01-lesson-03/constants';
import { stopByStep } from '@/pages/lesson-three-page/constants';
import { useLessonThreePage } from '@/pages/lesson-three-page/hooks/use-lesson-three-page';

export function LessonThreePage() {
  const { route, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, hypotheses, toggleHypothesis, ownHypothesis, setOwnHypothesis, intro, length, preferences, visibleStep, isCompleted, audio, goTo, begin, toggleAudio, completeLength, audioMessage } = useLessonThreePage();
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  return <LessonShell {...lessonThreeContent} currentStop={stopByStep[visibleStep]} steps={route.steps} currentStepId={route.stepId}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
    <div className="mb-5 grid gap-3 rounded-lg border border-secondary bg-secondary px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 text-sm leading-6 text-tertiary">
          <p className="font-semibold text-primary">{preferences.audioTitle}</p>
          <p>{preferences.audioNote}</p>
        </div>
        <Button color="secondary" size="lg" aria-pressed={audioEnabled} onClick={toggleAudio}>{audioEnabled ? preferences.audioOnLabel : preferences.audioOffLabel}</Button>
      </div>
      <div aria-live="polite" className="text-sm text-secondary">{audioMessage && <p>{audioMessage}</p>}</div>
    </div>

    {visibleStep === 'intro' && <LessonStep title={intro.title} intro={intro.reminder} shouldFocus={focusedStep === 'intro'}>
      <div className="rounded-lg border border-brand-200 bg-brand-25 p-5">
        <p className="text-lg font-medium text-primary">{intro.question}</p>
      </div>
      <div className="mt-6">
        <StringHypotheses content={intro} selected={hypotheses} onToggle={toggleHypothesis} own={ownHypothesis} onOwnChange={setOwnHypothesis} />
      </div>
      <div className="mt-6">
        <Button size="lg" iconTrailing={ArrowRight} onClick={begin}>{intro.startLabel}</Button>
      </div>
    </LessonStep>}

    {visibleStep === 'length' && <div className="space-y-5">
      <LessonStep title={length.title} intro={length.instruction} shouldFocus={focusedStep === 'length'}>
        <div className="space-y-5">
          <RealWorldExperiment title={length.guitar.title} withGuitar={length.guitar.withGuitar} withoutGuitar={length.guitar.withoutGuitar} safetyNote={length.guitar.safety} />
          <SameStringDiagram caption={length.diagram.caption} openLabel={length.diagram.openLabel} pressedLabel={length.diagram.pressedLabel} highlightVibrating />
          <StringFactorExperiment factor="length" prediction={length.prediction} content={length.experiment} audio={audio} completed={isCompleted('length')} onComplete={completeLength} />
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('intro')}>{length.backLabel}</Button>
      </div>
    </div>}
  </LessonShell>;
}
