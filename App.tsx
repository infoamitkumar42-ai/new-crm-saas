import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './views/Auth';
import { Landing } from './views/Landing';
import { FilterSettings } from './views/FilterSettings';
import { Subscription } from './views/Subscription';
import { MemberDashboard } from './views/MemberDashboard';
import { ManagerDashboard } from './views/ManagerDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { NotificationBanner } from './components/NotificationBanner';
import { LeadAlert } from './components/LeadAlert';
import { useAuth } from './auth/useAuth';
import { supabase } from './supabaseClient';
import { User as CustomUser } from './types';
import { Loader2 } from 'lucide-react';

// ✅ UPDATED IMPORTS (Path changed to 'policies' folder)
import TermsOfService from './views/policies/TermsOfService';
import PrivacyPolicy from './views/policies/PrivacyPolicy';
import RefundPolicy from './views/policies/RefundPolicy';
import ShippingPolicy from './views/policies/ShippingPolicy';
import ContactUs from './views/policies/ContactUs';

// ✅ Keep Service Worker Alive - Inline Implementation
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

function App() {
  const { session, loading } = useAuth();
  const [fullProfile, setFullProfile] = useState<CustomUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);

  // ✅ Initialize Service Worker Keep-Alive
  useEffect(() => {
    initServiceWorkerKeepAlive();
  }, []);

  // Fetch user profile
  useEffect(() => {
    const getProfile = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          console.log("✅ User Profile:", data);
          setFullProfile(data as CustomUser);

          // Check paid status
          const hasActivePayment = data.payment_status === 'active';
          const hasValidSubscription = data.valid_until
            ? new Date(data.valid_until) > new Date()
            : false;
          const paidStatus = hasActivePayment && hasValidSubscription;

          console.log("💳 Paid Status:", {
            payment_status: data.payment_status,
            valid_until: data.valid_until,
            isPaid: paidStatus
          });

          setIsPaid(paidStatus);
        }
      }
      setProfileLoading(false);
    };
    getProfile();
  }, [session]);

  // Loading state
  if (loading || (session && profileLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Dashboard based on role
  const getDashboard = () => {
    if (!fullProfile) return <div>Error loading profile. Please Refresh.</div>;

    const userRole = fullProfile.role?.toLowerCase().trim();

    switch (userRole) {
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

  return (
    <BrowserRouter>
      {/* ════════════════════════════════════════════════════════
          🔔 NOTIFICATIONS (Active for Session + Profile)
          ════════════════════════════════════════════════════════ */}
      {session && fullProfile && (
        <>
          <NotificationBanner />
          <LeadAlert />
        </>
      )}

      <Routes>
        {/* Main Routes */}
        <Route
          path="/"
          element={session ? getDashboard() : <Landing />}
        />

        <Route
          path="/login"
          element={!session ? <Auth /> : <Navigate to="/" replace />}
        />
        
        <Route path="/landing" element={<Landing />} />

        {/* Protected Routes */}
        {session && fullProfile && (
          <>
            <Route
              path="/target"
              element={
                <Layout>
                  <FilterSettings user={fullProfile} onUpdate={() => {}} />
                </Layout>
              }
            />
            <Route
              path="/subscription"
              element={
                <Layout>
                  <Subscription user={fullProfile} onPaymentSuccess={() => {}} />
                </Layout>
              }
            />
          </>
        )}

        {/* ✅ LEGAL PAGES ROUTES (Public) */}
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/shipping" element={<ShippingPolicy />} />
        <Route path="/contact" element={<ContactUs />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
