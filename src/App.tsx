import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SystemProvider } from './context/SystemContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Files } from './pages/Files';
import { FileDetail } from './pages/FileDetail';
import { PendingFiles } from './pages/PendingFiles';
import { Documents } from './pages/Documents';
import { UploadDocument } from './pages/UploadDocument';
import { Search } from './pages/Search';
import { Intelligence } from './pages/Intelligence';
import { Workflow } from './pages/Workflow';
import { Risk } from './pages/Risk';
import { Simulation } from './pages/Simulation';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';
import { Departments } from './pages/Departments';
import { Settings } from './pages/Settings';
import { Loader2 } from 'lucide-react';

// Route guard for authenticated session
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center font-sans text-xs text-[#5F6368]">
        <div className="flex items-center space-x-2 bg-white p-4 border border-[#D9DDE3] rounded-[4px] shadow-sm">
          <Loader2 className="w-4 h-4 animate-spin text-[#0B2A4A]" />
          <span>Validating Government of India Internal Credentials...</span>
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
    <LanguageProvider>
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

                {/* File Register Routes & Aliases */}
                <Route path="/files" element={<Files />} />
                <Route path="/files/:caseId" element={<FileDetail />} />
                <Route path="/cases" element={<Files />} />
                <Route path="/cases/:caseId" element={<FileDetail />} />

                {/* Pending Files Inventory */}
                <Route path="/pending" element={<PendingFiles />} />

                {/* Document Repository & OCR Scan */}
                <Route path="/documents" element={<Documents />} />
                <Route path="/documents/upload" element={<UploadDocument />} />
                <Route path="/upload" element={<UploadDocument />} />

                {/* Advanced Search Engine */}
                <Route path="/search" element={<Search />} />

                {/* Administrative Intelligence & Workflow Analytics */}
                <Route path="/intelligence" element={<Intelligence />} />
                <Route path="/analytics" element={<Intelligence />} />
                <Route path="/workflow" element={<Workflow />} />
                <Route path="/risk" element={<Risk />} />
                <Route path="/simulation" element={<Simulation />} />

                {/* Reports & SLA Adherence */}
                <Route path="/reports" element={<Reports />} />

                {/* System Audit Register */}
                <Route path="/audit-logs" element={<AuditLogs />} />

                {/* Departments Directory */}
                <Route path="/departments" element={<Departments />} />

                {/* System Settings */}
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </SystemProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
