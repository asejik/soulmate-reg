import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SoulmateApp } from './pages/SoulmateApp';
import { LaunchpadApp } from './pages/LaunchpadApp';
import { LoginPage } from './pages/auth/LoginPage';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { DashboardPage } from './pages/dashboard/DashboardPage';

export default function App() {
  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/soulmate" element={<SoulmateApp />} />
      <Route path="/launchpad" element={<LaunchpadApp />} />
      <Route path="/login" element={<LoginPage />} />

      {/* --- PROTECTED LMS ROUTES --- */}
      {/* Any route inside this wrapper requires a valid Supabase session */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* Future routes like /dashboard/lessons/:id will go here */}
      </Route>
    </Routes>
  );
}