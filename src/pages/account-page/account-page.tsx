import { useNavigate } from 'react-router';
import { Button } from '@/components/base/buttons/button';
import { useAuth } from '@/hooks/use-auth';
import { DeleteAccount } from '@/pages/account-page/components/delete-account/delete-account';
import { LessonPreferences } from '@/pages/account-page/components/lesson-preferences/lesson-preferences';
import { PreferencesSaveNotice } from '@/pages/account-page/components/preferences-save-notice/preferences-save-notice';
import { ProfileForm } from '@/pages/account-page/components/profile-form/profile-form';
import { ThemePreference } from '@/pages/account-page/components/theme-preference/theme-preference';

export function AccountPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  // Leave the protected page first, so signing out does not bounce through /auth.
  const signOut = async () => { await navigate('/', { replace: true }); await auth.logout(); };
  return <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
    <h1 className="font-display text-4xl font-semibold tracking-tight text-primary">Акаунт</h1>
    {auth.user && <div className="mt-8 space-y-10"><section aria-labelledby="profile-heading"><h2 id="profile-heading" className="text-xl font-semibold text-primary">Профіль @{auth.user.username}</h2><p className="mt-2 text-sm leading-6 text-tertiary">Ці дані необов’язкові й не показуються публічно.</p><div className="mt-6"><ProfileForm initial={auth.user.profile} /></div><Button color="secondary" size="lg" className="mt-6" onClick={() => void signOut()}>Вийти</Button></section><section aria-labelledby="appearance-heading" className="border-t border-secondary pt-8"><h2 id="appearance-heading" className="text-lg font-semibold text-primary">Вигляд</h2><div className="mt-4"><ThemePreference labelledBy="appearance-heading" /></div></section><section aria-labelledby="lessons-heading" className="border-t border-secondary pt-8"><h2 id="lessons-heading" className="text-lg font-semibold text-primary">Уроки</h2><p className="mt-2 text-sm leading-6 text-tertiary">Ці налаштування діють у всіх уроках.</p><div className="mt-4"><LessonPreferences /></div><div className="mt-4"><PreferencesSaveNotice /></div></section><section aria-labelledby="delete-heading" className="border-t border-secondary pt-8"><h2 id="delete-heading" className="text-lg font-semibold text-primary">Небезпечна зона</h2><div className="mt-4"><DeleteAccount /></div></section></div>}
    <section aria-labelledby="privacy-heading" className="mt-10 border-t border-secondary pt-8 text-sm leading-6 text-tertiary">
      <h2 id="privacy-heading" className="font-semibold text-primary">Приватність і резервні копії</h2>
      <p className="mt-2">Ми зберігаємо дані акаунта, необов’язковий профіль і прогрес уроків. Пароль і придатний до використання токен сеансу не зберігаються. Після видалення акаунта його дані можуть тимчасово залишатися в захищених резервних копіях до завершення строку зберігання; копії використовуються лише для відновлення після збою.</p>
    </section>
  </main>;
}
