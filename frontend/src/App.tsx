import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Lazy-loaded route chunks
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DocumentListPage = lazy(() => import('./pages/DocumentListPage'));
const DocumentAnalysisPage = lazy(() => import('./pages/DocumentAnalysisPage'));
const QuestionsPage = lazy(() => import('./pages/QuestionsPage'));
const CrossPolicyComparePage = lazy(() => import('./pages/CrossPolicyComparePage'));
const PolicyBriefExportPage = lazy(() => import('./pages/PolicyBriefExportPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

const PageLoadingFallback = () => (
  <div
    style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    }}
    role="status"
    aria-live="polite"
  >
    <LoadingSpinner size={36} message="Loading statutory analytical module..." />
  </div>
);

export function App() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Application Routes within App Shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentListPage />} />
          <Route path="/insights" element={<DocumentAnalysisPage />} />
          <Route path="/insights/:id" element={<DocumentAnalysisPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/compare" element={<CrossPolicyComparePage />} />
          <Route path="/research" element={<PolicyBriefExportPage />} />
          <Route path="/research/:briefId" element={<PolicyBriefExportPage />} />
          <Route path="/research-brief" element={<PolicyBriefExportPage />} />
          <Route path="/research-brief/:briefId" element={<PolicyBriefExportPage />} />

          {/* Backwards-compatibility alias for analysis */}
          <Route path="/analysis" element={<Navigate to="/insights" replace />} />

          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
