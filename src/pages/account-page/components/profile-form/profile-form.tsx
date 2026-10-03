import { useEffect, useState, type FormEvent } from 'react';
import type { Profile } from '@/auth/auth-provider/types';
import { avatars, inputClass, primaryButton } from '@/pages/account-page/constants';
import { ErrorSummary } from '@/pages/account-page/components/error-summary/error-summary';
import { useAuth } from '@/hooks/use-auth';
import { ApiError } from '@/utils/api-error';

export function ProfileForm({ initial }: { initial: Profile }) {
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
