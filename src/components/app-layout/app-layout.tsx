import { ChevronDown, LogOut01, MusicNote01, User01 } from '@untitledui/icons';
import { Button as AriaButton } from 'react-aria-components';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { Avatar } from '@/components/base/avatar/avatar';
import { Button } from '@/components/base/buttons/button';
import { Dropdown } from '@/components/base/dropdown/dropdown';
import { useAuth } from '@/hooks/use-auth';
import { cx } from '@/utils/cx';

export function AppLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const user = auth.user;
  const name = user ? [user.profile.firstName, user.profile.lastName].filter(Boolean).join(' ') : '';
  const initials = (name || user?.username || '').split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  // Leave the protected page first, so the guard does not send the signed-out visitor to sign-in.
  const signOut = async () => { await navigate('/', { replace: true }); await auth.logout(); };
  return (
    <div className="min-h-screen bg-primary text-primary">
      <header className="sticky top-0 z-20 border-b border-secondary bg-primary/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 rounded-lg outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-solid text-primary_on-brand shadow-xs">
              <MusicNote01 className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight max-[359px]:sr-only">Гітара з нуля</span>
          </Link>

          <nav className="flex items-center gap-2 text-sm" aria-label="Основна навігація">
            <NavLink
              to="/course"
              className={({ isActive }) => cx(
                'rounded-lg px-3 py-2 font-semibold outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover focus-visible:outline-2',
                isActive ? 'text-brand-secondary' : 'text-tertiary hover:text-secondary',
              )}
            >
              Курс
            </NavLink>
            {user ? (
              <Dropdown.Root>
                <AriaButton
                  aria-label={`Меню акаунта @${user.username}`}
                  className={({ isPressed, isFocusVisible }) => cx(
                    'group relative inline-flex cursor-pointer items-center gap-2 rounded-full border border-secondary bg-primary p-1 outline-offset-2 outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover sm:pr-2.5',
                    (isPressed || isFocusVisible) && 'outline-2',
                  )}
                >
                  <Avatar size="sm" initials={initials} alt="" />
                  <span className="hidden max-w-32 truncate text-sm font-semibold text-secondary sm:inline">{name || `@${user.username}`}</span>
                  <ChevronDown className="hidden size-4 shrink-0 text-fg-quaternary transition duration-100 ease-linear group-aria-expanded:rotate-180 sm:block" aria-hidden="true" />
                </AriaButton>
                <Dropdown.Popover className="w-60">
                  <div className="border-b border-secondary px-4 py-3">
                    {name && <p className="truncate text-sm font-semibold text-primary">{name}</p>}
                    <p className="truncate text-sm text-tertiary">@{user.username}</p>
                  </div>
                  <Dropdown.Menu aria-label="Акаунт">
                    <Dropdown.Item icon={User01} href="/account">Акаунт</Dropdown.Item>
                    <Dropdown.Separator />
                    <Dropdown.Item icon={LogOut01} onAction={() => void signOut()}>Вийти</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown.Root>
            ) : (
              <Button href="/auth" size="sm" color="secondary">Увійти</Button>
            )}
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="border-t border-secondary bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-tertiary sm:px-6 lg:px-8">
          Створюємо курс крок за кроком 🎸
        </div>
      </footer>
    </div>
  );
}
