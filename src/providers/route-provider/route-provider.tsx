import type { PropsWithChildren } from 'react';
import { RouterProvider } from 'react-aria-components';
import type { NavigateOptions } from 'react-router';
import { useHref, useNavigate } from 'react-router';

declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export const RouteProvider = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();

  return <RouterProvider navigate={navigate} useHref={useHref}>{children}</RouterProvider>;
};
