import { useState, type FormEvent } from 'react';
import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Input } from '@/components/base/input/input';
import { ErrorSummary } from '@/pages/account-page/components/error-summary/error-summary';
import { useAuth } from '@/hooks/use-auth';
import { ApiError } from '@/utils/api-error';

export function DeleteAccount() {
  const { deleteAccount } = useAuth();
  const [open, setOpen] = useState(false); const [password, setPassword] = useState(''); const [confirmed, setConfirmed] = useState(false); const [error, setError] = useState<ApiError | null>(null);
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(null); try { await deleteAccount(password); } catch (caught) { setError(caught instanceof ApiError ? caught : new ApiError('UNKNOWN', 'Не вдалося видалити акаунт.')); } };
  if (!open) return <Button color="secondary-destructive" size="lg" onClick={() => setOpen(true)}>Видалити акаунт</Button>;
  return <form onSubmit={submit} className="space-y-4 rounded-lg border border-error_subtle bg-error-primary p-4"><h3 className="font-semibold text-error-primary">Видалити акаунт назавжди?</h3><p className="text-sm leading-6 text-error-primary">Профіль, серверний прогрес і всі сеанси буде видалено. Локальний прогрес на цьому пристрої залишиться.</p><ErrorSummary error={error} /><Input id="delete-password" type="password" label="Поточний пароль" value={password} onChange={setPassword} autoComplete="current-password" /><Checkbox isSelected={confirmed} onChange={setConfirmed} label="Я розумію, що цю дію не можна скасувати." /><div className="flex flex-wrap gap-3"><Button type="submit" color="primary-destructive" size="lg" isDisabled={!confirmed || !password}>Підтвердити видалення</Button><Button color="tertiary" size="lg" onClick={() => setOpen(false)}>Скасувати</Button></div></form>;
}
