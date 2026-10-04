import { Navigate } from 'react-router';
import { Button } from '@/components/base/buttons/button';
import { PageSkeleton } from '@/components/page-skeleton/page-skeleton';
import { ServerUnavailable } from '@/components/server-unavailable/server-unavailable';
import { AuthForm } from '@/pages/auth-page/components/auth-form/auth-form';
import { useAuthPage } from '@/pages/auth-page/hooks/use-auth-page';

export function AuthPage() {
  const { auth, mode, setMode, target, onAuthenticated } = useAuthPage();
  if (target) return <Navigate to={target} replace />;
  if (auth.state === 'loading' || auth.state === 'authenticated') return <PageSkeleton />;
  if (auth.state === 'unavailable') return <ServerUnavailable onRetry={() => void auth.refresh()} />;
  return <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
    <h1 className="text-3xl font-semibold tracking-tight text-primary">Вхід до курсу</h1>
    <p className="mt-2 text-sm leading-6 text-tertiary">Уроки й прогрес доступні з акаунтом.</p>
    <div className="mt-8 rounded-xl border border-secondary bg-primary p-5 shadow-sm sm:p-7">
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-tertiary p-1" role="group" aria-label="Доступ до акаунта">
        <Button color={mode === 'login' ? 'secondary' : 'tertiary'} size="lg" aria-pressed={mode === 'login'} onClick={() => setMode('login')}>Увійти</Button>
        <Button color={mode === 'register' ? 'secondary' : 'tertiary'} size="lg" aria-pressed={mode === 'register'} onClick={() => setMode('register')}>Реєстрація</Button>
      </div>
      <AuthForm key={mode} kind={mode} onAuthenticated={onAuthenticated} />
    </div>
  </main>;
}
