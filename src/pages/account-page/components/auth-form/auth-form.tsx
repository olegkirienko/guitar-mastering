import { useState, type FormEvent } from 'react';
import { inputClass, primaryButton } from '@/pages/account-page/constants';
import { ErrorSummary } from '@/pages/account-page/components/error-summary/error-summary';
import { useAuth } from '@/hooks/use-auth';
import { ApiError } from '@/utils/api-error';

export function AuthForm({ kind }: { kind: 'login' | 'register' }) {
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null);
    try { await auth[kind]({ username, password }); }
    catch (caught) { setError(caught instanceof ApiError ? caught : new ApiError('UNKNOWN', 'Запит не виконано.')); }
    finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="space-y-4" noValidate>
    <ErrorSummary error={error} />
    <div><label htmlFor={`${kind}-username`} className="text-sm font-semibold text-gray-900">Ім’я користувача</label><input id={`${kind}-username`} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" aria-describedby={error?.fields.username ? `${kind}-username-error` : undefined} className={inputClass} />{error?.fields.username && <p id={`${kind}-username-error`} className="mt-1 text-sm text-red-700">{error.fields.username}</p>}</div>
    <div><label htmlFor={`${kind}-password`} className="text-sm font-semibold text-gray-900">Пароль</label><input id={`${kind}-password`} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={kind === 'register' ? 'new-password' : 'current-password'} aria-describedby={`${kind}-password-help${error?.fields.password ? ` ${kind}-password-error` : ''}`} className={inputClass} /><p id={`${kind}-password-help`} className="mt-1 text-xs leading-5 text-gray-500">Від 12 до 128 символів.</p>{error?.fields.password && <p id={`${kind}-password-error`} className="mt-1 text-sm text-red-700">{error.fields.password}</p>}</div>
    {kind === 'register' && <p className="rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">Автоматичного відновлення пароля поки немає. Збережи пароль у надійному менеджері.</p>}
    <button disabled={busy} className={primaryButton}>{busy ? 'Зачекай…' : kind === 'register' ? 'Створити акаунт' : 'Увійти'}</button>
  </form>;
}
