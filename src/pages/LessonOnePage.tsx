import { ArrowLeft, ArrowRight, CheckCircle } from '@untitledui/icons';
import { useEffect, useState } from 'react';
import { LessonShell } from '@/components/lesson/LessonShell';
import { LessonStep } from '@/components/lesson/LessonStep';
import { RealWorldExperiment } from '@/components/lesson/RealWorldExperiment';
import { SoundPropagationLab } from '@/components/lesson/SoundPropagationLab';
import { SoundPathCheckpoint } from '@/components/lesson/SoundPathCheckpoint';
import { VirtualGuitarString } from '@/components/lesson/VirtualGuitarString';
import { lessonOneContent, type LessonOneStepId } from '@/data/lessons/stage-01-lesson-01';

type LessonOneProgress = { currentStepId: LessonOneStepId; completedStepIds: LessonOneStepId[]; audioEnabled: boolean; prefersStatic: boolean; checkpointPassed: boolean; completedAt?: string; };
type StoredProgress = { progress: LessonOneProgress; storageAvailable: boolean; };
const storageKey = 'guitar-mastering:stage-01-lesson-01';
const defaultProgress: LessonOneProgress = { currentStepId: 'intro', completedStepIds: [], audioEnabled: false, prefersStatic: false, checkpointPassed: false };

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
    const completedAt = typeof progress.completedAt === 'string' && Number.isFinite(Date.parse(progress.completedAt)) ? progress.completedAt : undefined;
    const checkpointPassed = progress.checkpointPassed === true || completedAt !== undefined;
    const currentStepId = progress.currentStepId === 'complete' && checkpointPassed
      ? 'complete'
      : progress.currentStepId === 'checkpoint'
        ? 'checkpoint'
        : progress.currentStepId === 'air'
          ? 'air'
          : progress.currentStepId === 'string'
            ? 'string'
            : progress.currentStepId === 'intro'
              ? 'intro'
              : completedAt
                ? 'complete'
                : 'intro';
    const completedStepIds = Array.isArray(progress.completedStepIds)
      ? progress.completedStepIds.filter((id): id is LessonOneStepId => id === 'intro' || id === 'string' || id === 'air' || id === 'checkpoint' || id === 'complete')
      : [];
    return { progress: {
      currentStepId,
      completedStepIds: completedAt ? Array.from(new Set<LessonOneStepId>([...completedStepIds, 'checkpoint', 'complete'])) : completedStepIds,
      audioEnabled: progress.audioEnabled === true,
      prefersStatic: progress.prefersStatic === true,
      checkpointPassed,
      completedAt,
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
  const [shouldFocusCheckpoint, setShouldFocusCheckpoint] = useState(false);
  const [shouldFocusComplete, setShouldFocusComplete] = useState(false);
  const [reflection, setReflection] = useState('');
  const [explainedAloud, setExplainedAloud] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isStringStep = progress.currentStepId === 'string';
  const isAirStep = progress.currentStepId === 'air';
  const isCheckpointStep = progress.currentStepId === 'checkpoint';
  const isCompleteStep = progress.currentStepId === 'complete';
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
  const openCheckpoint = () => { setShouldFocusAir(false); setShouldFocusCheckpoint(true); setProgress((current) => ({ ...current, currentStepId: 'checkpoint' })); };
  const openCompletion = () => { setShouldFocusCheckpoint(false); setShouldFocusComplete(true); setProgress((current) => ({ ...current, currentStepId: 'complete' })); };
  const finishLesson = () => setProgress((current) => ({
    ...current,
    completedAt: current.completedAt ?? new Date().toISOString(),
    completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'complete'])),
  }));

  return <LessonShell {...lessonOneContent} currentStop={isCheckpointStep || isCompleteStep ? 5 : isAirStep ? 4 : 1} backTo="/">
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
    {!isStringStep && !isAirStep && !isCheckpointStep && !isCompleteStep ? <LessonStep title={lessonOneContent.intro.title} intro={lessonOneContent.intro.invitation} shouldFocus={shouldFocusIntro}>
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
    </div> : isAirStep ? <div className="space-y-5">
      <LessonStep title={lessonOneContent.air.title} intro={lessonOneContent.air.instruction} shouldFocus={shouldFocusAir}>
        <SoundPropagationLab content={lessonOneContent.air} staticMode={staticMode} onComplete={() => setProgress((current) => ({ ...current, completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'air'])) }))} />
      </LessonStep>
      <RealWorldExperiment title={lessonOneContent.air.experiment.title} withGuitar={lessonOneContent.air.experiment.guitar} withoutGuitar={lessonOneContent.air.experiment.alternative} safetyNote={lessonOneContent.air.experiment.safety} />
      {progress.completedStepIds.includes('air') && <button type="button" onClick={openCheckpoint} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Зібрати шлях звуку<ArrowRight className="size-4" /></button>}
      <button type="button" onClick={() => { setShouldFocusAir(false); setShouldFocusString(true); setProgress((current) => ({ ...current, currentStepId: 'string' })); }} className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-gray-700 outline-none hover:text-gray-950 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><ArrowLeft className="size-4" />До досліду зі струною</button>
    </div> : isCheckpointStep ? <div className="space-y-5">
      <LessonStep title={lessonOneContent.checkpoint.title} intro={lessonOneContent.checkpoint.instruction} shouldFocus={shouldFocusCheckpoint}>
        <SoundPathCheckpoint content={lessonOneContent.checkpoint} initiallyPassed={progress.checkpointPassed} onComplete={() => setProgress((current) => ({ ...current, checkpointPassed: true, completedStepIds: Array.from(new Set<LessonOneStepId>([...current.completedStepIds, 'checkpoint'])) }))} />
      </LessonStep>
      {progress.checkpointPassed && <button type="button" onClick={openCompletion} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Перейти до підсумку<ArrowRight className="size-4" /></button>}
      <button type="button" onClick={() => { setShouldFocusCheckpoint(false); setShouldFocusAir(true); setProgress((current) => ({ ...current, currentStepId: 'air' })); }} className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-gray-700 outline-none hover:text-gray-950 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><ArrowLeft className="size-4" />До досліду з повітрям</button>
    </div> : <div className="space-y-5">
      <LessonStep key={progress.completedAt ? 'completed' : 'completion'} title={progress.completedAt ? lessonOneContent.completion.completedTitle : lessonOneContent.completion.title} intro={lessonOneContent.completion.instruction} shouldFocus={shouldFocusComplete}>
        <div className="rounded-lg border border-brand-200 bg-brand-25 p-5">
          <p className="text-sm font-semibold text-brand-700">Повний шлях звуку</p>
          <p className="mt-2 text-base font-medium leading-7 text-gray-950">{lessonOneContent.completion.chain}</p>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-950">Три відкриття</h3>
          <ul className="mt-3 space-y-2">
            {lessonOneContent.completion.discoveries.map((discovery) => <li key={discovery} className="flex gap-3 text-sm leading-6 text-gray-700"><CheckCircle className="mt-0.5 size-5 shrink-0 text-success-600" aria-hidden="true" /><span>{discovery}</span></li>)}
          </ul>
        </div>
        {!progress.completedAt ? <div className="mt-7 border-t border-gray-200 pt-6">
          <label htmlFor="lesson-reflection" className="text-sm font-semibold text-gray-950">{lessonOneContent.completion.reflectionLabel}</label>
          <textarea id="lesson-reflection" value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder={lessonOneContent.completion.reflectionPlaceholder} rows={3} className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
          <p className="mt-2 text-xs leading-5 text-gray-500">Цей текст приватний і не зберігається.</p>
          <button type="button" aria-pressed={explainedAloud} onClick={() => setExplainedAloud((current) => !current)} className="mt-4 min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{explainedAloud ? 'Пояснення вголос позначено' : lessonOneContent.completion.spokenLabel}</button>
          <div><button type="button" onClick={finishLesson} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{lessonOneContent.completion.finishLabel}<CheckCircle className="size-4" /></button></div>
        </div> : <div className="mt-7 rounded-lg border border-success-200 bg-success-50 p-5" role="status" aria-live="polite">
          <p className="font-semibold text-gray-950">Урок завершено.</p>
          <p className="mt-1 text-sm leading-6 text-gray-700">{lessonOneContent.completion.completedMessage}</p>
        </div>}
        <div className="mt-8 border-t border-gray-200 pt-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Питання до наступного уроку</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-950">{lessonOneContent.completion.bridgeQuestion}</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-hidden="true">
            <div className="flex h-20 items-center rounded-lg border border-gray-200 bg-gray-50 px-5"><span className="h-1 w-full rounded-full bg-gray-700" /></div>
            <div className="flex h-20 items-center rounded-lg border border-gray-200 bg-gray-50 px-5"><span className="h-3 w-full rounded-full bg-gray-700" /></div>
          </div>
          <p className="mt-4 text-sm leading-6 text-gray-700">{lessonOneContent.completion.bridgeTeaser}</p>
          <p className="mt-3 text-sm leading-6 text-gray-600">{lessonOneContent.completion.experiment}</p>
        </div>
      </LessonStep>
      <button type="button" onClick={() => { setShouldFocusComplete(false); setShouldFocusCheckpoint(true); setProgress((current) => ({ ...current, currentStepId: 'checkpoint' })); }} className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-gray-700 outline-none hover:text-gray-950 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"><ArrowLeft className="size-4" />До шляху звуку</button>
    </div>}
  </LessonShell>;
}
