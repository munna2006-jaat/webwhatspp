import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';

import DashboardPage from './pages/DashboardPage';
import ConversationsPage from './pages/ConversationsPage';
import ContactsPage from './pages/ContactsPage';
import CampaignsPage from './pages/CampaignsPage';
import AutomationPage from './pages/AutomationPage';
import SpreadsheetPage from './pages/SpreadsheetPage';
import TeamPage from './pages/TeamPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />


      {/* Protected Routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/conversations" element={<ConversationsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/automation" element={<AutomationPage />} />
        <Route path="/spreadsheet" element={<SpreadsheetPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
