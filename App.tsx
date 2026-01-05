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
// 🛡️ PROTECTED ROUTE COMPONENT
// ============================================================
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, profile, loading } = useAuth();

  // ✅ FIX: Only show loader if we are loading AND don't know the user yet
  // Agar user mil gaya hai (isAuthenticated is true), toh loading ka wait mat karo
  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-slate-500 text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// ============================================================
// 🔀 DASHBOARD ROUTER (Role-based)
// ============================================================
const DashboardRouter: React.FC = () => {
  const { profile, loading } = useAuth();

  // ✅ FIX: Wait for loading ONLY if profile is missing
  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Double check
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
// 🌐 PUBLIC ROUTE (Redirect if logged in)
// ============================================================
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // ✅ FIX: Only load if we are not sure about auth status
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
// 🔧 SERVICE WORKER KEEP ALIVE
// ============================================================
function initServiceWorkerKeepAlive() {
  if (!('serviceWorker' in navigator)) return;
  
  const keepAlive = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        const messageChannel = new MessageChannel();
        registration.active.postMessage('KEEP_ALIVE', [messageChannel.port2]);
      }
    } catch (err) {
      // Silent fail
    }
  };
  
  setInterval(keepAlive, 25000);
  keepAlive();
}

// ============================================================
// 🎯 MAIN APP ROUTES
// ============================================================
const AppRoutes: React.FC = () => {
  const { isAuthenticated, profile } = useAuth();

  // Initialize Service Worker
  useEffect(() => {
    initServiceWorkerKeepAlive();
  }, []);

  return (
    <>
      {/* Notifications - Only show when authenticated */}
      {isAuthenticated && profile && (
        <>
          <NotificationBanner />
          <LeadAlert />
        </>
      )}

      <Routes>
        {/* ━━━ PUBLIC ROUTES ━━━ */}
        <Route path="/login" element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } />

        <Route path="/signup" element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } />

        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/landing" element={<Landing />} />

        {/* ━━━ MAIN DASHBOARD ━━━ */}
        {/* If authenticated, show dashboard, else show Landing page */}
        <Route path="/" element={
          isAuthenticated ? <DashboardRouter /> : <Landing />
        } />

        {/* ━━━ PROTECTED MEMBER ROUTES ━━━ */}
        <Route path="/target" element={
          <ProtectedRoute>
            <Layout>
              <TargetAudience />
            </Layout>
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

        {/* ━━━ ROLE-SPECIFIC ROUTES ━━━ */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/manager/*" element={
          <ProtectedRoute allowedRoles={['manager', 'admin']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />

        {/* ━━━ LEGAL PAGES ━━━ */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/shipping" element={<ShippingPolicy />} />
        <Route path="/contact" element={<ContactUs />} />

        {/* ━━━ FALLBACK ━━━ */}
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
