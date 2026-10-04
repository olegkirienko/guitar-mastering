import { useEffect, useState, type FormEvent } from 'react';
import type { Profile } from '@/auth/auth-provider/types';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { avatars } from '@/pages/account-page/constants';
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
      <Input id="first-name" maxLength={80} label="Ім’я (необов’язково)" value={firstName} onChange={setFirstName} autoComplete="given-name" isInvalid={Boolean(error?.fields.firstName)} hint={error?.fields.firstName} />
      <Input id="last-name" maxLength={80} label="Прізвище (необов’язково)" value={lastName} onChange={setLastName} autoComplete="family-name" isInvalid={Boolean(error?.fields.lastName)} hint={error?.fields.lastName} />
    </div>
    <fieldset aria-describedby={error?.fields.avatarId ? 'avatar-error' : undefined}><legend className="text-sm font-semibold text-primary">Аватар застосунку</legend><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{avatars.map((avatar) => <label key={avatar.id} className={`cursor-pointer rounded-xl border p-3 text-center outline-none has-[:checked]:border-brand-600 has-[:checked]:ring-2 has-[:checked]:ring-brand-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 has-[:focus-visible]:ring-offset-2 ${avatar.colors}`}><input type="radio" name="avatar" value={avatar.id} checked={avatarId === avatar.id} onChange={() => setAvatarId(avatar.id)} className="sr-only" /><span aria-hidden="true" className="block text-2xl">{avatar.symbol}</span><span className="mt-1 block text-xs font-semibold">{avatar.label}</span></label>)}</div>{error?.fields.avatarId && <p id="avatar-error" className="mt-2 text-sm text-error-primary">{error.fields.avatarId}</p>}<Button color="link-gray" size="md" className="mt-3" onClick={() => setAvatarId(null)}>Без аватара</Button></fieldset>
    <div className="flex items-center gap-3"><Button type="submit" size="lg">Зберегти профіль</Button><span role="status" className="text-sm text-success-primary">{status}</span></div>
  </form>;
}
