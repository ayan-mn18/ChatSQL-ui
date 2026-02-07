import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import FuturisticLanding from './pages/FuturisticLanding';
import ChatSQLLanding from './pages/ChatSQLLanding';
import StandaloneChat from './pages/StandaloneChat';
import DashboardLayout from './layouts/DashboardLayout';
import ConnectionLayout from './layouts/ConnectionLayout';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary, NotFoundPage } from './components/ErrorBoundary';
import {
  ConnectionsPage,
  UsageDashboard,
  ConnectionOverview,
  TableView,
  SQLEditor,
  SchemaVisualizer
} from './pages';
import { UserManagementPage } from './pages/dashboard/UserManagement';
import ForceChangePasswordPage from './pages/auth/ForceChangePasswordPage';
import MyAccessPage from './pages/dashboard/MyAccessPage';
import PricingPage from './pages/dashboard/PricingPage';
import BillingPage from './pages/dashboard/BillingPage';
import { CheckoutSuccess, CheckoutCancelled } from './pages/dashboard/CheckoutSuccess';
import ContactPage from './pages/ContactPage';

function AdminOnlyUserManagement() {
  const { user } = useAuth();
  if (user?.role === 'viewer') return <Navigate to="/dashboard/access" replace />;
  return <UserManagementPage />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatSQLLanding />} />
      <Route path="/landing" element={<FuturisticLanding />} />
      <Route path="/hexora" element={<LandingPage />} />
      <Route path="/chat" element={<ChatPage />} />

      {/* Standalone Chat Route */}
      <Route element={<ProtectedRoute />}>
        <Route path="/chat/:connectionId" element={<StandaloneChat />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/auth/signin" element={<SignInPage />} />
      <Route path="/auth/signup" element={<SignUpPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

      {/* Contact Page (public) */}
      <Route path="/contact" element={<ContactPage />} />

      {/* Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/auth/force-change-password" element={<ForceChangePasswordPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/connections" replace />} />
          <Route path="connections" element={<ErrorBoundary level="section" resetKeys={['connections']}><ConnectionsPage /></ErrorBoundary>} />
          <Route path="usage" element={<ErrorBoundary level="section" resetKeys={['usage']}><UsageDashboard /></ErrorBoundary>} />
          <Route path="users" element={<ErrorBoundary level="section" resetKeys={['users']}><AdminOnlyUserManagement /></ErrorBoundary>} />
          <Route path="access" element={<ErrorBoundary level="section" resetKeys={['access']}><MyAccessPage /></ErrorBoundary>} />
          <Route path="pricing" element={<ErrorBoundary level="section" resetKeys={['pricing']}><PricingPage /></ErrorBoundary>} />
          <Route path="billing" element={<ErrorBoundary level="section" resetKeys={['billing']}><BillingPage /></ErrorBoundary>} />
          <Route path="checkout/success" element={<CheckoutSuccess />} />
          <Route path="checkout/cancelled" element={<CheckoutCancelled />} />
          <Route path="profile" element={<ErrorBoundary level="section" resetKeys={['profile']}><ProfilePage /></ErrorBoundary>} />
        </Route>

        {/* Connection Routes */}
        <Route path="/dashboard/connection/:connectionId" element={<ConnectionLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<ErrorBoundary level="section" resetKeys={['overview']}><ConnectionOverview /></ErrorBoundary>} />
          <Route path="table/:schemaName/:tableName" element={<ErrorBoundary level="page" resetKeys={['table']}><TableView /></ErrorBoundary>} />
          <Route path="sql" element={<ErrorBoundary level="section" resetKeys={['sql']}><SQLEditor /></ErrorBoundary>} />
          <Route path="visualizer" element={<ErrorBoundary level="section" resetKeys={['visualizer']}><SchemaVisualizer /></ErrorBoundary>} />
        </Route>
      </Route>

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;