import { ArrowLeft, ArrowRight, CheckCircle } from '@untitledui/icons';
import { useEffect, useState } from 'react';
import { LessonShell } from '@/components/lesson/LessonShell';
import { LessonStep } from '@/components/lesson/LessonStep';
import { RealWorldExperiment } from '@/components/lesson/RealWorldExperiment';
import { SoundPropagationLab } from '@/components/lesson/SoundPropagationLab';
import { SoundPathCheckpoint } from '@/components/lesson/SoundPathCheckpoint';
import { VirtualGuitarString } from '@/components/lesson/VirtualGuitarString';
import { lessonOneContent, type LessonOneStepId } from '@/data/lessons/stage-01-lesson-01';
import { useLessonOneProgress } from '@/progress/useLessonOneProgress';

export function LessonOnePage() {
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
  } = useLessonOneProgress();
  const [shouldFocusIntro, setShouldFocusIntro] = useState(false);
  const [shouldFocusString, setShouldFocusString] = useState(false);
  const [shouldFocusAir, setShouldFocusAir] = useState(false);
  const [shouldFocusCheckpoint, setShouldFocusCheckpoint] = useState(false);
  const [shouldFocusComplete, setShouldFocusComplete] = useState(false);
  const [reflection, setReflection] = useState('');
  const [explainedAloud, setExplainedAloud] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [confirmCacheClear, setConfirmCacheClear] = useState(false);
  const [cacheClearMessage, setCacheClearMessage] = useState<string | null>(null);
  const isStringStep = progress.currentStepId === 'string';
  const isAirStep = progress.currentStepId === 'air';
  const isCheckpointStep = progress.currentStepId === 'checkpoint';
  const isCompleteStep = progress.currentStepId === 'complete';
  const staticMode = prefersReducedMotion || progress.prefersStatic;
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
      {!storageAvailable
        ? 'Збереження недоступне — прогрес доступний лише протягом цього сеансу.'
        : accountState === 'authenticated' && sync.status === 'pending'
          ? 'Збережено на цьому пристрої. Синхронізуємо з акаунтом…'
          : accountState === 'authenticated' && sync.status === 'synced'
            ? 'Прогрес збережено на цьому пристрої та в акаунті.'
            : accountState === 'authenticated' && sync.status === 'error'
              ? 'Збережено на цьому пристрої, але синхронізація не вдалася.'
              : accountState === 'unavailable'
                ? 'Прогрес зберігається на цьому пристрої. Сервер зараз недоступний.'
                : accountState === 'loading'
                  ? 'Прогрес зберігається на цьому пристрої. Перевіряємо акаунт…'
                  : 'Прогрес зберігається на цьому пристрої.'}
      {accountState === 'authenticated' && sync.status === 'error' && <button type="button" onClick={retrySync} className="ml-2 min-h-11 rounded-md px-2 font-semibold text-brand-700 underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-600">Повторити синхронізацію</button>}
    </div>
    {importGuestProgress && <section className="mb-5 rounded-lg border border-brand-200 bg-brand-25 p-4" aria-labelledby="guest-progress-title">
      <h2 id="guest-progress-title" className="font-semibold text-gray-950">Додати прогрес гостя до акаунта?</h2>
      <p className="mt-1 text-sm leading-6 text-gray-700">Ми об’єднаємо пройдені кроки на цьому пристрої з прогресом акаунта. Жоден завершений крок не буде втрачено.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={confirmGuestImport} className="min-h-11 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Об’єднати прогрес</button>
        <button type="button" onClick={keepGuestProgressSeparate} className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Залишити окремо</button>
      </div>
    </section>}
    {accountState === 'authenticated' && <section className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4" aria-labelledby="device-progress-title">
      <h2 id="device-progress-title" className="font-semibold text-gray-950">Прогрес на спільному пристрої</h2>
      <p className="mt-1 text-sm leading-6 text-gray-600">Можна видалити лише локальну копію прогресу цього акаунта. Прогрес на сервері, гостьовий прогрес та дані інших акаунтів залишаться.</p>
      {!confirmCacheClear ? <button type="button" disabled={sync.status === 'pending'} onClick={() => { setCacheClearMessage(null); setConfirmCacheClear(true); }} className="mt-3 min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">{sync.status === 'pending' ? 'Дочекайся синхронізації' : 'Очистити локальну копію'}</button> : <div className="mt-3" role="group" aria-labelledby="device-progress-confirmation">
        <p id="device-progress-confirmation" className="text-sm font-semibold text-gray-950">Очистити локальну копію прогресу цього акаунта?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={sync.status === 'pending'} onClick={() => { const cleared = clearCurrentAccountCache(); setConfirmCacheClear(false); setCacheClearMessage(cleared ? 'Локальну копію цього акаунта видалено. Серверний прогрес залишився.' : 'Не вдалося очистити локальну копію.'); }} className="min-h-11 rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-gray-700 focus-visible:ring-offset-2">Підтвердити очищення</button>
          <button type="button" onClick={() => setConfirmCacheClear(false)} className="min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 outline-none hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2">Скасувати</button>
        </div>
      </div>}
      {cacheClearMessage && <p className="mt-3 text-sm text-gray-700" role="status">{cacheClearMessage}</p>}
    </section>}
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
