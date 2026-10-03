import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AuthForm } from '@/pages/account-page/components/auth-form/auth-form';
import { DeleteAccount } from '@/pages/account-page/components/delete-account/delete-account';
import { ProfileForm } from '@/pages/account-page/components/profile-form/profile-form';

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
