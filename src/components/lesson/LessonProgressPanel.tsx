import { useState } from 'react';
import type { LessonProgressController } from '@/progress/useLessonProgress';

type LessonProgressPanelProps = Pick<
  LessonProgressController<unknown>,
  | 'storageAvailable'
  | 'sync'
  | 'accountState'
  | 'importGuestProgress'
  | 'confirmGuestImport'
  | 'keepGuestProgressSeparate'
  | 'clearCurrentAccountCache'
  | 'retrySync'
>;

// Local and account progress status shared by every lesson page: the storage
// notice, sync status with retry, guest import prompt, and device cache clearing.
export function LessonProgressPanel({
  storageAvailable,
  sync,
  accountState,
  importGuestProgress,
  confirmGuestImport,
  keepGuestProgressSeparate,
  clearCurrentAccountCache,
  retrySync,
}: LessonProgressPanelProps) {
  const [confirmCacheClear, setConfirmCacheClear] = useState(false);
  const [cacheClearMessage, setCacheClearMessage] = useState<string | null>(null);

  return <>
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
  </>;
}
