// src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './views/Auth';
import { Landing } from './views/Landing';
import { TargetAudience } from './components/TargetAudience';
import { Subscription } from './components/Subscription';
import { MemberDashboard } from './views/MemberDashboard';
import { ManagerDashboard } from './views/ManagerDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { NotificationBanner } from './components/NotificationBanner';
import { LeadAlert } from './components/LeadAlert';
import { AuthProvider, useAuth } from './auth/useAuth';
import { ResetPassword } from './views/ResetPassword';
import ApplyForm from './views/ApplyForm';
import { Loader2 } from 'lucide-react';

// ✅ LEGAL PAGES
import { TermsOfService } from './views/legal/TermsOfService';
import { PrivacyPolicy } from './views/legal/PrivacyPolicy';
import { RefundPolicy } from './views/legal/RefundPolicy';
import { ShippingPolicy } from './views/legal/ShippingPolicy';
import { ContactUs } from './views/legal/ContactUs';

// ============================================================
// 🔄 LOADING SCREEN COMPONENT
// ============================================================
const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Loading workspace..." }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
    <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
    <p className="text-slate-500 text-sm">{message}</p>
  </div>
);

// ============================================================
// 🛡️ PROTECTED ROUTE (FIXED)
// ============================================================
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, profile, loading } = useAuth();

  // ✅ FIRST: Check if still loading
  if (loading) {
    return <LoadingScreen message="Verifying session..." />;
  }

  // ✅ SECOND: Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ THIRD: Check role permissions
  if (allowedRoles && profile && !allowedRoles.includes(profile.role || '')) {
    console.log("⛔ Role not allowed:", profile.role, "Required:", allowedRoles);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// ============================================================
// 🔀 DASHBOARD ROUTER
// ============================================================
const DashboardRouter: React.FC = () => {
  const { profile, loading } = useAuth();

  // Should not happen if coming through ProtectedRoute, but safety check
  if (loading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  const role = profile.role?.toLowerCase().trim();

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'member':
    default:
      return (
        <Layout>
          <MemberDashboard />
        </Layout>
      );
  }
};

// ============================================================
// 🌐 PUBLIC ROUTE (FIXED)
// ============================================================
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // ✅ Show loader only while loading
  if (loading) {
    return <LoadingScreen message="Checking session..." />;
  }

  // ✅ Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// ============================================================
// 🏠 ROOT ROUTE HANDLER (NEW)
// ============================================================
const RootRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  // ✅ Show loader while determining auth state
  if (loading) {
    return <LoadingScreen />;
  }

  // ✅ Show dashboard if authenticated, otherwise landing
  if (isAuthenticated) {
    return <DashboardRouter />;
  }

  return <Landing />;
};

// ============================================================
// 🎯 MAIN APP ROUTES
// ============================================================
const AppRoutes: React.FC = () => {
  const { isAuthenticated, profile, loading } = useAuth();

  return (
    <>
      <LeadAlert />

      {/* Only show these when verified session exists */}
      {!loading && isAuthenticated && (
        <>
          <NotificationBanner />
        </>
      )}

      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/apply" element={<ApplyForm />} />

        {/* Root Route - Shows Landing or Dashboard based on auth */}
        <Route path="/" element={<RootRoute />} />

        {/* Protected Routes */}
        <Route path="/target" element={
          <ProtectedRoute>
            <Layout><TargetAudience /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/subscription" element={
          <ProtectedRoute>
            <Subscription onClose={() => window.history.back()} />
          </ProtectedRoute>
        } />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Manager Routes */}
        <Route path="/manager/*" element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />

        {/* Legal Pages (Public) */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/shipping" element={<ShippingPolicy />} />
        <Route path="/contact" element={<ContactUs />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

// ============================================================
// 🚀 MAIN APP COMPONENT
// ============================================================
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
