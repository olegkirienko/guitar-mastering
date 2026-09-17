import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { LessonOnePage } from '@/pages/LessonOnePage';
import { AccountPage } from '@/pages/AccountPage';
import { AuthProvider } from '@/auth/AuthProvider';

export default function App() {
  return (
    <AuthProvider enabled>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/lessons/01" element={<LessonOnePage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
