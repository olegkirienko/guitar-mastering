import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { StringHypotheses } from '@/components/lesson/string-hypotheses/string-hypotheses';
import { TimbreSoundComparison } from '@/components/lesson/timbre-sound-comparison/timbre-sound-comparison';
import { TimbreWave } from '@/components/lesson/timbre-wave/timbre-wave';
import { lessonFourContent } from '@/data/lessons/stage-01-lesson-04/constants';
import { stopByStep } from '@/pages/lesson-four-page/constants';
import { useLessonFourPage } from '@/pages/lesson-four-page/hooks/use-lesson-four-page';

export function LessonFourPage() {
  const { route, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, descriptions, toggleDescription, ownDescription, setOwnDescription, intro, shape, preferences, waveWords, visibleStep, isCompleted, audio, goTo, toggleAudio, answerIntro, answerShapeCount, introOpen, shapeOpen, answerShapePrediction, audioMessage } = useLessonFourPage();
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  return <LessonShell {...lessonFourContent} currentStop={stopByStep[visibleStep]} steps={route.steps} currentStepId={route.stepId}>
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
      <div className="space-y-6">
        <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary">{intro.note}</p>
        <TimbreSoundComparison content={intro.comparison} audio={audio} />
        <RealWorldExperiment title={intro.guitar.title} withGuitar={intro.guitar.withGuitar} withoutGuitar={intro.guitar.withoutGuitar} safetyNote={intro.guitar.safety} />
        <ChoiceQuestion question={intro.question.question} choices={intro.question.choices} correctChoiceId={intro.question.correctChoiceId} mode="prediction" onCheck={answerIntro} />
        {introOpen && <>
          <p className="rounded-lg bg-secondary p-4 font-medium text-primary">{intro.answer}</p>
          <StringHypotheses content={intro} selected={descriptions} onToggle={toggleDescription} own={ownDescription} onOwnChange={setOwnDescription} />
          <Button size="lg" iconTrailing={ArrowRight} onClick={() => goTo('shape')}>{intro.startLabel}</Button>
        </>}
      </div>
    </LessonStep>}

    {visibleStep === 'shape' && <div className="space-y-5">
      <LessonStep title={shape.title} intro={shape.instruction} shouldFocus={focusedStep === 'shape'}>
        <div className="space-y-6">
          <ChoiceQuestion question={shape.prediction.question} choices={shape.prediction.choices} correctChoiceId={shape.prediction.correctChoiceId} mode="prediction" onCheck={answerShapePrediction} />
          {shapeOpen && <>
            <section aria-labelledby="shape-waves-title" className="space-y-5 rounded-lg border border-secondary bg-primary p-5">
              <div>
                <h3 id="shape-waves-title" className="font-semibold text-primary">{shape.wavesTitle}</h3>
                <p className="mt-1 text-sm text-tertiary">{shape.wavesNote}</p>
              </div>
              {intro.comparison.sounds.map((item) => <TimbreWave key={item.id} sound={item.sound} label={item.label} words={waveWords} />)}
            </section>
            <ChoiceQuestion question={shape.count.question} choices={shape.count.choices} correctChoiceId={shape.count.correctChoiceId} onCheck={answerShapeCount} />
          </>}
          {isCompleted('shape') && <div className="space-y-4">
            <p className="font-medium text-primary">{shape.pattern}</p>
            <section aria-labelledby="shape-term-title" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
              <h3 id="shape-term-title" className="font-semibold text-primary">{shape.termTitle}</h3>
              <p className="mt-2 text-secondary">{shape.term}</p>
            </section>
            <p className="text-lg font-medium text-primary">{shape.nextQuestion}</p>
          </div>}
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <Button color="link-gray" size="md" className="min-h-11" iconLeading={ArrowLeft} onClick={() => goTo('intro')}>{shape.backLabel}</Button>
      </div>
    </div>}
  </LessonShell>;
}
