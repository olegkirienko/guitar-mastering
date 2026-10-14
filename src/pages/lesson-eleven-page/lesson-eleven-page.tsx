import { CheckCircle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { FretBoard } from '@/components/lesson/fret-board/fret-board';
import { FretCheckpoint } from '@/components/lesson/fret-checkpoint/fret-checkpoint';
import { FretExplorer } from '@/components/lesson/fret-explorer/fret-explorer';
import { KeyRow } from '@/components/lesson/key-row/key-row';
import { LessonAudioToggle } from '@/components/lesson/lesson-audio-toggle/lesson-audio-toggle';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStepNav } from '@/components/lesson/lesson-step-nav/lesson-step-nav';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { checkpointFindNote, checkpointNoteFret, guitarFrets, lessonElevenContent, predictFrets, pressFrets } from '@/data/lessons/stage-03-lesson-01/constants';
import { fifthString } from '@/data/lessons/stage-03-lesson-01-model/constants';
import { fretFrequency, fretSemitones, noteAtFret, sharpFrets } from '@/data/lessons/stage-03-lesson-01-model/utils/frets';
import { useLessonElevenPage } from '@/pages/lesson-eleven-page/hooks/use-lesson-eleven-page';

const { board, intro, press, twelve, explorer, guitar, checkpoint, complete, keyRowLabel, keyLabel, stringName } = lessonElevenContent;

const boardContent = { label: board.label(stringName), picker: board.picker, lengthTitle: board.lengthTitle, lengthText: board.lengthText, selected: board.selected };
const describe = (fret: number) => lessonElevenContent.fretSummary(fret, noteAtFret(fifthString.openKey, fret), fretFrequency(fifthString.frequency, fret));
const prediction = 'rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary';
const allFrets = Array.from({ length: 13 }, (_, fret) => fret);

export function LessonElevenPage() {
  const { restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, visibleStep, isCompleted, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus, pluck, pluckFret, passCheckpoint, completeStep, pressPredicted, answerPressPrediction, pressFret, selectPressFret, pressReady, patternSolved, answerPattern, heardCount, twelvePredicted, answerTwelvePrediction, twelveFret, selectTwelveFret, twelveViewed, twelveSolved, answerTwelve } = useLessonElevenPage();
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  const toggle = <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />;
  return <LessonShell {...lessonElevenContent} steps={route.steps} currentStepId={route.stepId} onRestart={restartLesson}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
    {visibleStep === 'intro' && <LessonStep title={intro.title} intro={intro.reminder} shouldFocus={focusedStep === 'intro'}>
      <div className="space-y-6">
        <p className="text-secondary">{intro.instruction}</p>
        <FretBoard content={boardContent} selected={null} describe={describe} />
        {audio.enabled
          ? <div className="flex flex-wrap gap-3">
            <Button color="secondary" size="lg" onClick={() => pluck(fifthString.frequency)}>{intro.listenLabel}</Button>
            <Button color="tertiary" size="lg" onClick={audio.stop}>{intro.stopLabel}</Button>
          </div>
          : <p className="text-secondary">{intro.withoutAudio}</p>}
        {toggle}
        <ChoiceQuestion question={intro.prediction.question} choices={intro.prediction.choices} correctChoiceId={intro.prediction.correctChoiceId} mode="prediction" />
        <LessonStepNav next={{ label: intro.nextLabel, onClick: () => advance('intro', 'press') }} />
      </div>
    </LessonStep>}

    {visibleStep === 'press' && <div className="space-y-5">
      <LessonStep title={press.title} intro={press.instruction} shouldFocus={focusedStep === 'press'}>
        <div className="space-y-6">
          <ChoiceQuestion question={press.prediction.question} choices={press.prediction.choices} correctChoiceId={press.prediction.correctChoiceId} mode="prediction" onCheck={answerPressPrediction} />
          {pressPredicted && <section className="space-y-4">
            <p className="text-secondary">{press.task}</p>
            <FretBoard content={boardContent} selected={pressFret} selectable={pressFrets} onSelect={selectPressFret} describe={describe} />
            <KeyRow label={keyRowLabel} count={pressFrets.length} base={fifthString.frequency} keyLabel={keyLabel} onPlay={selectPressFret} highlighted={[pressFret]} narrowKeys={sharpFrets(fifthString.openKey, pressFrets.length)} captions={{ [pressFret]: noteAtFret(fifthString.openKey, pressFret) }} />
            <p role="status" className="font-medium tabular-nums text-primary">{press.counter(fretSemitones(pressFret))}</p>
            {!audio.enabled && <p className="text-secondary">{press.withoutAudio}</p>}
            <p role="status" className="text-sm text-secondary">{press.heardStatus(heardCount)}</p>
            {toggle}
          </section>}
          {pressReady && <ChoiceQuestion question={press.patternQuestion.question} choices={press.patternQuestion.choices} correctChoiceId={press.patternQuestion.correctChoiceId} onCheck={answerPattern} />}
          {patternSolved && <p className={prediction}>{press.pattern}</p>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: press.backLabel, onClick: () => goTo('intro') }} next={isCompleted('press') ? { label: press.nextLabel, onClick: () => goTo('twelve') } : undefined} />
    </div>}

    {visibleStep === 'twelve' && <div className="space-y-5">
      <LessonStep title={twelve.title} intro={twelve.instruction} shouldFocus={focusedStep === 'twelve'}>
        <div className="space-y-6">
          <ChoiceQuestion question={twelve.prediction.question} choices={twelve.prediction.choices} correctChoiceId={twelve.prediction.correctChoiceId} mode="prediction" onCheck={answerTwelvePrediction} />
          {twelvePredicted && <section className="space-y-4">
            <p className="text-secondary">{twelve.task}</p>
            <FretBoard content={boardContent} selected={twelveFret} selectable={allFrets} onSelect={selectTwelveFret} describe={describe} showLength />
            {audio.enabled
              ? <div className="flex flex-wrap gap-3">
                <Button color="secondary" size="lg" onClick={() => pluck(fifthString.frequency)}>{twelve.playOpen}</Button>
                <Button color="secondary" size="lg" onClick={() => pluckFret(12)}>{twelve.playTwelve}</Button>
              </div>
              : <p className="text-secondary">{twelve.withoutAudio}</p>}
            {toggle}
          </section>}
          {twelveViewed && <>
            <p className="font-medium tabular-nums text-primary">{twelve.ratio}</p>
            <p className="text-secondary">{twelve.reminder}</p>
            <ChoiceQuestion question={twelve.question.question} choices={twelve.question.choices} correctChoiceId={twelve.question.correctChoiceId} onCheck={answerTwelve} />
          </>}
          {twelveSolved && <p className={prediction}>{twelve.pattern}</p>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: twelve.backLabel, onClick: () => goTo('press') }} next={isCompleted('twelve') ? { label: twelve.nextLabel, onClick: () => goTo('explorer') } : undefined} />
    </div>}

    {visibleStep === 'explorer' && <div className="space-y-5">
      <LessonStep title={explorer.title} intro={explorer.instruction} shouldFocus={focusedStep === 'explorer'}>
        <div className="space-y-6">
          <FretExplorer
            content={explorer}
            board={boardContent}
            openString={fifthString}
            predictFrets={predictFrets}
            audioEnabled={audio.enabled}
            keyRowLabel={keyRowLabel}
            keyLabel={keyLabel}
            describe={describe}
            onPlay={pluck}
            onSolved={() => completeStep('explorer')}
          />
          {toggle}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: explorer.backLabel, onClick: () => goTo('twelve') }} next={isCompleted('explorer') ? { label: explorer.nextLabel, onClick: () => goTo('guitar') } : undefined} />
    </div>}

    {visibleStep === 'guitar' && <div className="space-y-5">
      <LessonStep title={guitar.title} intro={guitar.instruction} shouldFocus={focusedStep === 'guitar'}>
        <div className="space-y-6">
          <RealWorldExperiment title={guitar.experiment.title} withGuitar={guitar.experiment.withGuitar} withoutGuitar={guitar.experiment.withoutGuitar} safetyNote={guitar.experiment.safety} />
          {audio.enabled && <div className="flex flex-wrap gap-3">
            {guitarFrets.map((fret) => <Button key={fret} color="secondary" size="lg" onClick={() => pluckFret(fret)}>{guitar.listen(fret)}</Button>)}
          </div>}
          {toggle}
          <p className="text-lg font-medium text-primary">{guitar.question}</p>
          <p className="text-sm text-tertiary">{guitar.note}</p>
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: guitar.backLabel, onClick: () => goTo('explorer') }} next={{ label: guitar.nextLabel, onClick: () => advance('guitar', 'checkpoint') }} />
    </div>}

    {visibleStep === 'checkpoint' && <div className="space-y-5">
      <LessonStep title={checkpoint.title} intro={checkpoint.instruction} shouldFocus={focusedStep === 'checkpoint'}>
        <FretCheckpoint content={checkpoint} board={boardContent} openString={fifthString} noteFret={checkpointNoteFret} findNote={checkpointFindNote} describe={describe} passed={progress.checkpointPassed} onPass={passCheckpoint} />
      </LessonStep>
      <LessonStepNav back={{ label: checkpoint.backLabel, onClick: () => goTo('guitar') }} next={progress.checkpointPassed ? { label: checkpoint.nextLabel, onClick: () => goTo('complete') } : undefined} />
    </div>}

    {visibleStep === 'complete' && <div className="space-y-5">
      <LessonStep title={complete.title} shouldFocus={focusedStep === 'complete'}>
        <div className="space-y-6">
          <section aria-labelledby="eleven-summary" className="space-y-3">
            <h3 id="eleven-summary" className="font-semibold text-primary">{complete.summaryTitle}</h3>
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
          {progress.completedAt !== null && <section aria-labelledby="eleven-bridge" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
            <h3 id="eleven-bridge" className="font-semibold text-primary">{complete.bridgeTitle}</h3>
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
