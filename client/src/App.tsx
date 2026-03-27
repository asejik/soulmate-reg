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
import ClaimAccountPage from './pages/ClaimAccountPage';
import AdminPortalPage from './pages/admin/AdminPortalPage';

export default function App() {
  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/soulmate" element={<SoulmateApp />} />
      <Route path="/launchpad" element={<LaunchpadApp />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<ClaimAccountPage />} />

      {/* --- PROTECTED LMS ROUTES --- */}
      <Route element={<ProtectedRoute />}>

        {/* Admin Portal gets its own full-screen layout */}
        <Route path="/admin" element={<AdminPortalPage />} />

        {/* Regular Participant Layout */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/lessons/:id" element={<LessonPage />} />
        </Route>

      </Route>
    </Routes>
  );
}