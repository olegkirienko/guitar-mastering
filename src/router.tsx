import { createBrowserRouter, redirect } from 'react-router';
import { RequireAuth } from '@/components/require-auth/require-auth';
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
          { path: '/auth', lazy: async () => ({ Component: (await import('@/pages/auth-page/auth-page')).AuthPage }) },
          {
            Component: RequireAuth,
            children: [
              { path: '/course', lazy: async () => ({ Component: (await import('@/pages/course-page/course-page')).CoursePage }) },
              { path: '/lessons/01/:stepId?', lazy: async () => ({ Component: (await import('@/pages/lesson-one-page/lesson-one-page')).LessonOnePage }) },
              { path: '/lessons/02/:stepId?', lazy: async () => ({ Component: (await import('@/pages/lesson-two-page/lesson-two-page')).LessonTwoPage }) },
              { path: '/lessons/*', loader: () => redirect('/course') },
              { path: '/account', lazy: async () => ({ Component: (await import('@/pages/account-page/account-page')).AccountPage }) },
            ],
          },
          { path: '*', loader: () => redirect('/') },
        ],
      },
    ],
  },
]);
