import { AuthProvider } from '@/auth/auth-provider/auth-provider';
import { AppLayout } from '@/components/app-layout/app-layout';
import { RouteProvider } from '@/providers/route-provider/route-provider';
import { ScrollRestoration } from 'react-router';

export function RootLayout() {
  return (
    <AuthProvider enabled>
      <RouteProvider>
        <AppLayout />
        <ScrollRestoration />
      </RouteProvider>
    </AuthProvider>
  );
}
