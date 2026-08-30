import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SystemProvider } from './context/SystemContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
import { Search } from './pages/Search';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Loader2 } from 'lucide-react';
import { ProcurementProvider } from './context/ProcurementContext';
import { ProcurementDashboard } from './pages/ProcurementDashboard';
import { Tenders } from './pages/Tenders';
import { BidderVerification } from './pages/BidderVerification';
import { VerificationHub } from './pages/VerificationHub';
import { ProcurementDocuments } from './pages/ProcurementDocuments';
import { ProcurementAuditTrail } from './pages/ProcurementAuditTrail';
import { VerificationSources } from './pages/VerificationSources';

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
          <ProcurementProvider>
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
                <Route path="/dashboard" element={<ProcurementDashboard />} />
                <Route path="/tenders" element={<Tenders />} />
                <Route path="/verification" element={<VerificationHub />} />
                <Route path="/verification/:bidderId" element={<BidderVerification />} />
                <Route path="/integrity" element={<VerificationSources />} />
                <Route path="/verification-sources" element={<VerificationSources />} />
                <Route path="/sources" element={<VerificationSources />} />
                <Route path="/audit-trail" element={<ProcurementAuditTrail />} />

                {/* Legacy Route Aliases (Redirect to Procurement Counterparts) */}
                <Route path="/projects" element={<Navigate to="/tenders" replace />} />
                <Route path="/projects/:caseId" element={<Navigate to="/tenders" replace />} />
                <Route path="/files" element={<Navigate to="/tenders" replace />} />
                <Route path="/files/:caseId" element={<Navigate to="/tenders" replace />} />
                <Route path="/cases" element={<Navigate to="/tenders" replace />} />
                <Route path="/cases/:caseId" element={<Navigate to="/tenders" replace />} />
                <Route path="/pending" element={<Navigate to="/verification" replace />} />
                <Route path="/intelligence" element={<Navigate to="/verification" replace />} />
                <Route path="/analytics" element={<Navigate to="/reports" replace />} />
                <Route path="/workflow" element={<Navigate to="/integrity" replace />} />
                <Route path="/risk" element={<Navigate to="/verification" replace />} />
                <Route path="/simulation" element={<Navigate to="/integrity" replace />} />
                <Route path="/audit-logs" element={<Navigate to="/audit-trail" replace />} />

                {/* Document Repository & OCR Scan */}
                <Route path="/documents" element={<ProcurementDocuments />} />
                <Route path="/documents/upload" element={<ProcurementDocuments />} />
                <Route path="/upload" element={<ProcurementDocuments />} />

                {/* Advanced Search Engine */}
                <Route path="/search" element={<Search />} />

                {/* Procurement Compliance Reports */}
                <Route path="/reports" element={<Reports />} />

                {/* System Settings */}
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
          </ProcurementProvider>
        </SystemProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
