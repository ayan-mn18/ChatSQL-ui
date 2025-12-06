import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import FuturisticLanding from './pages/FuturisticLanding';
import ChatSQLLanding from './pages/ChatSQLLanding';
import DashboardLayout from './layouts/DashboardLayout';
import ConnectionLayout from './layouts/ConnectionLayout';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import {
  ConnectionsPage,
  AnalyticsPage,
  SettingsPage,
  ConnectionOverview,
  TableView,
  SQLEditor,
  SchemaVisualizer
} from './pages';

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

      {/* Dashboard Routes */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard/connections" replace />} />
        <Route path="connections" element={<ConnectionsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Connection Routes */}
      <Route path="/dashboard/connection/:id" element={<ConnectionLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<ConnectionOverview />} />
        <Route path="tables/:tableName" element={<TableView />} />
        <Route path="sql" element={<SQLEditor />} />
        <Route path="visualizer" element={<SchemaVisualizer />} />
      </Route>
    </Routes>
  );
}

export default App;