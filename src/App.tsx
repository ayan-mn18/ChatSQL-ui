import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import FuturisticLanding from './pages/FuturisticLanding';
import ChatSQLLanding from './pages/ChatSQLLanding';
import DashboardLayout from './layouts/DashboardLayout';
import ConnectionLayout from './layouts/ConnectionLayout';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  ConnectionsPage,
  AnalyticsPage,
  ConnectionOverview,
  TableView,
  SQLEditor,
  SchemaVisualizer
} from './pages';
import UserManagementPage from './pages/dashboard/UserManagementPage';
import ForceChangePasswordPage from './pages/auth/ForceChangePasswordPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatSQLLanding />} />
      <Route path="/landing" element={<FuturisticLanding />} />
      <Route path="/hexora" element={<LandingPage />} />
      <Route path="/chat" element={<ChatPage />} />

      {/* Auth Routes */}
      <Route path="/auth/signin" element={<SignInPage />} />
      <Route path="/auth/signup" element={<SignUpPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      {/* Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/auth/force-change-password" element={<ForceChangePasswordPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/connections" replace />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Connection Routes */}
        <Route path="/dashboard/connection/:connectionId" element={<ConnectionLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<ConnectionOverview />} />
          <Route path="table/:schemaName/:tableName" element={<TableView />} />
          <Route path="sql" element={<SQLEditor />} />
          <Route path="visualizer" element={<SchemaVisualizer />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;