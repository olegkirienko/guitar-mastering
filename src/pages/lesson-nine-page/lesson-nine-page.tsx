import { CheckCircle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { AccidentalCheckpoint } from '@/components/lesson/accidental-checkpoint/accidental-checkpoint';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { EnharmonicPairs } from '@/components/lesson/enharmonic-pairs/enharmonic-pairs';
import { KeyRow } from '@/components/lesson/key-row/key-row';
import { LessonAudioToggle } from '@/components/lesson/lesson-audio-toggle/lesson-audio-toggle';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStepNav } from '@/components/lesson/lesson-step-nav/lesson-step-nav';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { SignedName } from '@/components/lesson/signed-name/signed-name';
import { ToneSequence } from '@/components/lesson/tone-sequence/tone-sequence';
import { edgeCases, flatPairs, guitarSemitoneFrequency, guitarStringHertz, introThroughBlackKeys, introWhiteKeys, lessonNineContent, middleBlackKey, requiredSharps, sharpPairs } from '@/data/lessons/stage-02-lesson-04/constants';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';
import { baseFrequency, blackKeyPositions, lastKeyNumber } from '@/data/lessons/stage-02-lesson-03-model/constants';
import { isWhiteKey } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';
import { lettersWithFlat, lettersWithSharp } from '@/data/lessons/stage-02-lesson-04-model/constants';
import { spokenName, whiteLetterOf } from '@/data/lessons/stage-02-lesson-04-model/utils/names';
import { toneGain, useLessonNinePage } from '@/pages/lesson-nine-page/hooks/use-lesson-nine-page';
import { hintText } from '@/pages/lesson-nine-page/utils/hint-text';

const introSequences = [
  { id: 'white', label: lessonNineContent.intro.whiteLabel, frequencies: introWhiteKeys.map((key) => keyFrequency(baseFrequency, key)) },
  { id: 'black', label: lessonNineContent.intro.blackLabel, frequencies: introThroughBlackKeys.map((key) => keyFrequency(baseFrequency, key)) },
];

const prediction = 'rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary';

export function LessonNinePage() {
  const { restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, visibleStep, isCompleted, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus, pressedKeys, pressKey, captions, names, trail, up, down, introPredicted, answerIntro, lowerPredicted, answerLower, edgesPredicted, answerEdges, sameAnswered, pairsDone, answerSame, solvePairs, checkedCases, checkCase, controlSolved, answerControl, naturalShown, showNatural, passCheckpoint } = useLessonNinePage();
  const { intro, raise, lower, same, edges, guitar, checkpoint, complete, keyRowLabel, colors } = lessonNineContent;
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  const toggle = <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />;
  const keyLabel = (key: number, frequency: string) => lessonNineContent.keyLabel(key, isWhiteKey(key) ? colors.white : colors.black, frequency, (names[key] ?? []).map(spokenName));
  const row = (count = lastKeyNumber + 1, custom?: Readonly<Record<number, string>>) => <KeyRow
    label={keyRowLabel}
    count={count}
    base={baseFrequency}
    keyLabel={keyLabel}
    onPlay={pressKey}
    highlighted={pressedKeys}
    narrowKeys={blackKeyPositions}
    captions={custom ?? captions}
    trail={trail}
  />;
  const sharpLetters = lettersWithSharp.filter((letter) => up.found.includes(letter));
  const flatLetters = lettersWithFlat.filter((letter) => down.found.includes(letter));
  return <LessonShell {...lessonNineContent} steps={route.steps} currentStepId={route.stepId} onRestart={restartLesson}>
    <LessonProgressPanel sync={sync} retrySync={retrySync} preferencesSaveFailed={preferencesSaveFailed} />
    {visibleStep === 'intro' && <LessonStep title={intro.title} intro={intro.reminder} shouldFocus={focusedStep === 'intro'}>
      <div className="space-y-6">
        <section className="space-y-3 rounded-lg border border-secondary bg-primary p-5">
          <p className="text-secondary">{intro.instruction}</p>
          {audio.enabled
            ? <div className="flex flex-wrap gap-3">
              <ToneSequence sequences={introSequences} stopLabel={intro.stopLabel} audio={audio} gain={toneGain} />
              <Button color="tertiary" size="lg" onClick={audio.stop}>{intro.stopLabel}</Button>
            </div>
            : <p className="text-secondary">{intro.listenNote}</p>}
        </section>
        {toggle}
        <p className="text-secondary">{intro.keysTask}</p>
        {row(3, { 0: 'C', 2: 'D' })}
        <ChoiceQuestion question={intro.prediction.question} choices={intro.prediction.choices} correctChoiceId={intro.prediction.correctChoiceId} mode="prediction" onCheck={answerIntro} />
        {introPredicted && <p className={prediction}>{intro.discovery}</p>}
        <LessonStepNav next={{ label: intro.nextLabel, onClick: () => advance('intro', 'raise') }} />
      </div>
    </LessonStep>}

    {visibleStep === 'raise' && <div className="space-y-5">
      <LessonStep title={raise.title} intro={raise.instruction} shouldFocus={focusedStep === 'raise'}>
        <div className="space-y-6">
          <p className="text-secondary">{raise.task}</p>
          {row()}
          {!audio.enabled && <p className="text-secondary">{raise.withoutAudio}</p>}
          <p role="status" className="text-sm text-secondary">{hintText(raise.hint, up.hint)} {raise.foundStatus(up.found.length)}</p>
          {toggle}
          {up.found.length > 0 && <>
            <p className={prediction}>{raise.term}</p>
            <p className="font-medium tabular-nums text-primary">{raise.tableTitle}: {sharpLetters.length ? raise.table(sharpLetters) : '—'}</p>
          </>}
          {up.found.length >= requiredSharps && <p className="text-lg font-medium text-primary">{raise.question}</p>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: raise.backLabel, onClick: () => goTo('intro') }} next={{ label: raise.nextLabel, onClick: () => advance('raise', 'lower') }} />
    </div>}

    {visibleStep === 'lower' && <div className="space-y-5">
      <LessonStep title={lower.title} intro={lower.instruction} shouldFocus={focusedStep === 'lower'}>
        <div className="space-y-6">
          <ChoiceQuestion question={lower.prediction.question} choices={lower.prediction.choices} correctChoiceId={lower.prediction.correctChoiceId} mode="prediction" onCheck={answerLower} />
          {lowerPredicted && <section className="space-y-3">
            <p className="text-secondary">{lower.task}</p>
            {row()}
            {!audio.enabled && <p className="text-secondary">{lower.withoutAudio}</p>}
            <p role="status" className="text-sm text-secondary">{hintText(lower.hint, down.hint)} {lower.foundStatus(down.found.length)}</p>
            {toggle}
          </section>}
          {down.found.length > 0 && <>
            <p className={prediction}>{lower.term}</p>
            <p className="font-medium tabular-nums text-primary">{lower.tableTitle}: {lower.table(flatLetters)}</p>
            <p className="text-lg font-medium text-primary">{lower.question}</p>
          </>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: lower.backLabel, onClick: () => goTo('raise') }} next={{ label: lower.nextLabel, onClick: () => advance('lower', 'same') }} />
    </div>}

    {visibleStep === 'same' && <div className="space-y-5">
      <LessonStep title={same.title} intro={same.instruction} shouldFocus={focusedStep === 'same'}>
        <div className="space-y-6">
          <section className="space-y-3">
            <p className="font-medium text-primary"><SignedName name="C♯" /> = <SignedName name="D♭" /> — {same.keyNote}</p>
            <p className="text-secondary tabular-nums">{same.frequencyNote}</p>
            {audio.enabled
              ? <div className="flex flex-wrap gap-3">
                {['C♯', 'D♭'].map((name) => <Button key={name} color="secondary" size="lg" onClick={() => audio.playTone(keyFrequency(baseFrequency, middleBlackKey), toneGain)}>
                  {same.playAs('')}<SignedName name={name} />
                </Button>)}
                <Button color="tertiary" size="lg" onClick={audio.stop}>{same.stopLabel}</Button>
              </div>
              : <p className="text-secondary">{same.withoutAudio}</p>}
            {toggle}
          </section>
          <ChoiceQuestion question={same.question.question} choices={same.question.choices} correctChoiceId={same.question.correctChoiceId} onCheck={answerSame} />
          {sameAnswered && <>
            <p className={prediction}>{same.term}</p>
            <section aria-labelledby="nine-pairs" className="space-y-3">
              <h3 id="nine-pairs" className="font-semibold text-primary">{same.pairsTitle}</h3>
              <p className="text-secondary">{same.pairsInstruction}</p>
              <EnharmonicPairs content={same.pairs} left={sharpPairs} right={flatPairs} onSolved={solvePairs} />
            </section>
          </>}
          {pairsDone && <p className="text-secondary">{same.conclusion}</p>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: same.backLabel, onClick: () => goTo('lower') }} next={isCompleted('same') ? { label: same.nextLabel, onClick: () => goTo('edges') } : undefined} />
    </div>}

    {visibleStep === 'edges' && <div className="space-y-5">
      <LessonStep title={edges.title} intro={edges.instruction} shouldFocus={focusedStep === 'edges'}>
        <div className="space-y-6">
          <ChoiceQuestion question={edges.prediction.question} choices={edges.prediction.choices} correctChoiceId={edges.prediction.correctChoiceId} mode="prediction" onCheck={answerEdges} />
          {edgesPredicted && <>
            <p className={prediction}>{edges.explanation}</p>
            <section aria-labelledby="nine-cases" className="space-y-3">
              <h3 id="nine-cases" className="font-semibold text-primary">{edges.casesTitle}</h3>
              <p className="text-secondary">{edges.casesInstruction}</p>
              {!audio.enabled && <p className="text-secondary">{edges.withoutAudio}</p>}
              <ul className="space-y-2">
                {edgeCases.map((name) => <li key={name} className="flex flex-wrap items-center gap-3">
                  <Button color={checkedCases.includes(name) ? 'primary' : 'secondary'} aria-pressed={checkedCases.includes(name)} onClick={() => checkCase(name)}>
                    <span className="sr-only">{edges.case('')}{spokenName(name)}</span><span aria-hidden="true">{edges.case(name)}</span>
                  </Button>
                  <span role="status" className="font-medium tabular-nums text-primary">{checkedCases.includes(name) ? edges.caseResult(name, whiteLetterOf(name) ?? 'C') : null}</span>
                </li>)}
              </ul>
              <p role="status" className="text-sm text-secondary">{edges.caseStatus(checkedCases.length)}</p>
            </section>
          </>}
          {checkedCases.length === edgeCases.length && <>
            <p className={prediction}>{edges.pattern}</p>
            <ChoiceQuestion question={edges.control.question} choices={edges.control.choices} correctChoiceId={edges.control.correctChoiceId} onCheck={answerControl} />
          </>}
          {controlSolved && <section aria-labelledby="nine-natural" className="space-y-3 rounded-lg border border-secondary bg-primary p-5">
            <h3 id="nine-natural" className="font-semibold text-primary">{edges.naturalTitle}</h3>
            <p className="text-secondary">{edges.natural}</p>
            <Button color="secondary" onClick={showNatural}>{edges.naturalButton}</Button>
            <p role="status" className="text-secondary">{naturalShown ? edges.naturalResult : null}</p>
          </section>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: edges.backLabel, onClick: () => goTo('same') }} next={isCompleted('edges') ? { label: edges.nextLabel, onClick: () => goTo('guitar') } : undefined} />
    </div>}

    {visibleStep === 'guitar' && <div className="space-y-5">
      <LessonStep title={guitar.title} intro={guitar.instruction} shouldFocus={focusedStep === 'guitar'}>
        <div className="space-y-6">
          <RealWorldExperiment title={guitar.experiment.title} withGuitar={guitar.experiment.withGuitar} withoutGuitar={guitar.experiment.withoutGuitar} safetyNote={guitar.experiment.safety} />
          {audio.enabled && <div className="flex flex-wrap gap-3">
            <Button color="secondary" size="lg" onClick={() => audio.playPluck(guitarStringHertz)}>{guitar.listenString}</Button>
            <Button color="secondary" size="lg" onClick={() => audio.playPluck(guitarSemitoneFrequency)}>{guitar.listenSemitone}</Button>
          </div>}
          {toggle}
          <p className="text-lg font-medium text-primary">{guitar.question}</p>
          <p className="text-sm text-tertiary">{guitar.note}</p>
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: guitar.backLabel, onClick: () => goTo('edges') }} next={{ label: guitar.nextLabel, onClick: () => advance('guitar', 'checkpoint') }} />
    </div>}

    {visibleStep === 'checkpoint' && <div className="space-y-5">
      <LessonStep title={checkpoint.title} intro={checkpoint.instruction} shouldFocus={focusedStep === 'checkpoint'}>
        <AccidentalCheckpoint content={checkpoint} keys={{ label: keyRowLabel, base: baseFrequency, keyLabel: (key, frequency) => lessonNineContent.keyLabel(key, isWhiteKey(key) ? colors.white : colors.black, frequency, []), onPlay: pressKey }} passed={progress.checkpointPassed} onPass={passCheckpoint} />
      </LessonStep>
      <LessonStepNav back={{ label: checkpoint.backLabel, onClick: () => goTo('guitar') }} next={progress.checkpointPassed ? { label: checkpoint.nextLabel, onClick: () => goTo('complete') } : undefined} />
    </div>}

    {visibleStep === 'complete' && <div className="space-y-5">
      <LessonStep title={complete.title} shouldFocus={focusedStep === 'complete'}>
        <div className="space-y-6">
          <section aria-labelledby="nine-summary" className="space-y-3">
            <h3 id="nine-summary" className="font-semibold text-primary">{complete.summaryTitle}</h3>
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
          {progress.completedAt !== null && <section aria-labelledby="nine-bridge" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
            <h3 id="nine-bridge" className="font-semibold text-primary">{complete.bridgeTitle}</h3>
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
