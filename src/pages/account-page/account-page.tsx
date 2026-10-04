import { useNavigate } from 'react-router';
import { Button } from '@/components/base/buttons/button';
import { useAuth } from '@/hooks/use-auth';
import { DeleteAccount } from '@/pages/account-page/components/delete-account/delete-account';
import { ProfileForm } from '@/pages/account-page/components/profile-form/profile-form';

export function AccountPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  // Leave the protected page first, so signing out does not bounce through /auth.
  const signOut = async () => { await navigate('/', { replace: true }); await auth.logout(); };
  return <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
    <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Акаунт</h1>
    {auth.user && <div className="mt-8 space-y-10"><section aria-labelledby="profile-heading"><h2 id="profile-heading" className="text-xl font-semibold text-gray-950">Профіль @{auth.user.username}</h2><p className="mt-2 text-sm leading-6 text-gray-600">Ці дані необов’язкові й не показуються публічно.</p><div className="mt-6"><ProfileForm initial={auth.user.profile} /></div><Button color="secondary" size="lg" className="mt-6" onClick={() => void signOut()}>Вийти</Button></section><section aria-labelledby="delete-heading" className="border-t border-gray-200 pt-8"><h2 id="delete-heading" className="text-lg font-semibold text-gray-950">Небезпечна зона</h2><div className="mt-4"><DeleteAccount /></div></section></div>}
    <section aria-labelledby="privacy-heading" className="mt-10 border-t border-gray-200 pt-8 text-sm leading-6 text-gray-600">
      <h2 id="privacy-heading" className="font-semibold text-gray-900">Приватність і резервні копії</h2>
      <p className="mt-2">Ми зберігаємо дані акаунта, необов’язковий профіль і прогрес уроків. Пароль і придатний до використання токен сеансу не зберігаються. Після видалення акаунта його дані можуть тимчасово залишатися в захищених резервних копіях до завершення строку зберігання; копії використовуються лише для відновлення після збою.</p>
    </section>
  </main>;
}
