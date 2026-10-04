import { Button } from '@/components/base/buttons/button';

export function ServerUnavailable({ onRetry }: { onRetry(): void }) {
  return <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
    <div className="rounded-lg border border-secondary bg-warning-primary p-5" role="alert">
      <h1 className="text-lg font-semibold text-warning-primary">Сервер тимчасово недоступний</h1>
      <p className="mt-1 text-sm text-warning-primary">Уроки й прогрес відкриються, щойно сервер знову відповість.</p>
      <Button color="secondary" size="md" className="mt-4" onClick={onRetry}>Спробувати знову</Button>
    </div>
  </main>;
}
