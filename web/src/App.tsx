import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ConversationsPage from './pages/ConversationsPage';
import ContactsPage from './pages/ContactsPage';
import DealsPage from './pages/DealsPage';
import KnowledgePage from './pages/KnowledgePage';
import WorkflowsPage from './pages/WorkflowsPage';
import WebhooksPage from './pages/WebhooksPage';
import FSMPage from './pages/FSMPage';
import CMmsPage from './pages/CMmsPage';
import MCPPage from './pages/MCPPage';
import JobsPage from './pages/JobsPage';
import ServicesPage from './pages/ServicesPage';
import PartnershipsPage from './pages/PartnershipsPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import RBACPage from './pages/RBACPage';
import WhatsAppPage from './pages/WhatsAppPage';
import AIChatPage from './pages/AIChatPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, _hasHydrated } = useAuth();

  // Wait for the persisted state to be rehydrated
  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversations"
          element={
            <ProtectedRoute>
              <ConversationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <ContactsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deals"
          element={
            <ProtectedRoute>
              <DealsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/knowledge"
          element={
            <ProtectedRoute>
              <KnowledgePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflows"
          element={
            <ProtectedRoute>
              <WorkflowsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/webhooks"
          element={
            <ProtectedRoute>
              <WebhooksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fsm"
          element={
            <ProtectedRoute>
              <FSMPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cmms"
          element={
            <ProtectedRoute>
              <CMmsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mcp"
          element={
            <ProtectedRoute>
              <MCPPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <JobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <ServicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/partnerships"
          element={
            <ProtectedRoute>
              <PartnershipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SystemSettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rbac"
          element={
            <ProtectedRoute>
              <RBACPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/whatsapp"
          element={
            <ProtectedRoute>
              <WhatsAppPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-chat"
          element={
            <ProtectedRoute>
              <AIChatPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
