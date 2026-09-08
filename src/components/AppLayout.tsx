import { Link, Outlet } from 'react-router-dom';
import { BookOpen01, Home01 } from '@untitledui/icons';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-white text-gray-950">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <BookOpen01 className="size-5" />
            </span>
            <span>Гітара з нуля</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-950"
            >
              <Home01 className="size-4" />
              Курс
            </Link>
            <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
              v0.2.0
            </span>
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-500 sm:px-6 lg:px-8">
          Створюємо курс крок за кроком 🎸
        </div>
      </footer>
    </div>
  );
}
