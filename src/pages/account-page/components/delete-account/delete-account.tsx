import { useState, type FormEvent } from 'react';
import { inputClass } from '@/pages/account-page/constants';
import { ErrorSummary } from '@/pages/account-page/components/error-summary/error-summary';
import { useAuth } from '@/hooks/use-auth';
import { ApiError } from '@/utils/api-error';

export function DeleteAccount() {
  const { deleteAccount } = useAuth();
  const [open, setOpen] = useState(false); const [password, setPassword] = useState(''); const [confirmed, setConfirmed] = useState(false); const [error, setError] = useState<ApiError | null>(null);
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(null); try { await deleteAccount(password); } catch (caught) { setError(caught instanceof ApiError ? caught : new ApiError('UNKNOWN', 'Не вдалося видалити акаунт.')); } };
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="min-h-11 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Видалити акаунт</button>;
  return <form onSubmit={submit} className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4"><h3 className="font-semibold text-red-900">Видалити акаунт назавжди?</h3><p className="text-sm leading-6 text-red-800">Профіль, серверний прогрес і всі сеанси буде видалено. Локальний прогрес на цьому пристрої залишиться.</p><ErrorSummary error={error} /><div><label htmlFor="delete-password" className="text-sm font-semibold text-red-900">Поточний пароль</label><input id="delete-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className={inputClass} /></div><label className="flex gap-3 text-sm text-red-900"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 size-4" />Я розумію, що цю дію не можна скасувати.</label><div className="flex flex-wrap gap-3"><button disabled={!confirmed || !password} className="min-h-11 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Підтвердити видалення</button><button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700">Скасувати</button></div></form>;
}
