import { useState, type FormEvent } from 'react';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
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
    <Input id={`${kind}-username`} label="Ім’я користувача" value={username} onChange={setUsername} autoComplete="username" isInvalid={Boolean(error?.fields.username)} hint={error?.fields.username} />
    <Input id={`${kind}-password`} type="password" label="Пароль" value={password} onChange={setPassword} autoComplete={kind === 'register' ? 'new-password' : 'current-password'} isInvalid={Boolean(error?.fields.password)} hint={error?.fields.password ?? 'Від 12 до 128 символів.'} />
    {kind === 'register' && <p className="rounded-lg bg-warning-primary p-3 text-sm leading-6 text-warning-primary">Автоматичного відновлення пароля поки немає. Збережи пароль у надійному менеджері.</p>}
    <Button type="submit" size="lg" isDisabled={busy}>{busy ? 'Зачекай…' : kind === 'register' ? 'Створити акаунт' : 'Увійти'}</Button>
  </form>;
}
