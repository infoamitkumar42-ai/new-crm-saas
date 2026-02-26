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
import ApplyForm from './views/ApplyForm';
import { Loader2, WifiOff } from 'lucide-react';
import { ENV } from './config/env';

// ✅ LEGAL PAGES
import { TermsOfService } from './views/legal/TermsOfService';
import { PrivacyPolicy } from './views/legal/PrivacyPolicy';
import { RefundPolicy } from './views/legal/RefundPolicy';
import { ShippingPolicy } from './views/legal/ShippingPolicy';
import { ContactUs } from './views/legal/ContactUs';

// ============================================================
// 🔄 LOADING SCREEN COMPONENT
// ============================================================
// 🔄 LOADING SCREEN COMPONENT
const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Loading workspace..." }) => {
  const [showRetry, setShowRetry] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 8000); // Reduced from 15s→8s
    return () => clearTimeout(timer);
  }, []);

  const handleForceRefresh = async () => {
    try {
      // 1. Unregister all service workers (Force bypass SW cache)
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      // 2. Clear Session & Local Caches
      sessionStorage.clear();
      localStorage.clear();

      // 3. Clear Cache Storage (PWA Assets like old JS/CSS files)
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }

      // 4. Hard Reload bypassing disk cache
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-600 font-medium mb-1">{message}</p>
      <p className="text-slate-400 text-xs mb-6">Connecting to secure server...</p>

      {showRetry && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <button
            onClick={handleForceRefresh}
            className="px-6 py-3 bg-white border border-slate-200 text-blue-600 rounded-xl shadow-sm font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Force Refresh App
          </button>
          <p className="mt-3 text-[10px] text-slate-400 max-w-[200px] leading-relaxed">
            Click this if loading takes too long. It will clear cache and fix the hang.
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 🛡️ PROTECTED ROUTE (FIXED)
// ============================================================
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, profile, loading, isInitialized, isNetworkError } = useAuth();

  // 🌐 NEW: Handle Network Error (Slow Internet)
  if (isNetworkError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <WifiOff size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Issue</h2>
        <p className="text-slate-500 max-w-sm mb-6 leading-relaxed">
          We're having trouble connecting to the Supabase server. This usually happens on unstable internet connections (like Jio/Mobile data) or if your ISP is blocking the database.
        </p>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 text-left max-w-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quick Fixes:</p>
          <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
            <li>Switch to <strong>Wi-Fi</strong> or a different mobile network.</li>
            <li>Try turning <strong>Airplane Mode</strong> on and off.</li>
            <li>Wait 30 seconds and click Try Again below.</li>
          </ul>
        </div>

        <button
          onClick={() => {
            // Aggressive reload
            localStorage.removeItem('leadflow-profile-cache');
            window.location.reload();
          }}
          className="px-10 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ✅ FIRST: Check if still loading OR not initialized
  if (loading || !isInitialized) {
    return <LoadingScreen message="Verifying session..." />;
  }

  // ✅ SECOND: Check authentication ONLY after initialization
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

  if (!profile || !profile.role) {
    console.warn("⚠️ DashboardRouter: Missing profile or role. Redirecting...");
    return <Navigate to="/login" replace />;
  }

  const role = profile.role.toLowerCase().trim();

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
import * as Sentry from "@sentry/react";

function App() {
  // 🚀 AGGRESSIVE SERVICE WORKER CLEANUP (Fixes PWA stuck loading)
  useEffect(() => {
    const cleanupServiceWorkers = async () => {
      if (!('serviceWorker' in navigator)) return;
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          if (registration.installing || registration.waiting) {
            await registration.unregister();
          }
        }
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            if (cacheName.includes('workbox') || cacheName.includes('precache') || cacheName.includes('runtime')) {
              await caches.delete(cacheName);
            }
          }
        }
      } catch (e) {
        console.warn('SW cleanup error (non-critical):', e);
      }
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker Updated (Silent)');
      });
    };
    cleanupServiceWorkers();
  }, []);

  if (!ENV.SUPABASE_URL || ENV.SUPABASE_URL === '' || !ENV.SUPABASE_URL.includes('http')) {
    return (
      <div style={{ padding: 40, backgroundColor: '#FEF2F2', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ color: '#DC2626', fontSize: 32, marginBottom: 16 }}>⚠️ CRITICAL CONFIG ERROR</h1>
        <p style={{ fontSize: 18, color: '#374151' }}>The App cannot connect to the Database.</p>
        <div style={{ backgroundColor: '#F3F4F6', padding: 20, borderRadius: 8, marginTop: 20, fontFamily: 'monospace' }}>
          <p><strong>Missing Variable:</strong> <span style={{ color: '#DC2626' }}>VITE_SUPABASE_URL</span></p>
          <p><strong>Current Value:</strong> {JSON.stringify(ENV.SUPABASE_URL)}</p>
        </div>
      </div>
    );
  }

  return (
    <Sentry.ErrorBoundary fallback={<div className="p-10 text-center"><h1>Something went wrong.</h1><p>Our team has been notified.</p></div>}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  );
}


export default App;
