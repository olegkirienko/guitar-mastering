import { AuthProvider } from '@/auth/auth-provider/auth-provider';
import { AppLayout } from '@/components/app-layout/app-layout';
import { ThemeSync } from '@/components/root-layout/components/theme-sync/theme-sync';
import { RouteProvider } from '@/providers/route-provider/route-provider';
import { ScrollRestoration } from 'react-router';

export function RootLayout() {
  return (
    <AuthProvider enabled>
      <ThemeSync />
      <RouteProvider>
        <AppLayout />
        <ScrollRestoration />
      </RouteProvider>
    </AuthProvider>
  );
}
