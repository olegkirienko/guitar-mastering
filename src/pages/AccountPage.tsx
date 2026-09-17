import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, useAuth, type Profile } from '@/auth/AuthProvider';

const avatars = [
  { id: 'cedar', label: 'Кедр', symbol: '🌲', colors: 'bg-amber-100 text-amber-900' },
  { id: 'ocean', label: 'Океан', symbol: '🌊', colors: 'bg-blue-100 text-blue-900' },
  { id: 'sunset', label: 'Захід сонця', symbol: '🌅', colors: 'bg-rose-100 text-rose-900' },
  { id: 'forest', label: 'Ліс', symbol: '🍃', colors: 'bg-emerald-100 text-emerald-900' },
] as const;

const inputClass = 'mt-2 block min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200';
const primaryButton = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';

function ErrorSummary({ error }: { error: ApiError | null }) {
  if (!error) return null;
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error.message}</div>;
}

function AuthForm({ kind }: { kind: 'login' | 'register' }) {
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

function ProfileForm({ initial }: { initial: Profile }) {
  const { updateProfile } = useAuth();
  const [firstName, setFirstName] = useState(initial.firstName ?? '');
  const [lastName, setLastName] = useState(initial.lastName ?? '');
  const [avatarId, setAvatarId] = useState(initial.avatarId);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  useEffect(() => { setFirstName(initial.firstName ?? ''); setLastName(initial.lastName ?? ''); setAvatarId(initial.avatarId); }, [initial]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setStatus(''); setError(null);
    try { await updateProfile({ firstName, lastName, avatarId }); setStatus('Профіль збережено.'); }
    catch (caught) { setError(caught instanceof ApiError ? caught : new ApiError('UNKNOWN', 'Не вдалося зберегти профіль.')); }
  };
  return <form onSubmit={submit} className="space-y-5">
    <ErrorSummary error={error} />
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label htmlFor="first-name" className="text-sm font-semibold text-gray-900">Ім’я <span className="font-normal text-gray-500">(необов’язково)</span></label><input id="first-name" maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" aria-describedby={error?.fields.firstName ? 'first-name-error' : undefined} className={inputClass} />{error?.fields.firstName && <p id="first-name-error" className="mt-1 text-sm text-red-700">{error.fields.firstName}</p>}</div>
      <div><label htmlFor="last-name" className="text-sm font-semibold text-gray-900">Прізвище <span className="font-normal text-gray-500">(необов’язково)</span></label><input id="last-name" maxLength={80} value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" aria-describedby={error?.fields.lastName ? 'last-name-error' : undefined} className={inputClass} />{error?.fields.lastName && <p id="last-name-error" className="mt-1 text-sm text-red-700">{error.fields.lastName}</p>}</div>
    </div>
    <fieldset aria-describedby={error?.fields.avatarId ? 'avatar-error' : undefined}><legend className="text-sm font-semibold text-gray-900">Аватар застосунку</legend><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{avatars.map((avatar) => <label key={avatar.id} className={`cursor-pointer rounded-xl border p-3 text-center outline-none has-[:checked]:border-brand-600 has-[:checked]:ring-2 has-[:checked]:ring-brand-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 has-[:focus-visible]:ring-offset-2 ${avatar.colors}`}><input type="radio" name="avatar" value={avatar.id} checked={avatarId === avatar.id} onChange={() => setAvatarId(avatar.id)} className="sr-only" /><span aria-hidden="true" className="block text-2xl">{avatar.symbol}</span><span className="mt-1 block text-xs font-semibold">{avatar.label}</span></label>)}</div>{error?.fields.avatarId && <p id="avatar-error" className="mt-2 text-sm text-red-700">{error.fields.avatarId}</p>}<button type="button" onClick={() => setAvatarId(null)} className="mt-3 text-sm font-semibold text-gray-600 underline underline-offset-4">Без аватара</button></fieldset>
    <div className="flex items-center gap-3"><button className={primaryButton}>Зберегти профіль</button><span role="status" className="text-sm text-success-600">{status}</span></div>
  </form>;
}

function DeleteAccount() {
  const { deleteAccount } = useAuth();
  const [open, setOpen] = useState(false); const [password, setPassword] = useState(''); const [confirmed, setConfirmed] = useState(false); const [error, setError] = useState<ApiError | null>(null);
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(null); try { await deleteAccount(password); } catch (caught) { setError(caught instanceof ApiError ? caught : new ApiError('UNKNOWN', 'Не вдалося видалити акаунт.')); } };
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="min-h-11 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Видалити акаунт</button>;
  return <form onSubmit={submit} className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4"><h3 className="font-semibold text-red-900">Видалити акаунт назавжди?</h3><p className="text-sm leading-6 text-red-800">Профіль, серверний прогрес і всі сеанси буде видалено. Локальний прогрес на цьому пристрої залишиться.</p><ErrorSummary error={error} /><div><label htmlFor="delete-password" className="text-sm font-semibold text-red-900">Поточний пароль</label><input id="delete-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className={inputClass} /></div><label className="flex gap-3 text-sm text-red-900"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 size-4" />Я розумію, що цю дію не можна скасувати.</label><div className="flex flex-wrap gap-3"><button disabled={!confirmed || !password} className="min-h-11 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Підтвердити видалення</button><button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700">Скасувати</button></div></form>;
}

export function AccountPage() {
  const auth = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  return <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
    <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Акаунт</h1>
    {auth.state === 'loading' ? <p role="status" className="mt-6 text-gray-600">Перевіряємо сеанс…</p> : auth.state === 'unavailable' ? <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="font-semibold text-amber-900">Сервер тимчасово недоступний</p><p className="mt-1 text-sm text-amber-800">Уроки та локальний прогрес продовжують працювати.</p><button type="button" onClick={() => void auth.refresh()} className="mt-3 text-sm font-semibold text-amber-900 underline">Спробувати знову</button></div> : auth.user ? <div className="mt-8 space-y-10"><section aria-labelledby="profile-heading"><h2 id="profile-heading" className="text-xl font-semibold text-gray-950">Профіль @{auth.user.username}</h2><p className="mt-2 text-sm leading-6 text-gray-600">Ці дані необов’язкові й не показуються публічно.</p><div className="mt-6"><ProfileForm initial={auth.user.profile} /></div><button type="button" onClick={() => void auth.logout()} className="mt-6 min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Вийти</button></section><section aria-labelledby="delete-heading" className="border-t border-gray-200 pt-8"><h2 id="delete-heading" className="text-lg font-semibold text-gray-950">Небезпечна зона</h2><div className="mt-4"><DeleteAccount /></div></section></div> : <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1" role="group" aria-label="Доступ до акаунта"><button type="button" aria-pressed={mode === 'login'} onClick={() => setMode('login')} className={`min-h-11 rounded-md px-3 text-sm font-semibold ${mode === 'login' ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-600'}`}>Увійти</button><button type="button" aria-pressed={mode === 'register'} onClick={() => setMode('register')} className={`min-h-11 rounded-md px-3 text-sm font-semibold ${mode === 'register' ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-600'}`}>Реєстрація</button></div><AuthForm key={mode} kind={mode} /></div>}
    <section aria-labelledby="privacy-heading" className="mt-10 border-t border-gray-200 pt-8 text-sm leading-6 text-gray-600">
      <h2 id="privacy-heading" className="font-semibold text-gray-900">Приватність і резервні копії</h2>
      <p className="mt-2">Ми зберігаємо дані акаунта, необов’язковий профіль і прогрес уроків. Пароль і придатний до використання токен сеансу не зберігаються. Після видалення акаунта його дані можуть тимчасово залишатися в захищених резервних копіях до завершення строку зберігання; копії використовуються лише для відновлення після збою.</p>
    </section>
  </main>;
}
