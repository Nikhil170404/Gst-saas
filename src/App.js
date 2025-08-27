
// src/App.js - Enhanced with all new features
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/common/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import { FeatureFlagProvider } from './hooks/useFeatureFlags';
import './styles/global.css';
import './styles/components.css';
import './styles/modern.css';

// Lazy load existing pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const InvoicesPage = React.lazy(() => import('./pages/invoices/InvoicesPage'));
const CreateInvoicePage = React.lazy(() => import('./pages/invoices/CreateInvoicePage'));
const ExpensesPage = React.lazy(() => import('./pages/expenses/ExpensesPage'));
const ReportsPage = React.lazy(() => import('./pages/reports/ReportsPage'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));

// Lazy load NEW pages
const InventoryPage = React.lazy(() => import('./pages/inventory/InventoryPage'));
const BankingPage = React.lazy(() => import('./pages/banking/BankingPage'));
const PayrollPage = React.lazy(() => import('./pages/payroll/PayrollPage'));
const PurchaseOrdersPage = React.lazy(() => import('./pages/purchase-orders/PurchaseOrdersPage'));
const VendorsPage = React.lazy(() => import('./pages/vendors/VendorsPage'));
const CustomersPage = React.lazy(() => import('./pages/customers/CustomersPage'));
const ProjectsPage = React.lazy(() => import('./pages/projects/ProjectsPage'));
const GSTFilingPage = React.lazy(() => import('./pages/gst/GSTFilingPage'));
const CompliancePage = React.lazy(() => import('./pages/compliance/CompliancePage'));
const IntegrationsPage = React.lazy(() => import('./pages/integrations/IntegrationsPage'));
const UserManagementPage = React.lazy(() => import('./pages/users/UserManagementPage'));

// Create React Query client with enhanced config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry for 4xx errors except 408 (timeout)
        if (error.status >= 400 && error.status < 500 && error.status !== 408) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Enhanced Protected Route with role checking
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (requiredRole && userData?.role !== requiredRole && userData?.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Enhanced Public Route
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We're sorry, but something unexpected happened.</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FeatureFlagProvider>
            <Router>
              <div className="App">
                <Suspense fallback={<LoadingSpinner fullScreen text="Loading application..." />}>
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

                    {/* Protected routes - Main features */}
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

                    {/* Invoice Management */}
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

                    {/* Expense Management */}
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

                    {/* NEW: Inventory Management */}
                    <Route 
                      path="/inventory" 
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <InventoryPage />
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />

                    {/* NEW: Banking & Payments */}
                    <Route 
                      path="/banking" 
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <BankingPage />
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />

                    {/* NEW: Payroll Management */}
                    <Route 
                      path="/payroll" 
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <PayrollPage />
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />

                    {/* NEW: Purchase Orders */}
                    <Route 
                      path="/purchase-orders" 
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <PurchaseOrdersPage />
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />

                    {/* NEW: Vendor Management */}
                    <Route 
                      path="/vendors" 
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <VendorsPage />
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />

                    {/* NEW: Customer Management */}
                    <Route 
                      path="/customers" 
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <CustomersPage />
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />

                    {/* NEW: Project Management */}
                    <Route 
                      path="/projects" 
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ProjectsPage />
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />

                    {/* NEW: GST Filing */}
                    <Route 
                      path="/gst-filing" 
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <GSTFilingPage />
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />

                    {/* NEW: Compliance Dashboard */}
                    <Route 
                      path="/compliance" 
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <CompliancePage />
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />

                    {/* Enhanced Reports */}
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

                    {/* NEW: Third-party Integrations */}
                    <Route 
                      path="/integrations" 
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <IntegrationsPage />
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />

                    {/* NEW: User Management (for multi-user plans) */}
                    <Route 
                      path="/users" 
                      element={
                        <ProtectedRoute requiredRole="owner">
                          <Layout>
                            <UserManagementPage />
                          </Layout>
                        </ProtectedRoute>
                      } 
                    />

                    {/* Settings */}
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

                {/* Enhanced Global toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'white',
                      color: 'var(--gray-800)',
                      border: '1px solid var(--gray-200)',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                      borderRadius: '0.75rem',
                      padding: '16px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: 'white',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: 'white',
                      },
                    },
                    loading: {
                      iconTheme: {
                        primary: '#3b82f6',
                        secondary: 'white',
                      },
                    },
                  }}
                />

                {/* Service Worker Registration */}
                <ServiceWorkerRegistration />
              </div>
            </Router>
          </FeatureFlagProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Service Worker Registration Component
const ServiceWorkerRegistration = () => {
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return null;
};

export default App;