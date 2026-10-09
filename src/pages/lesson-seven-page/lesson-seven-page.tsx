import { CheckCircle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { KeyDistance } from '@/components/lesson/key-distance/key-distance';
import { KeyRow } from '@/components/lesson/key-row/key-row';
import { LessonAudioToggle } from '@/components/lesson/lesson-audio-toggle/lesson-audio-toggle';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStepNav } from '@/components/lesson/lesson-step-nav/lesson-step-nav';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { MultiplyChain } from '@/components/lesson/multiply-chain/multiply-chain';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { SemitoneCheckpoint } from '@/components/lesson/semitone-checkpoint/semitone-checkpoint';
import { StepTable } from '@/components/lesson/step-table/step-table';
import { StepWalk } from '@/components/lesson/step-walk/step-walk';
import { ToneSequence } from '@/components/lesson/tone-sequence/tone-sequence';
import { introStepKeys, lessonSevenContent } from '@/data/lessons/stage-02-lesson-02/constants';
import { baseFrequency, lastKeyNumber } from '@/data/lessons/stage-02-lesson-02-model/constants';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';
import { toneGain, useLessonSevenPage } from '@/pages/lesson-seven-page/hooks/use-lesson-seven-page';

const sweepSeconds = 4;
const introSequences = [{ id: 'steps', label: lessonSevenContent.intro.stepsLabel, frequencies: introStepKeys.map((key) => keyFrequency(baseFrequency, key)) }];
const extraSequences = [
  { id: 'add', label: lessonSevenContent.compare.extra.addLabel, frequencies: [0, 1, 2, 3].map((step) => baseFrequency / 2 + 30 * step) },
  { id: 'ratio', label: lessonSevenContent.compare.extra.ratioLabel, frequencies: [0, 1, 2, 3].map((step) => (baseFrequency / 2) * 2 ** (step / 12)) },
];

export function LessonSevenPage() {
  const { restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, visibleStep, isCompleted, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus, pressedKeys, pressKey, keysPredicted, answerKeys, keysDone, comparePredicted, answerCompare, numbersShown, showNumbers, chainCount, multiply, resetChain, passCheckpoint, finishSteps, answerSemitone } = useLessonSevenPage();
  const { intro, keys, steps, compare, semitone, deeper, guitar, checkpoint, complete } = lessonSevenContent;
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  const toggle = <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />;
  return <LessonShell {...lessonSevenContent} steps={route.steps} currentStepId={route.stepId} onRestart={restartLesson}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
    {visibleStep === 'intro' && <LessonStep title={intro.title} intro={intro.reminder} shouldFocus={focusedStep === 'intro'}>
      <div className="space-y-6">
        <section className="space-y-3 rounded-lg border border-secondary bg-primary p-5">
          <p className="text-secondary">{intro.instruction}</p>
          {audio.enabled
            ? <div className="flex flex-wrap gap-3">
              <Button color="secondary" size="lg" onClick={() => audio.playSweep(baseFrequency, baseFrequency * 2, sweepSeconds, toneGain)}>{intro.sweepLabel}</Button>
              <ToneSequence sequences={introSequences} stopLabel={intro.stopLabel} audio={audio} gain={toneGain} />
              <Button color="tertiary" size="lg" onClick={audio.stop}>{intro.stopLabel}</Button>
            </div>
            : <p className="text-secondary">{intro.listenNote}</p>}
          <p className="text-sm tabular-nums text-tertiary">{intro.scaleLabel}: {intro.scaleFrom} … {intro.scaleTo}</p>
        </section>
        {toggle}
        <p className="text-lg font-medium text-primary">{intro.question}</p>
        <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary">{intro.discovery}</p>
        <LessonStepNav next={{ label: intro.nextLabel, onClick: () => advance('intro', 'keys') }} />
      </div>
    </LessonStep>}

    {visibleStep === 'keys' && <div className="space-y-5">
      <LessonStep title={keys.title} intro={keys.instruction} shouldFocus={focusedStep === 'keys'}>
        <div className="space-y-6">
          <ChoiceQuestion question={keys.prediction.question} choices={keys.prediction.choices} correctChoiceId={keys.prediction.correctChoiceId} mode="prediction" onCheck={answerKeys} />
          {keysPredicted && <section className="space-y-3">
            <p className="text-secondary">{keys.task}</p>
            <KeyRow label={keys.keyRowLabel} count={lastKeyNumber + 1} base={baseFrequency} keyLabel={keys.keyLabel} onPlay={pressKey} highlighted={pressedKeys} />
            <p className="text-sm text-tertiary">{keys.shapeHint}</p>
            {!audio.enabled && <p className="text-secondary">{keys.withoutAudio}</p>}
            <p role="status" className="text-sm text-secondary">{keys.heardStatus(pressedKeys.length)}</p>
            {toggle}
          </section>}
          {(keysDone || isCompleted('keys')) && <p className="text-lg font-medium text-primary">{keys.nextQuestion}</p>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: keys.backLabel, onClick: () => goTo('intro') }} next={keysDone || isCompleted('keys') ? { label: keys.nextLabel, onClick: () => advance('keys', 'steps') } : undefined} />
    </div>}

    {visibleStep === 'steps' && <div className="space-y-5">
      <LessonStep title={steps.title} intro={steps.instruction} shouldFocus={focusedStep === 'steps'}>
        <div className="space-y-6">
          <StepWalk content={steps} keyRowLabel={keys.keyRowLabel} keyLabel={keys.keyLabel} audio={audio} gain={toneGain} onDone={finishSteps} />
          {toggle}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: steps.backLabel, onClick: () => goTo('keys') }} next={isCompleted('steps') ? { label: steps.nextLabel, onClick: () => goTo('compare') } : undefined} />
    </div>}

    {visibleStep === 'compare' && <div className="space-y-5">
      <LessonStep title={compare.title} intro={compare.instruction} shouldFocus={focusedStep === 'compare'}>
        <div className="space-y-6">
          <ChoiceQuestion question={compare.prediction.question} choices={compare.prediction.choices} correctChoiceId={compare.prediction.correctChoiceId} mode="prediction" onCheck={answerCompare} />
          {comparePredicted && !numbersShown && <Button size="lg" onClick={showNumbers}>{compare.showLabel}</Button>}
          {numbersShown && <>
            <StepTable content={compare.table} base={baseFrequency} />
            <p className="text-lg font-medium text-primary">{compare.task}</p>
            <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary">{compare.pattern}</p>
            <section aria-labelledby="seven-why" className="space-y-2">
              <h3 id="seven-why" className="font-semibold text-primary">{compare.whyTitle}</h3>
              <p className="text-secondary">{compare.why}</p>
            </section>
            <section aria-labelledby="seven-extra" className="space-y-3 rounded-lg border border-secondary bg-primary p-5">
              <h3 id="seven-extra" className="font-semibold text-primary">{compare.extra.title}</h3>
              <p className="text-secondary">{compare.extra.instruction}</p>
              <ToneSequence sequences={extraSequences} stopLabel={compare.extra.stopLabel} audio={audio} gain={toneGain} />
            </section>
            {toggle}
          </>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: compare.backLabel, onClick: () => goTo('steps') }} next={numbersShown ? { label: compare.nextLabel, onClick: () => advance('compare', 'semitone') } : undefined} />
    </div>}

    {visibleStep === 'semitone' && <div className="space-y-5">
      <LessonStep title={semitone.title} intro={semitone.instruction} shouldFocus={focusedStep === 'semitone'}>
        <div className="space-y-6">
          <section aria-labelledby="seven-term" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
            <h3 id="seven-term" className="font-semibold text-primary">{semitone.termTitle}</h3>
            <p className="mt-2 text-secondary">{semitone.term}</p>
          </section>
          <section aria-labelledby="seven-explorer" className="space-y-3">
            <h3 id="seven-explorer" className="font-semibold text-primary">{semitone.explorerTitle}</h3>
            <p className="text-secondary">{semitone.explorerInstruction}</p>
            <KeyDistance content={semitone} keyRowLabel={keys.keyRowLabel} keyLabel={keys.keyLabel} audio={audio} gain={toneGain} />
            <p className="font-medium text-primary">{semitone.rule}</p>
            {toggle}
          </section>
          <table className="text-left text-sm tabular-nums">
            <caption className="pb-2 text-left text-sm text-tertiary">{semitone.table.caption}</caption>
            <thead><tr className="border-b border-secondary text-primary">
              <th scope="col" className="py-2 pr-6 font-semibold">{semitone.table.headers.semitones}</th>
              <th scope="col" className="py-2 font-semibold">{semitone.table.headers.tones}</th>
            </tr></thead>
            <tbody>{semitone.table.rows.map((row) => <tr key={row.semitones} className="border-b border-secondary text-secondary">
              <td className="py-2 pr-6">{row.semitones}</td><td className="py-2">{row.tones}</td>
            </tr>)}</tbody>
          </table>
          <ChoiceQuestion question={semitone.question.question} choices={semitone.question.choices} correctChoiceId={semitone.question.correctChoiceId} onCheck={answerSemitone} />
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: semitone.backLabel, onClick: () => goTo('compare') }} next={isCompleted('semitone') ? { label: semitone.nextLabel, onClick: () => goTo('deeper') } : undefined} />
    </div>}

    {visibleStep === 'deeper' && <div className="space-y-5">
      <LessonStep title={deeper.title} intro={deeper.instruction} shouldFocus={focusedStep === 'deeper'}>
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase text-tertiary">{deeper.optionalLabel}</p>
          <p className="text-secondary">{deeper.rule}</p>
          <MultiplyChain content={deeper} count={chainCount} onMultiply={multiply} onReset={resetChain} />
        </div>
      </LessonStep>
      <LessonStepNav
        back={{ label: deeper.backLabel, onClick: () => goTo('semitone') }}
        next={{ label: chainCount === 12 ? deeper.nextLabel : deeper.skipLabel, onClick: () => advance('deeper', 'guitar') }}
      />
    </div>}

    {visibleStep === 'guitar' && <div className="space-y-5">
      <LessonStep title={guitar.title} intro={guitar.instruction} shouldFocus={focusedStep === 'guitar'}>
        <div className="space-y-6">
          <RealWorldExperiment title={guitar.experiment.title} withGuitar={guitar.experiment.withGuitar} withoutGuitar={guitar.experiment.withoutGuitar} safetyNote={guitar.experiment.safety} />
          {audio.enabled && <div className="flex flex-wrap gap-3">
            <Button color="secondary" size="lg" onClick={() => audio.playPluck(110)}>{guitar.listenLow}</Button>
            <Button color="secondary" size="lg" onClick={() => audio.playPluck(keyFrequency(110, 1))}>{guitar.listenHigh}</Button>
          </div>}
          {toggle}
          <p className="text-lg font-medium text-primary">{guitar.question}</p>
          <p className="text-sm text-tertiary">{guitar.note}</p>
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: guitar.backLabel, onClick: () => goTo('deeper') }} next={{ label: guitar.nextLabel, onClick: () => advance('guitar', 'checkpoint') }} />
    </div>}

    {visibleStep === 'checkpoint' && <div className="space-y-5">
      <LessonStep title={checkpoint.title} intro={checkpoint.instruction} shouldFocus={focusedStep === 'checkpoint'}>
        <SemitoneCheckpoint content={checkpoint} passed={progress.checkpointPassed} onPass={passCheckpoint} />
      </LessonStep>
      <LessonStepNav back={{ label: checkpoint.backLabel, onClick: () => goTo('guitar') }} next={progress.checkpointPassed ? { label: checkpoint.nextLabel, onClick: () => goTo('complete') } : undefined} />
    </div>}

    {visibleStep === 'complete' && <div className="space-y-5">
      <LessonStep title={complete.title} shouldFocus={focusedStep === 'complete'}>
        <div className="space-y-6">
          <section aria-labelledby="seven-summary" className="space-y-3">
            <h3 id="seven-summary" className="font-semibold text-primary">{complete.summaryTitle}</h3>
            <ul className="space-y-2 text-secondary">
              {complete.summary.map((rule) => <li key={rule} className="flex gap-2"><CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" />{rule}</li>)}
            </ul>
          </section>
          {progress.completedAt === null && <Button size="lg" onClick={finishLesson}>{complete.finishLabel}</Button>}
          <div ref={finishStatus} tabIndex={-1} role="status" data-testid="finish-status" className="space-y-3 outline-none">
            {progress.completedAt !== null && <>
              <p className="font-semibold text-primary">{complete.finished}</p>
              <p className="text-secondary">{complete.feedback}</p>
            </>}
          </div>
          {progress.completedAt !== null && <section aria-labelledby="seven-bridge" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
            <h3 id="seven-bridge" className="font-semibold text-primary">{complete.bridgeTitle}</h3>
            <p className="mt-2 text-lg font-medium text-primary">{complete.bridge}</p>
            <p className="mt-2 text-sm text-tertiary">{complete.bridgeNote}</p>
          </section>}
        </div>
      </LessonStep>
      <div className="flex flex-wrap items-center gap-3">
        <LessonStepNav back={{ label: complete.backLabel, onClick: () => goTo('checkpoint') }} />
        {progress.completedAt !== null && <Button size="lg" href="/course">{complete.backToCourse}</Button>}
      </div>
    </div>}
  </LessonShell>;
}
