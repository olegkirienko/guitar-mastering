import { CheckCircle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { KeyRow } from '@/components/lesson/key-row/key-row';
import { LessonAudioToggle } from '@/components/lesson/lesson-audio-toggle/lesson-audio-toggle';
import { LessonProgressPanel } from '@/components/lesson/lesson-progress-panel/lesson-progress-panel';
import { LessonRouteFallback } from '@/components/lesson/lesson-route-fallback/lesson-route-fallback';
import { LessonShell } from '@/components/lesson/lesson-shell/lesson-shell';
import { LessonStepNav } from '@/components/lesson/lesson-step-nav/lesson-step-nav';
import { LessonStep } from '@/components/lesson/lesson-step/lesson-step';
import { NoteNameCheckpoint } from '@/components/lesson/note-name-checkpoint/note-name-checkpoint';
import { PairGaps } from '@/components/lesson/pair-gaps/pair-gaps';
import { RealWorldExperiment } from '@/components/lesson/real-world-experiment/real-world-experiment';
import { ToneSequence } from '@/components/lesson/tone-sequence/tone-sequence';
import { introAllKeys, introWhiteKeys, lessonEightContent } from '@/data/lessons/stage-02-lesson-03/constants';
import { keyFrequency } from '@/data/lessons/stage-02-lesson-02-model/utils/keys';
import { baseFrequency, blackKeyPositions, keyOfA, lastKeyNumber, noteSyllables, whiteKeyPositions } from '@/data/lessons/stage-02-lesson-03-model/constants';
import { isWhiteKey, noteNameOf } from '@/data/lessons/stage-02-lesson-03-model/utils/keys';
import { toneGain, useLessonEightPage } from '@/pages/lesson-eight-page/hooks/use-lesson-eight-page';

const introSequences = [
  { id: 'all', label: lessonEightContent.intro.allLabel, frequencies: introAllKeys.map((key) => keyFrequency(baseFrequency, key)) },
  { id: 'white', label: lessonEightContent.intro.whiteLabel, frequencies: introWhiteKeys.map((key) => keyFrequency(baseFrequency, key)) },
];

export function LessonEightPage() {
  const { restartLesson, route, progress, sync, retrySync, preferencesSaveFailed, audioEnabled, focusedStep, visibleStep, isCompleted, audio, goTo, advance, toggleAudio, audioMessage, finishLesson, finishStatus, pressedKeys, pressKey, captions, blackPressed, anchorFound, patternPredicted, answerPattern, whitesFound, pairChoices, choosePair, revealPattern, patternDone, finishPattern, answerNames, answerAnchor, passCheckpoint } = useLessonEightPage();
  const { intro, look, pattern, names, anchor, guitar, checkpoint, complete, keyRowLabel, colors } = lessonEightContent;
  if (route.kind !== 'ready') return <LessonRouteFallback route={route} />;
  const toggle = <LessonAudioToggle audioEnabled={audioEnabled} blocked={audio.status === 'blocked'} message={audioMessage} onToggle={toggleAudio} />;
  // Letters appear over the keys (and in their names) only where the learner has opened them.
  const row = (captioned = false) => <KeyRow
    label={keyRowLabel}
    count={lastKeyNumber + 1}
    base={baseFrequency}
    keyLabel={(key, frequency) => lessonEightContent.keyLabel(key, isWhiteKey(key) ? colors.white : colors.black, frequency, captioned ? (captions[key] ?? null) : null)}
    onPlay={pressKey}
    highlighted={pressedKeys}
    narrowKeys={blackKeyPositions}
    captions={captioned ? captions : undefined}
  />;
  return <LessonShell {...lessonEightContent} steps={route.steps} currentStepId={route.stepId} onRestart={restartLesson}>
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
        <p className="text-lg font-medium text-primary">{intro.question}</p>
        <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary">{intro.discovery}</p>
        <LessonStepNav next={{ label: intro.nextLabel, onClick: () => advance('intro', 'look') }} />
      </div>
    </LessonStep>}

    {visibleStep === 'look' && <div className="space-y-5">
      <LessonStep title={look.title} intro={look.instruction} shouldFocus={focusedStep === 'look'}>
        <div className="space-y-6">
          <p className="text-secondary">{look.task}</p>
          {row()}
          {!audio.enabled && <p className="text-secondary">{look.withoutAudio}</p>}
          <p role="status" className="text-sm text-secondary">{look.pressedStatus(pressedKeys.length)}</p>
          {toggle}
          {pressedKeys.length > 0 && <>
            <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary">{look.landmark}</p>
            <p className="text-lg font-medium text-primary">{look.pattern}</p>
          </>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: look.backLabel, onClick: () => goTo('intro') }} next={{ label: look.nextLabel, onClick: () => advance('look', 'pattern') }} />
    </div>}

    {visibleStep === 'pattern' && <div className="space-y-5">
      <LessonStep title={pattern.title} intro={pattern.instruction} shouldFocus={focusedStep === 'pattern'}>
        <div className="space-y-6">
          <ChoiceQuestion question={pattern.prediction.question} choices={pattern.prediction.choices} correctChoiceId={pattern.prediction.correctChoiceId} mode="prediction" onCheck={answerPattern} />
          {patternPredicted && <>
            <section className="space-y-3">
              <p className="text-secondary">{pattern.countTask}</p>
              {row()}
              {!audio.enabled && <p className="text-secondary">{pattern.withoutAudio}</p>}
              <p role="status" className="text-sm text-secondary">{blackPressed ? pattern.whiteKeyOnly : pattern.countStatus(whitesFound)}</p>
              {toggle}
            </section>
            <section aria-labelledby="eight-pairs" className="space-y-3">
              <h3 id="eight-pairs" className="font-semibold text-primary">{pattern.pairsTitle}</h3>
              <p className="text-secondary">{pattern.pairsInstruction}</p>
              <PairGaps content={pattern.pairs} base={baseFrequency} audio={audio} gain={toneGain} choices={pairChoices} onChoose={choosePair} />
              <Button color="tertiary" onClick={revealPattern}>{pattern.revealLabel}</Button>
            </section>
          </>}
          {patternDone && <>
            <p className="text-lg font-medium tabular-nums text-primary">{pattern.sequenceTitle}: {pattern.sequence}</p>
            <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary">{pattern.observation}</p>
            <p className="text-lg font-medium text-primary">{pattern.question}</p>
          </>}
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: pattern.backLabel, onClick: () => goTo('look') }} next={patternDone ? { label: pattern.nextLabel, onClick: finishPattern } : undefined} />
    </div>}

    {visibleStep === 'names' && <div className="space-y-5">
      <LessonStep title={names.title} intro={names.instruction} shouldFocus={focusedStep === 'names'}>
        <div className="space-y-6">
          <section aria-labelledby="eight-term" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
            <h3 id="eight-term" className="font-semibold text-primary">{names.title}</h3>
            <p className="mt-2 text-secondary">{names.term}</p>
          </section>
          <section className="space-y-3">
            <p className="text-secondary">{names.task}</p>
            {row(true)}
            {!audio.enabled && <p className="text-secondary">{names.withoutAudio}</p>}
            <p role="status" className="text-sm text-secondary">{blackPressed ? names.blackNote : names.revealedStatus(Object.keys(captions).length)}</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary">
              {noteSyllables.map((syllable, index) => <li key={syllable}>{names.syllableLabel(noteNameOf(whiteKeyPositions[index]) ?? '', syllable)}</li>)}
            </ul>
            {toggle}
          </section>
          <p className="text-secondary">{names.repeat}</p>
          <p className="text-secondary">{names.pairsNote}</p>
          <p className="text-sm text-tertiary">{names.landmark}</p>
          <ChoiceQuestion question={names.question.question} choices={names.question.choices} correctChoiceId={names.question.correctChoiceId} onCheck={answerNames} />
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: names.backLabel, onClick: () => goTo('pattern') }} next={isCompleted('names') ? { label: names.nextLabel, onClick: () => goTo('anchor') } : undefined} />
    </div>}

    {visibleStep === 'anchor' && <div className="space-y-5">
      <LessonStep title={anchor.title} intro={anchor.instruction} shouldFocus={focusedStep === 'anchor'}>
        <div className="space-y-6">
          <p className="text-secondary">{anchor.reminder}</p>
          <section className="space-y-3">
            <p className="text-secondary">{anchor.findTask}</p>
            {row()}
            {!audio.enabled && <p className="text-secondary">{anchor.withoutAudio}</p>}
            <p role="status" className="text-sm text-secondary">{anchorFound ? `A: ${keyFrequency(baseFrequency, keyOfA).toFixed(1).replace('.', ',')} Гц` : null}</p>
            {toggle}
          </section>
          <h3 className="font-semibold text-primary">{anchor.questionsTitle}</h3>
          {anchor.questions.map((item) => <ChoiceQuestion key={item.id} question={item.question} choices={item.choices} correctChoiceId={item.correctChoiceId} onCheck={(_choiceId, isCorrect) => answerAnchor(item.id, isCorrect)} />)}
          <p className="text-sm text-tertiary">{anchor.note}</p>
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: anchor.backLabel, onClick: () => goTo('names') }} next={isCompleted('anchor') ? { label: anchor.nextLabel, onClick: () => goTo('guitar') } : undefined} />
    </div>}

    {visibleStep === 'guitar' && <div className="space-y-5">
      <LessonStep title={guitar.title} intro={guitar.instruction} shouldFocus={focusedStep === 'guitar'}>
        <div className="space-y-6">
          <RealWorldExperiment title={guitar.experiment.title} withGuitar={guitar.experiment.withGuitar} withoutGuitar={guitar.experiment.withoutGuitar} safetyNote={guitar.experiment.safety} />
          {audio.enabled && <div className="flex flex-wrap gap-3">
            <Button color="secondary" size="lg" onClick={() => audio.playPluck(110)}>{guitar.listenString}</Button>
            <Button color="secondary" size="lg" onClick={() => audio.playTone(110, toneGain)}>{guitar.listenKey}</Button>
          </div>}
          {toggle}
          <p className="text-lg font-medium text-primary">{guitar.question}</p>
          <p className="text-sm text-tertiary">{guitar.note}</p>
        </div>
      </LessonStep>
      <LessonStepNav back={{ label: guitar.backLabel, onClick: () => goTo('anchor') }} next={{ label: guitar.nextLabel, onClick: () => advance('guitar', 'checkpoint') }} />
    </div>}

    {visibleStep === 'checkpoint' && <div className="space-y-5">
      <LessonStep title={checkpoint.title} intro={checkpoint.instruction} shouldFocus={focusedStep === 'checkpoint'}>
        <NoteNameCheckpoint content={checkpoint} keys={{ label: keyRowLabel, base: baseFrequency, keyLabel: (key, frequency) => lessonEightContent.keyLabel(key, isWhiteKey(key) ? colors.white : colors.black, frequency, null), onPlay: pressKey }} passed={progress.checkpointPassed} onPass={passCheckpoint} />
      </LessonStep>
      <LessonStepNav back={{ label: checkpoint.backLabel, onClick: () => goTo('guitar') }} next={progress.checkpointPassed ? { label: checkpoint.nextLabel, onClick: () => goTo('complete') } : undefined} />
    </div>}

    {visibleStep === 'complete' && <div className="space-y-5">
      <LessonStep title={complete.title} shouldFocus={focusedStep === 'complete'}>
        <div className="space-y-6">
          <section aria-labelledby="eight-summary" className="space-y-3">
            <h3 id="eight-summary" className="font-semibold text-primary">{complete.summaryTitle}</h3>
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
          {progress.completedAt !== null && <section aria-labelledby="eight-bridge" className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5">
            <h3 id="eight-bridge" className="font-semibold text-primary">{complete.bridgeTitle}</h3>
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
