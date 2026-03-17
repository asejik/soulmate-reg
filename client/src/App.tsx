import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SoulmateApp } from './pages/SoulmateApp';
import { LaunchpadApp } from './pages/LaunchpadApp';
import { LoginPage } from './pages/auth/LoginPage';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { DashboardLayout } from './components/shared/DashboardLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
// NEW IMPORT
import { LessonPage } from './pages/dashboard/LessonPage';

export default function App() {
  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/soulmate" element={<SoulmateApp />} />
      <Route path="/launchpad" element={<LaunchpadApp />} />
      <Route path="/login" element={<LoginPage />} />

      {/* --- PROTECTED LMS ROUTES --- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* NEW ROUTE */}
          <Route path="/dashboard/lessons/:id" element={<LessonPage />} />
        </Route>
      </Route>
    </Routes>
  );
}