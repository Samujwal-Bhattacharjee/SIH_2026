import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SystemProvider } from './context/SystemContext';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Cases } from './pages/Cases';
import { CaseDetail } from './pages/CaseDetail';
import { Workflow } from './pages/Workflow';
import { Risk } from './pages/Risk';
import { Simulation } from './pages/Simulation';
import { Documents } from './pages/Documents';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

// Route guard for authenticated session
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center font-mono text-xs text-ink-700">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-vermilion rounded-full animate-ping" />
          <span>VALIDATING SYSTEM AUTHENTICATION...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Route guard for public/login screen (redirect to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <SystemProvider>
        <Router>
          <Routes>
            {/* Public Login Route */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Protected Operations Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/cases/:caseId" element={<CaseDetail />} />
              <Route path="/workflow" element={<Workflow />} />
              <Route path="/risk" element={<Risk />} />
              <Route path="/simulation" element={<Simulation />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </SystemProvider>
    </AuthProvider>
  );
}

export default App;
