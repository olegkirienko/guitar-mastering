import { ScrollRestoration } from 'react-router';
import { AuthProvider } from '@/auth/auth-provider/auth-provider';
import { AppLayout } from '@/components/AppLayout';
import { RouteProvider } from '@/providers/route-provider';

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
