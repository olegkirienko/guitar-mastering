import { Button } from '@/components/base/buttons/button';
import { LessonAudioToggle } from '@/components/lesson/lesson-audio-toggle/lesson-audio-toggle';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStepNav } from '@/components/lesson/lesson-step-nav/lesson-step-nav';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { lessonSixContent } from '@/data/lessons/stage-02-lesson-01/constants';
import { toneGain, useLessonSixPage } from '@/pages/lesson-six-page/hooks/use-lesson-six-page';

export function LessonSixPage() {
  const { restartLesson, route, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, visibleStep, audio, advance, toggleAudio, audioMessage, betweenFound, findBetween } = useLessonSixPage();
  const { intro } = lessonSixContent;
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  return <LessonShell {...lessonSixContent} steps={route.steps} currentStepId={route.stepId} onRestart={restartLesson}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
    {visibleStep === 'intro' && <LessonStep title={intro.title} intro={intro.reminder} shouldFocus={focusedStep === 'intro'}>
      <div className="space-y-6">
        <p className="text-lg font-medium text-primary">{intro.question}</p>
        <section className="space-y-3 rounded-lg border border-secondary bg-primary p-5">
          <p className="text-secondary">{intro.listenNote}</p>
          {audio.enabled && <div className="flex flex-wrap gap-3">
            <Button color="secondary" size="lg" onClick={() => audio.playTone(440, toneGain)}>{intro.listenLabels.first}</Button>
            <Button color="secondary" size="lg" onClick={() => audio.playTone(441, toneGain)}>{intro.listenLabels.second}</Button>
          </div>}
        </section>
        <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />
        <section aria-labelledby="six-intro-between" className="space-y-3 rounded-lg border border-secondary bg-primary p-5">
          <h3 id="six-intro-between" className="font-semibold text-primary">{intro.between.title}</h3>
          <p className="text-secondary">{intro.between.instruction}</p>
          <ol className="space-y-1 text-secondary" role="status" aria-live="polite">
            {intro.between.values.slice(0, betweenFound).map((value) => <li key={value}>{intro.between.found} <strong className="text-primary">{value} {intro.between.unitLabel}</strong></li>)}
          </ol>
          {betweenFound < intro.between.values.length
            ? <Button color="secondary" size="lg" onClick={findBetween}>{intro.between.stepLabel}</Button>
            : <p className="font-medium text-primary">{intro.between.always}</p>}
        </section>
        {betweenFound > 0 && <>
          <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary">{intro.discovery}</p>
          <p className="text-sm text-tertiary">{intro.systemNote}</p>
          <p className="text-lg font-medium text-primary">{intro.nextQuestion}</p>
          <LessonStepNav next={{ label: intro.nextLabel, onClick: () => advance('intro', 'same-name') }} />
        </>}
      </div>
    </LessonStep>}
  </LessonShell>;
}
