import { createBrowserRouter, redirect } from 'react-router';
import { RootLayout } from '@/components/RootLayout';
import { RouteError } from '@/components/RouteError';

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    HydrateFallback: () => null,
    children: [
      {
        ErrorBoundary: RouteError,
        children: [
          { path: '/', lazy: async () => ({ Component: (await import('@/pages/HomePage')).HomePage }) },
          { path: '/lessons/01', lazy: async () => ({ Component: (await import('@/pages/LessonOnePage')).LessonOnePage }) },
          { path: '/lessons/02', lazy: async () => ({ Component: (await import('@/pages/LessonTwoPage')).LessonTwoPage }) },
          { path: '/account', lazy: async () => ({ Component: (await import('@/pages/AccountPage')).AccountPage }) },
          { path: '*', loader: () => redirect('/') },
        ],
      },
    ],
  },
]);
