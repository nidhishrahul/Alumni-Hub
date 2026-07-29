import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import StudentDashboard from './pages/student/StudentDashboard';
import MentorDiscovery from './pages/student/MentorDiscovery';
import JobPortal from './pages/student/JobPortal';
import AlumniDashboard from './pages/alumni/AlumniDashboard';
import PostJob from './pages/alumni/PostJob';
import MentorshipRequests from './pages/alumni/MentorshipRequests';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Analytics from './pages/admin/Analytics';
import Events from './pages/shared/Events';
import NetworkGraph from './pages/shared/NetworkGraph';
import AIChat from './pages/shared/AIChat';
import Profile from './pages/shared/Profile';
import ReunionList from './pages/reunions/ReunionList';
import ReunionHub from './pages/reunions/ReunionHub';
import ReunionCreate from './pages/reunions/ReunionCreate';
import LandingPage from './pages/LandingPage';

function ProtectedRoute({ children, roles, requireVerified }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;

  // Role check (case-insensitive)
  if (roles) {
    const userRole = user.role?.toUpperCase();
    const allowedRoles = roles.map(r => r.toUpperCase());
    if (!allowedRoles.includes(userRole)) return <Navigate to="/login" />;
  }

  // Verified alumni check
  if (requireVerified && user.role?.toUpperCase() === 'ALUMNI') {
    if (!user.alumniProfile?.isVerified) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-950 p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⏳</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Verification Pending</h2>
            <p className="text-surface-400 mb-6">
              Your alumni profile is awaiting verification. This feature requires a verified account. An admin will review your profile soon.
            </p>
            <button onClick={() => window.history.back()} className="btn-secondary">
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-surface-400 text-sm font-medium">Loading AlumniConnect...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Student */}
      <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="mentors" element={<MentorDiscovery />} />
        <Route path="jobs" element={<JobPortal />} />
        <Route index element={<Navigate to="dashboard" />} />
      </Route>

      {/* Alumni */}
      <Route path="/alumni" element={<ProtectedRoute roles={['ALUMNI']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AlumniDashboard />} />
        <Route path="post-job" element={<ProtectedRoute roles={['ALUMNI']} requireVerified><PostJob /></ProtectedRoute>} />
        <Route path="mentorships" element={<MentorshipRequests />} />
        <Route index element={<Navigate to="dashboard" />} />
      </Route>

      {/* Faculty uses the same community dashboard while faculty-specific
          features are developed. This keeps a newly registered faculty
          member from being sent to the landing page. */}
      <Route path="/faculty" element={<ProtectedRoute roles={['FACULTY']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="mentors" element={<MentorDiscovery />} />
        <Route path="jobs" element={<JobPortal />} />
        <Route index element={<Navigate to="dashboard" />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route index element={<Navigate to="dashboard" />} />
      </Route>

      {/* Shared (any authenticated) */}
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="reunions" element={<ReunionList />} />
        <Route path="reunions/new" element={<ReunionCreate />} />
        <Route path="reunions/:id" element={<ReunionHub />} />
        <Route path="events" element={<Events />} />
        <Route path="network" element={<NetworkGraph />} />
        <Route path="chat" element={<AIChat />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
