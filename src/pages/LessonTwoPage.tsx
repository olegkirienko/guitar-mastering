import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { useState } from 'react';
import { ChoiceQuestion } from '@/components/lesson/ChoiceQuestion';
import { LessonProgressPanel } from '@/components/lesson/LessonProgressPanel';
import { LessonShell } from '@/components/lesson/LessonShell';
import { LessonStep } from '@/components/lesson/LessonStep';
import { SameStringPitchExperience, type PitchPath } from '@/components/lesson/SameStringPitchExperience';
import { lessonTwoContent, type LessonTwoStepId } from '@/data/lessons/stage-01-lesson-02';
import { useLessonTwoProgress } from '@/progress/useLessonTwoProgress';

const stopByStep: Record<LessonTwoStepId, number> = {
  intro: 1,
  string: 1,
  repeats: 2,
  frequency: 3,
  loudness: 3,
  guitar: 4,
  checkpoint: 5,
  complete: 5,
};

export function LessonTwoPage() {
  const {
    progress,
    setProgress,
    storageAvailable,
    sync,
    accountState,
    importGuestProgress,
    confirmGuestImport,
    keepGuestProgressSeparate,
    clearCurrentAccountCache,
    retrySync,
  } = useLessonTwoProgress();
  const [preferredPath, setPreferredPath] = useState<PitchPath>('guitar');
  const [stringReady, setStringReady] = useState(false);
  const [focusedStep, setFocusedStep] = useState<LessonTwoStepId | null>(null);
  const { intro, string } = lessonTwoContent;
  const isIntroStep = progress.currentStepId === 'intro';
  const stringCompleted = progress.completedStepIds.includes('string');

  const completeStep = (step: LessonTwoStepId) => setProgress((current) => ({
    ...current,
    completedStepIds: Array.from(new Set<LessonTwoStepId>([...current.completedStepIds, step])),
  }));
  const begin = (path: PitchPath) => {
    setPreferredPath(path);
    setFocusedStep('string');
    setProgress((current) => ({
      ...current,
      currentStepId: 'string',
      completedStepIds: Array.from(new Set<LessonTwoStepId>([...current.completedStepIds, 'intro'])),
    }));
  };
  const backToIntro = () => {
    setFocusedStep('intro');
    setProgress((current) => ({ ...current, currentStepId: 'intro' }));
  };

  return <LessonShell {...lessonTwoContent} currentStop={stopByStep[progress.currentStepId]} backTo="/">
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
    {isIntroStep ? <LessonStep title={intro.title} intro={intro.invitation} shouldFocus={focusedStep === 'intro'}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-700" aria-label="Що ми вже знаємо з уроку 1">
        {intro.chain.map((link, index) => <li key={link} className="flex items-center gap-2">
          {index > 0 && <ArrowRight className="size-4 text-gray-400" aria-hidden="true" />}
          <span className="rounded-md bg-gray-100 px-2 py-1">{link}</span>
        </li>)}
      </ol>
      <div className="mt-5 rounded-lg border border-brand-200 bg-brand-25 p-5">
        <p className="text-lg font-medium text-gray-950">{intro.question}</p>
        <p className="mt-2 text-sm text-gray-600">{intro.hypothesisNote}</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => begin('guitar')} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
          {intro.guitarLabel}<ArrowRight className="size-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => begin('virtual')} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-600 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 outline-none hover:bg-brand-25 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
          {intro.virtualLabel}
        </button>
      </div>
      <p className="mt-4 text-sm text-gray-600">{intro.reassurance}</p>
    </LessonStep> : <div className="space-y-5">
      <LessonStep title={string.title} intro={string.instruction} shouldFocus={focusedStep === 'string'}>
        <SameStringPitchExperience content={string} preferredPath={preferredPath} onReady={() => setStringReady(true)} />
        {(stringReady || stringCompleted) && <div className="mt-6">
          <ChoiceQuestion
            question={string.question}
            choices={string.choices}
            correctChoiceId={string.correctChoiceId}
            onCheck={(_choiceId, isCorrect) => { if (isCorrect) completeStep('string'); }}
          />
        </div>}
      </LessonStep>
      <button type="button" onClick={backToIntro} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
        <ArrowLeft className="size-4" aria-hidden="true" />{string.backLabel}
      </button>
    </div>}
  </LessonShell>;
}
