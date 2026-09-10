import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { useEffect, useState } from 'react';
import { LessonShell } from '@/components/lesson/LessonShell';
import { LessonStep } from '@/components/lesson/LessonStep';
import { RealWorldExperiment } from '@/components/lesson/RealWorldExperiment';
import { SoundPropagationLab } from '@/components/lesson/SoundPropagationLab';
import { VirtualGuitarString } from '@/components/lesson/VirtualGuitarString';
import { lessonOneContent, type LessonOneStepId } from '@/data/lessons/stage-01-lesson-01';

type LessonOneProgress = { currentStepId: LessonOneStepId; completedStepIds: LessonOneStepId[]; audioEnabled: boolean; prefersStatic: boolean; };
type StoredProgress = { progress: LessonOneProgress; storageAvailable: boolean; };
const storageKey = 'guitar-mastering:stage-01-lesson-01';
const defaultProgress: LessonOneProgress = { currentStepId: 'intro', completedStepIds: [], audioEnabled: false, prefersStatic: false };

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
      currentStepId: progress.currentStepId === 'air' ? 'air' : progress.currentStepId === 'string' ? 'string' : 'intro',
      completedStepIds: Array.isArray(progress.completedStepIds) ? progress.completedStepIds.filter((id): id is LessonOneStepId => id === 'intro' || id === 'string' || id === 'air') : [],
      audioEnabled: progress.audioEnabled === true,
      prefersStatic: progress.prefersStatic === true,
    }, storageAvailable: true };
  } catch { return { progress: defaultProgress, storageAvailable: true }; }
}

export function LessonOnePage() {
  const [storedProgress] = useState(readProgress);
  const [progress, setProgress] = useState<LessonOneProgress>(storedProgress.progress);
  const [storageAvailable, setStorageAvailable] = useState(storedProgress.storageAvailable);
  const [shouldFocusIntro, setShouldFocusIntro] = useState(false);
  const [shouldFocusString, setShouldFocusString] = useState(false);
  const [shouldFocusAir, setShouldFocusAir] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isStringStep = progress.currentStepId === 'string';
  const isAirStep = progress.currentStepId === 'air';
  const staticMode = prefersReducedMotion || progress.prefersStatic;
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch { setStorageAvailable(false); } }, [progress]);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);
  const begin = () => { setShouldFocusIntro(false); setShouldFocusString(true); setProgress((current) => ({ ...current, currentStepId: 'string', completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'intro'])) })); };

  const openAirLab = () => { setShouldFocusString(false); setShouldFocusAir(true); setProgress((current) => ({ ...current, currentStepId: 'air' })); };

  return <LessonShell {...lessonOneContent} currentStop={isAirStep ? 4 : 1} backTo="/">
    <div className="mb-4 text-sm text-gray-600" aria-live="polite">
      {storageAvailable ? 'Прогрес зберігається на цьому пристрої.' : 'Збереження недоступне — прогрес доступний лише протягом цього сеансу.'}
    </div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="min-w-0 flex-1 text-sm leading-6 text-gray-600">
        <p className="font-semibold text-gray-950">Рух на екрані</p>
        <p>{prefersReducedMotion ? 'Системне налаштування зменшеного руху активне: досліди показуються покадрово.' : staticMode ? 'Покадровий режим активний. Кадри змінюються лише після твоєї дії.' : 'Короткі моделі можуть рухатися автоматично після запуску.'}</p>
      </div>
      <button type="button" disabled={prefersReducedMotion} aria-pressed={staticMode} onClick={() => setProgress((current) => ({ ...current, prefersStatic: !current.prefersStatic }))} className="min-h-11 shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
        {prefersReducedMotion ? 'Покадрово: системне' : staticMode ? 'Показувати рух' : 'Показувати покадрово'}
      </button>
    </div>
    {!isStringStep && !isAirStep ? <LessonStep title={lessonOneContent.intro.title} intro={lessonOneContent.intro.invitation} shouldFocus={shouldFocusIntro}>
      <div className="rounded-lg border border-brand-200 bg-brand-25 p-5"><p className="text-lg font-medium text-gray-950">{lessonOneContent.intro.question}</p><p className="mt-3 text-sm leading-6 text-gray-700">{lessonOneContent.intro.reassurance}</p></div>
      <button type="button" onClick={() => setProgress((current) => ({ ...current, audioEnabled: !current.audioEnabled }))} aria-pressed={progress.audioEnabled} className="mt-4 min-h-11 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">
        {progress.audioEnabled ? 'Звук: увімкнено' : 'Звук: вимкнено'}
      </button>
      <button type="button" onClick={begin} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{lessonOneContent.intro.startLabel}<ArrowRight className="size-4" /></button>
      <p className="mt-4 text-sm text-gray-600">Аудіо не запускається автоматично й не потрібне, щоб пройти урок.</p>
    </LessonStep> : isStringStep ? <div className="space-y-5">
      <LessonStep title={lessonOneContent.string.title} intro={lessonOneContent.string.instruction} shouldFocus={shouldFocusString}>
        <VirtualGuitarString observationChoices={lessonOneContent.string.observationChoices} predictionChoices={lessonOneContent.string.predictionChoices} audioEnabled={progress.audioEnabled} staticMode={staticMode} onAudioEnabledChange={(audioEnabled) => setProgress((current) => ({ ...current, audioEnabled }))} onExperimentComplete={() => setProgress((current) => ({ ...current, completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'string'])) }))} />
      </LessonStep>
      <RealWorldExperiment title={lessonOneContent.experiment.title} withGuitar={lessonOneContent.experiment.guitar} withoutGuitar={lessonOneContent.experiment.alternative} safetyNote={lessonOneContent.experiment.safety} />
      {progress.completedStepIds.includes('string') && <button type="button" onClick={openAirLab} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Дослідити рух у повітрі<ArrowRight className="size-4" /></button>}
      <button type="button" onClick={() => { setShouldFocusString(false); setShouldFocusIntro(true); setProgress((current) => ({ ...current, currentStepId: 'intro' })); }} className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-gray-700 outline-none hover:text-gray-950 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><ArrowLeft className="size-4" />До вступу</button>
    </div> : <div className="space-y-5">
      <LessonStep title={lessonOneContent.air.title} intro={lessonOneContent.air.instruction} shouldFocus={shouldFocusAir}>
        <SoundPropagationLab content={lessonOneContent.air} staticMode={staticMode} onComplete={() => setProgress((current) => ({ ...current, completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'air'])) }))} />
      </LessonStep>
      <RealWorldExperiment title={lessonOneContent.air.experiment.title} withGuitar={lessonOneContent.air.experiment.guitar} withoutGuitar={lessonOneContent.air.experiment.alternative} safetyNote={lessonOneContent.air.experiment.safety} />
      <button type="button" onClick={() => { setShouldFocusAir(false); setShouldFocusString(true); setProgress((current) => ({ ...current, currentStepId: 'string' })); }} className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-gray-700 outline-none hover:text-gray-950 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><ArrowLeft className="size-4" />До досліду зі струною</button>
    </div>}
  </LessonShell>;
}
