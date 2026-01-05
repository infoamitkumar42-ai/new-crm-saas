// src/App.tsx

import React, { useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';

// ✅ LEGAL PAGES
import { TermsOfService } from './views/legal/TermsOfService';
import { PrivacyPolicy } from './views/legal/PrivacyPolicy';
import { RefundPolicy } from './views/legal/RefundPolicy';
import { ShippingPolicy } from './views/legal/ShippingPolicy';
import { ContactUs } from './views/legal/ContactUs';

// ============================================================
// 🛡️ PROTECTED ROUTE
// ============================================================
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, profile, loading } = useAuth();

  // ✅ IF AUTHENTICATED: Show content immediately (Ignore loading)
  if (isAuthenticated) {
    // Role check
    if (allowedRoles && profile && !allowedRoles.includes(profile.role || '')) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // ✅ IF NOT AUTHENTICATED & LOADING: Show Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
        <p className="text-slate-500 text-sm">Loading workspace...</p>
      </div>
    );
  }

  // ✅ IF NOT AUTHENTICATED & NOT LOADING: Redirect to Login
  return <Navigate to="/login" replace />;
};

// ============================================================
// 🔀 DASHBOARD ROUTER
// ============================================================
const DashboardRouter: React.FC = () => {
  const { profile } = useAuth();

  // Profile should exist if we reached here via ProtectedRoute
  if (!profile) return null;

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
// 🌐 PUBLIC ROUTE
// ============================================================
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Only show loader if we are loading AND don't know auth status yet
  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// ============================================================
// 🎯 MAIN APP
// ============================================================
const AppRoutes: React.FC = () => {
  const { isAuthenticated, profile } = useAuth();

  return (
    <>
      {isAuthenticated && profile && (
        <>
          <NotificationBanner />
          <LeadAlert />
        </>
      )}

      <Routes>
        <Route path="/login" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Auth /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/landing" element={<Landing />} />

        {/* Root Route */}
        <Route path="/" element={
          isAuthenticated ? <DashboardRouter /> : <Landing />
        } />

        {/* Protected Routes */}
        <Route path="/target" element={<ProtectedRoute><Layout><TargetAudience /></Layout></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><Subscription onClose={() => window.history.back()} /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

        <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/manager/*" element={<ProtectedRoute allowedRoles={['manager', 'admin']}><ManagerDashboard /></ProtectedRoute>} />

        {/* Legal */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/shipping" element={<ShippingPolicy />} />
        <Route path="/contact" element={<ContactUs />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

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
