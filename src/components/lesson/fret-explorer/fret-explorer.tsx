import { Button } from '@/components/base/buttons/button';
import { ChoiceQuestion } from '@/components/lesson/choice-question/choice-question';
import { FretBoard } from '@/components/lesson/fret-board/fret-board';
import { useFretExplorer } from '@/components/lesson/fret-explorer/hooks/use-fret-explorer';
import type { ExplorerMode, FretExplorerProps } from '@/components/lesson/fret-explorer/types';
import { noteOptions } from '@/components/lesson/fret-explorer/utils/choices';
import { KeyRow } from '@/components/lesson/key-row/key-row';
import { lastFret } from '@/data/lessons/stage-03-lesson-01-model/constants';
import { fretFrequency, fretSemitones, hertz, noteAtFret, sharpFrets } from '@/data/lessons/stage-03-lesson-01-model/utils/frets';

const allFrets = Array.from({ length: lastFret + 1 }, (_, fret) => fret);
const modeIds: readonly ExplorerMode[] = ['explore', 'predict'];

export function FretExplorer({ content, board, openString, predictFrets, audioEnabled, keyRowLabel, keyLabel, describe, onPlay, onSolved }: FretExplorerProps) {
  const { mode, setMode, fret, selectFret, pressKey, task, taskSolved, allSolved, answer, nextTask } = useFretExplorer({ predictFrets, onPlay, onSolved, openString });
  const note = noteAtFret(openString.openKey, fret);
  const frequency = fretFrequency(openString.frequency, fret);
  const narrowKeys = sharpFrets(openString.openKey, lastFret + 1);
  const predictFret = predictFrets[task];
  const correct = noteAtFret(openString.openKey, predictFret);
  return <div className="space-y-6">
    <div role="group" aria-label={content.modeLabel} className="flex flex-wrap gap-3">
      {modeIds.map((id) => <Button key={id} color={mode === id ? 'primary' : 'secondary'} aria-pressed={mode === id} onClick={() => setMode(id)}>{content.modes[id]}</Button>)}
    </div>

    {mode === 'explore' && <div className="space-y-5">
      <FretBoard content={board} selected={fret} selectable={allFrets} onSelect={selectFret} describe={describe} showLength />
      <div className="flex flex-wrap gap-3">
        <Button color="secondary" isDisabled={fret === 0} onClick={() => selectFret(fret - 1)}>{content.stepDown}</Button>
        <Button color="secondary" isDisabled={fret === lastFret} onClick={() => selectFret(fret + 1)}>{content.stepUp}</Button>
      </div>
      <KeyRow label={keyRowLabel} count={lastFret + 1} base={openString.frequency} keyLabel={keyLabel} onPlay={pressKey} highlighted={[fret]} narrowKeys={narrowKeys} captions={{ [fret]: note }} />
      <dl role="status" className="grid grid-cols-2 gap-3 rounded-lg border border-secondary bg-primary p-5 sm:grid-cols-4">
        {[[content.fretLabel, String(fret)], [content.semitonesLabel, String(fretSemitones(fret))], [content.noteLabel, note], [content.frequencyLabel, hertz(frequency)]].map(([term, value]) => <div key={term}>
          <dt className="text-sm text-tertiary">{term}</dt>
          <dd className="text-lg font-semibold tabular-nums text-primary">{value}</dd>
        </div>)}
      </dl>
      <div className="flex flex-wrap items-center gap-3">
        {audioEnabled ? <Button color="secondary" size="lg" onClick={() => onPlay(frequency)}>{content.play}</Button> : <p className="text-secondary">{content.withoutAudio}</p>}
      </div>
      <p className="text-secondary">{content.exploreHint(openString.openNote)}</p>
      <Button onClick={() => setMode('predict')}>{content.startPredict}</Button>
    </div>}

    {mode === 'predict' && <section aria-labelledby="explorer-predict" className="space-y-4">
      <h3 id="explorer-predict" className="font-semibold text-primary">{content.predictTitle}</h3>
      <p role="status" className="text-sm text-secondary">{content.predictPrompt(allSolved ? predictFrets.length : task + (taskSolved ? 1 : 0), predictFrets.length)}</p>
      {!allSolved && <>
        <FretBoard content={board} selected={predictFret} describe={describe} />
        <ChoiceQuestion
          key={task}
          question={content.predictQuestion(predictFret)}
          choices={noteOptions(openString.openKey, predictFret).map((name) => ({ id: name, label: name, feedback: name === correct ? content.explain(predictFret, name, openString.openNote) : `Ні: ${content.explain(predictFret, correct, openString.openNote)}` }))}
          correctChoiceId={correct}
          onCheck={(_choiceId, isCorrect) => answer(isCorrect)}
        />
        {taskSolved && task < predictFrets.length - 1 && <Button onClick={nextTask}>{content.nextTask}</Button>}
      </>}
      {allSolved && <>
        <p className="rounded-lg border border-utility-brand-200 bg-brand-primary_alt p-5 text-secondary">{content.rule}</p>
        <section aria-labelledby="explorer-table" className="space-y-2">
          <h3 id="explorer-table" className="font-semibold text-primary">{content.tableTitle}</h3>
          <ul className="grid grid-cols-2 gap-1 tabular-nums text-secondary sm:grid-cols-4">
            {allFrets.map((item) => <li key={item}>{content.tableRow(item, noteAtFret(openString.openKey, item))}</li>)}
          </ul>
        </section>
      </>}
    </section>}
  </div>;
}
