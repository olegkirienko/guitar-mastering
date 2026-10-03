import { createBrowserRouter, redirect } from 'react-router';
import { RootLayout } from '@/components/root-layout/root-layout';
import { RouteError } from '@/components/route-error/route-error';

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    HydrateFallback: () => null,
    children: [
      {
        ErrorBoundary: RouteError,
        children: [
          { path: '/', lazy: async () => ({ Component: (await import('@/pages/home-page/home-page')).HomePage }) },
          { path: '/lessons/01', lazy: async () => ({ Component: (await import('@/pages/lesson-one-page/lesson-one-page')).LessonOnePage }) },
          { path: '/lessons/02', lazy: async () => ({ Component: (await import('@/pages/lesson-two-page/lesson-two-page')).LessonTwoPage }) },
          { path: '/account', lazy: async () => ({ Component: (await import('@/pages/account-page/account-page')).AccountPage }) },
          { path: '*', loader: () => redirect('/') },
        ],
      },
    ],
  },
]);
