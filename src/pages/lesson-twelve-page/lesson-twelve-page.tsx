import { CheckCircle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { LessonAudioToggle } from '@/components/lesson/lesson-audio-toggle/lesson-audio-toggle';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStepNav } from '@/components/lesson/lesson-step-nav/lesson-step-nav';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { StringCheckpoint } from '@/components/lesson/string-checkpoint/string-checkpoint';
import { StringMap } from '@/components/lesson/string-map/string-map';
import { StringOrder } from '@/components/lesson/string-order/string-order';
import { allFrets, correctOrder, lessonTwelveContent, linkPairs, orderStart, requiredHeardStrings } from '@/data/lessons/stage-03-lesson-02/constants';
import { fretFrequency } from '@/data/lessons/stage-03-lesson-01-model/utils/frets';
import { openStrings } from '@/data/lessons/stage-03-lesson-02-model/constants';
import { fretToNextString, openStringAfter, stringByNumber } from '@/data/lessons/stage-03-lesson-02-model/utils/strings';
import { useLessonTwelvePage } from '@/pages/lesson-twelve-page/hooks/use-lesson-twelve-page';

const { map, intro, strings, link, pattern, guitar, checkpoint, complete } = lessonTwelveContent;

const mapContent = { label: map.label, stringButtons: map.stringButtons, fretPicker: map.fretPicker, weight: map.weight };
const allNumbers = openStrings.map((item) => item.number);
const panel = 'rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary';

export function LessonTwelvePage() {
  const { restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, visibleStep, isCompleted, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus, playAll, stopAll, playPair, playOctaves, passCheckpoint, pluck, heardStrings, touchString, stringsPredicted, answerStringsPrediction, submitOrder, stringsDone, linkPredicted, answerLinkPrediction, pair, selectPair, fret, selectFret, comparison, compare, foundPairs, patternPredicted, answerPatternPrediction, lastChecked, checkLast, patternSolved, answerPattern } = useLessonTwelvePage();
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  const toggle = <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />;
  const describeString = (number: number) => map.describeString(number, heardStrings.includes(number) ? stringByNumber(number).openNote : null, heardStrings.includes(number) ? stringByNumber(number).frequency : null);
  const next = openStringAfter(pair);
  const matched = comparison !== null && comparison.fret === fretToNextString(comparison.pair);
  const rows = [...linkPairs, 2];
  return <LessonShell {...lessonTwelveContent} steps={route.steps} currentStepId={route.stepId} onRestart={restartLesson}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
    {visibleStep === 'intro' && <LessonStep title={intro.title} intro={intro.reminder} shouldFocus={focusedStep === 'intro'}>
      <div className="space-y-6">
        <p className="text-secondary">{intro.instruction}</p>
        <StringMap content={mapContent} revealed={[]} onSelectString={(number) => pluck(stringByNumber(number).frequency)} describeString={(number) => map.describeString(number, null, null)} describeFret={map.describeFret} />
        {audio.enabled
          ? <div className="flex flex-wrap gap-3">
            <Button color="secondary" size="lg" onClick={playAll}>{intro.listenAll}</Button>
            <Button color="tertiary" size="lg" onClick={stopAll}>{intro.stopLabel}</Button>
          </div>
          : <p className="text-secondary">{intro.withoutAudio}</p>}
        {toggle}
        <ChoiceQuestion question={intro.prediction.question} choices={intro.prediction.choices} correctChoiceId={intro.prediction.correctChoiceId} mode="prediction" />
        <LessonStepNav next={{ label: intro.nextLabel, onClick: () => advance('intro', 'strings') }} />
      </div>
    </LessonStep>}

    {visibleStep === 'strings' && <div className="space-y-5">
      <LessonStep title={strings.title} intro={strings.instruction} shouldFocus={focusedStep === 'strings'}>
        <div className="space-y-6">
          <ChoiceQuestion question={strings.prediction.question} choices={strings.prediction.choices} correctChoiceId={strings.prediction.correctChoiceId} mode="prediction" onCheck={answerStringsPrediction} />
          {stringsPredicted && <section className="space-y-4">
            <StringMap content={mapContent} revealed={heardStrings} selected={null} onSelectString={touchString} describeString={describeString} describeFret={map.describeFret} />
            {!audio.enabled && <p className="text-secondary">{strings.withoutAudio}</p>}
            <p role="status" className="text-sm text-secondary">{strings.heardStatus(Math.min(heardStrings.length, requiredHeardStrings))}</p>
            {toggle}
            <StringOrder content={{ title: strings.orderTitle, help: strings.orderHelp, up: strings.up, down: strings.down, check: strings.check, right: strings.right, wrong: strings.wrong, item: strings.orderItem }} start={orderStart} correct={correctOrder} onPlay={touchString} onSubmit={submitOrder} />
          </section>}
          {stringsDone && <p className={panel}>{strings.notes}</p>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: strings.backLabel, onClick: () => goTo('intro') }} next={stringsDone ? { label: strings.nextLabel, onClick: () => advance('strings', 'link') } : undefined} />
    </div>}

    {visibleStep === 'link' && <div className="space-y-5">
      <LessonStep title={link.title} intro={link.instruction} shouldFocus={focusedStep === 'link'}>
        <div className="space-y-6">
          <ChoiceQuestion question={link.prediction.question} choices={link.prediction.choices} correctChoiceId={link.prediction.correctChoiceId} mode="prediction" onCheck={answerLinkPrediction} />
          {linkPredicted && <section className="space-y-4">
            <div role="group" aria-label={link.pairLabel} className="flex flex-wrap gap-2">
              {linkPairs.map((number) => <Button key={number} color={pair === number ? 'primary' : 'secondary'} size="lg" aria-pressed={pair === number} onClick={() => selectPair(number)}>{link.pair(number)}</Button>)}
            </div>
            <p className="text-secondary">{link.pairIntro(pair)}</p>
            <StringMap content={mapContent} revealed={allNumbers} highlighted={[pair, pair - 1]} pressed={{ string: pair, fret }} selectableFrets={allFrets} fret={fret} onSelectFret={selectFret} describeString={describeString} describeFret={map.describeFret} />
            <Button color="secondary" size="lg" onClick={compare}>{link.compare}</Button>
            {!audio.enabled && <p className="text-secondary">{link.withoutAudio}</p>}
            {comparison && next && <div role="status" className="space-y-1">
              <p className="tabular-nums text-primary">{link.compareText(fretFrequency(stringByNumber(comparison.pair).frequency, comparison.fret), openStringAfter(comparison.pair)?.frequency ?? 0)}</p>
              <p className="font-medium text-primary">{matched ? link.match : link.noMatch}</p>
              {matched && comparison.pair === 3 && <p className="text-secondary">{link.exceptionHint}</p>}
            </div>}
            {toggle}
            <p role="status" className="text-sm text-secondary">{link.foundStatus(foundPairs.length, linkPairs.length)}</p>
            {foundPairs.length > 0 && <section aria-labelledby="twelve-found" className="space-y-1">
              <h3 id="twelve-found" className="font-semibold text-primary">{link.tableTitle}</h3>
              <ul className="text-secondary">{linkPairs.filter((number) => foundPairs.includes(number)).map((number) => <li key={number}>{link.tableRow(number, fretToNextString(number) ?? 0)}</li>)}</ul>
            </section>}
          </section>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: link.backLabel, onClick: () => goTo('strings') }} next={isCompleted('link') ? { label: link.nextLabel, onClick: () => goTo('pattern') } : undefined} />
    </div>}

    {visibleStep === 'pattern' && <div className="space-y-5">
      <LessonStep title={pattern.title} intro={pattern.instruction} shouldFocus={focusedStep === 'pattern'}>
        <div className="space-y-6">
          <ChoiceQuestion question={pattern.prediction.question} choices={pattern.prediction.choices} correctChoiceId={pattern.prediction.correctChoiceId} mode="prediction" onCheck={answerPatternPrediction} />
          {patternPredicted && <section className="space-y-3">
            <Button color="secondary" size="lg" onClick={checkLast}>{pattern.checkLabel}</Button>
            {!audio.enabled && <p className="text-secondary">{link.withoutAudio}</p>}
            {toggle}
            {lastChecked && <p role="status" className="font-medium text-primary">{pattern.checkResult}</p>}
          </section>}
          {lastChecked && <>
            <section aria-labelledby="twelve-table" className="space-y-1">
              <h3 id="twelve-table" className="font-semibold text-primary">{pattern.tableTitle}</h3>
              <ul className="text-secondary">{rows.map((number) => <li key={number}>{pattern.tableRow(number, fretToNextString(number))}</li>)}</ul>
            </section>
            <ChoiceQuestion question={pattern.patternQuestion.question} choices={pattern.patternQuestion.choices} correctChoiceId={pattern.patternQuestion.correctChoiceId} onCheck={answerPattern} />
          </>}
          {patternSolved && <div className="space-y-4">
            <p className={panel}>{pattern.semitoneReminder}</p>
            <section aria-labelledby="twelve-sum" className="space-y-1">
              <h3 id="twelve-sum" className="font-semibold text-primary">{pattern.sumTitle}</h3>
              <p className="tabular-nums text-secondary">{pattern.sum}</p>
            </section>
            <section aria-labelledby="twelve-name" className="space-y-1">
              <h3 id="twelve-name" className="font-semibold text-primary">{pattern.nameTitle}</h3>
              <p className="text-lg font-medium text-primary">{pattern.name}</p>
            </section>
            <p className="text-secondary">{pattern.openQuestion}</p>
          </div>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: pattern.backLabel, onClick: () => goTo('link') }} next={isCompleted('pattern') ? { label: pattern.nextLabel, onClick: () => goTo('guitar') } : undefined} />
    </div>}

    {visibleStep === 'guitar' && <div className="space-y-5">
      <LessonStep title={guitar.title} intro={guitar.instruction} shouldFocus={focusedStep === 'guitar'}>
        <div className="space-y-6">
          <RealWorldExperiment title={guitar.experiment.title} withGuitar={guitar.experiment.withGuitar} withoutGuitar={guitar.experiment.withoutGuitar} safetyNote={guitar.experiment.safety} />
          {audio.enabled && <div className="flex flex-wrap gap-3">
            {[...linkPairs, 2].map((number) => <Button key={number} color="secondary" size="lg" onClick={() => playPair(number, fretToNextString(number) ?? 0)}>{guitar.listenPair(number)}</Button>)}
            <Button color="secondary" size="lg" onClick={playOctaves}>{guitar.listenOctaves}</Button>
          </div>}
          {toggle}
          <p className="text-lg font-medium text-primary">{guitar.question}</p>
          <p className="text-sm text-tertiary">{guitar.note}</p>
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: guitar.backLabel, onClick: () => goTo('pattern') }} next={{ label: guitar.nextLabel, onClick: () => advance('guitar', 'checkpoint') }} />
    </div>}

    {visibleStep === 'checkpoint' && <div className="space-y-5">
      <LessonStep title={checkpoint.title} intro={checkpoint.instruction} shouldFocus={focusedStep === 'checkpoint'}>
        <StringCheckpoint content={checkpoint} passed={progress.checkpointPassed} onPass={passCheckpoint} />
      </LessonStep>
      <LessonStepNav back={{ label: checkpoint.backLabel, onClick: () => goTo('guitar') }} next={progress.checkpointPassed ? { label: checkpoint.nextLabel, onClick: () => goTo('complete') } : undefined} />
    </div>}

    {visibleStep === 'complete' && <div className="space-y-5">
      <LessonStep title={complete.title} shouldFocus={focusedStep === 'complete'}>
        <div className="space-y-6">
          <section aria-labelledby="twelve-summary" className="space-y-3">
            <h3 id="twelve-summary" className="font-semibold text-primary">{complete.summaryTitle}</h3>
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
          {progress.completedAt !== null && <section aria-labelledby="twelve-bridge" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
            <h3 id="twelve-bridge" className="font-semibold text-primary">{complete.bridgeTitle}</h3>
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
