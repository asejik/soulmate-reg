import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LaunchpadApp } from './pages/LaunchpadApp';
import { LoginPage } from './pages/auth/LoginPage';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { CourseLayout } from './components/shared/CourseLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { LessonPage } from './pages/dashboard/LessonPage';
import ClaimAccountPage from './pages/ClaimAccountPage';
import AdminPortalPage from './pages/admin/AdminPortalPage';
import { GivingPage } from './pages/dashboard/GivingPage';
import { VolunteerPage } from './pages/dashboard/VolunteerPage';
import { GradesPage } from './pages/dashboard/GradesPage';
import { DiscussionsPage } from './pages/dashboard/DiscussionsPage';
import { MidCohortReviewPage } from './pages/dashboard/MidCohortReviewPage';

export default function App() {
  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/soulmate" element={<Navigate to="/" replace />} />
      <Route path="/launchpad" element={<LaunchpadApp />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<ClaimAccountPage />} />

      {/* --- PROTECTED LMS ROUTES --- */}
      <Route element={<ProtectedRoute />}>

        {/* Admin Portal gets its own full-screen layout */}
        <Route path="/admin" element={<AdminPortalPage />} />

        {/* NEW: Professional Coursera-Style Participant Layout */}
        <Route element={<CourseLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/lessons/:id" element={<LessonPage />} />
          <Route path="/dashboard/grades" element={<GradesPage />} />
          <Route path="/dashboard/giving" element={<GivingPage />} />
          <Route path="/dashboard/volunteer" element={<VolunteerPage />} />
          <Route path="/dashboard/discussions" element={<DiscussionsPage />} />
          <Route path="/dashboard/mid-review" element={<MidCohortReviewPage />} />
        </Route>

      </Route>
    </Routes>
  );
}