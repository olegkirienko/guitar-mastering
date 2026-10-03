import { Link, isRouteErrorResponse, useRouteError } from 'react-router';

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : 'Не вдалося показати цю сторінку.';
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-gray-950">Щось пішло не так</h1>
      <p className="mt-3 text-gray-600">{message}</p>
      <Link to="/" className="mt-6 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
        На головну
      </Link>
    </main>
  );
}
