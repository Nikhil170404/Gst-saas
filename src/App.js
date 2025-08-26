// src/App.js
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/common/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import './styles/global.css';
import './styles/components.css';
import './styles/modern.css';

// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const InvoicesPage = React.lazy(() => import('./pages/invoices/InvoicesPage'));
const CreateInvoicePage = React.lazy(() => import('./pages/invoices/CreateInvoicePage'));
const ExpensesPage = React.lazy(() => import('./pages/expenses/ExpensesPage'));
const ReportsPage = React.lazy(() => import('./pages/reports/ReportsPage'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));

// Import global styles


// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  } 
                />
                
                <Route 
                  path="/register" 
                  element={
                    <PublicRoute>
                      <RegisterPage />
                    </PublicRoute>
                  } 
                />

                {/* Protected routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <DashboardPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/invoices" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <InvoicesPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/invoices/create" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <CreateInvoicePage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/expenses" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ExpensesPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <ReportsPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <SettingsPage />
                      </Layout>
                    </ProtectedRoute>
                  } 
                />

                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>

            {/* Global toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'white',
                  color: 'var(--gray-800)',
                  border: '1px solid var(--gray-200)',
                  boxShadow: 'var(--shadow-lg)',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--success-500)',
                    secondary: 'white',
                  },
                },
                error: {
                  iconTheme: {
                    primary: 'var(--error-500)',
                    secondary: 'white',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;