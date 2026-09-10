import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { useEffect, useState } from 'react';
import { LessonShell } from '@/components/lesson/LessonShell';
import { LessonStep } from '@/components/lesson/LessonStep';
import { RealWorldExperiment } from '@/components/lesson/RealWorldExperiment';
import { lessonOneContent, type LessonOneStepId } from '@/data/lessons/stage-01-lesson-01';

type LessonOneProgress = { currentStepId: LessonOneStepId; completedStepIds: LessonOneStepId[]; };
type StoredProgress = { progress: LessonOneProgress; storageAvailable: boolean; };
const storageKey = 'guitar-mastering:stage-01-lesson-01';
const defaultProgress: LessonOneProgress = { currentStepId: 'intro', completedStepIds: [] };

function readProgress(): StoredProgress {
  let stored: string | null;
  try {
    stored = localStorage.getItem(storageKey);
  } catch { return { progress: defaultProgress, storageAvailable: false }; }
  if (!stored) return { progress: defaultProgress, storageAvailable: true };
  try {
    const value: unknown = JSON.parse(stored);
    if (!value || typeof value !== 'object') return { progress: defaultProgress, storageAvailable: true };
    const progress = value as Partial<LessonOneProgress>;
    return { progress: {
      currentStepId: progress.currentStepId === 'string' ? 'string' : 'intro',
      completedStepIds: Array.isArray(progress.completedStepIds) ? progress.completedStepIds.filter((id): id is LessonOneStepId => id === 'intro' || id === 'string') : [],
    }, storageAvailable: true };
  } catch { return { progress: defaultProgress, storageAvailable: true }; }
}

export function LessonOnePage() {
  const [storedProgress] = useState(readProgress);
  const [progress, setProgress] = useState<LessonOneProgress>(storedProgress.progress);
  const [storageAvailable, setStorageAvailable] = useState(storedProgress.storageAvailable);
  const [shouldFocusIntro, setShouldFocusIntro] = useState(false);
  const [shouldFocusString, setShouldFocusString] = useState(false);
  const isStringStep = progress.currentStepId === 'string';
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch { setStorageAvailable(false); } }, [progress]);
  const begin = () => { setShouldFocusIntro(false); setShouldFocusString(true); setProgress((current) => ({ ...current, currentStepId: 'string', completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'intro'])) })); };

  return <LessonShell {...lessonOneContent} currentStop={1} backTo="/">
    <div className="mb-4 text-sm text-gray-600" aria-live="polite">
      {storageAvailable ? 'Прогрес зберігається на цьому пристрої.' : 'Збереження недоступне — прогрес доступний лише протягом цього сеансу.'}
    </div>
    {!isStringStep ? <LessonStep title={lessonOneContent.intro.title} intro={lessonOneContent.intro.invitation} shouldFocus={shouldFocusIntro}>
      <div className="rounded-lg border border-brand-200 bg-brand-25 p-5"><p className="text-lg font-medium text-gray-950">{lessonOneContent.intro.question}</p><p className="mt-3 text-sm leading-6 text-gray-700">{lessonOneContent.intro.reassurance}</p></div>
      <button type="button" onClick={begin} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{lessonOneContent.intro.startLabel}<ArrowRight className="size-4" /></button>
      <p className="mt-4 text-sm text-gray-600">Аудіо не запускається автоматично й не потрібне, щоб пройти урок.</p>
    </LessonStep> : <div className="space-y-5">
      <LessonStep title={lessonOneContent.string.title} intro={lessonOneContent.string.instruction} shouldFocus={shouldFocusString}>
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center"><p className="font-semibold text-gray-950">{lessonOneContent.string.placeholderTitle}</p><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">{lessonOneContent.string.placeholderDescription}</p></div>
      </LessonStep>
      <RealWorldExperiment title={lessonOneContent.experiment.title} withGuitar={lessonOneContent.experiment.guitar} withoutGuitar={lessonOneContent.experiment.alternative} safetyNote={lessonOneContent.experiment.safety} />
      <button type="button" onClick={() => { setShouldFocusString(false); setShouldFocusIntro(true); setProgress((current) => ({ ...current, currentStepId: 'intro' })); }} className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-gray-700 outline-none hover:text-gray-950 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><ArrowLeft className="size-4" />До вступу</button>
    </div>}
  </LessonShell>;
}
