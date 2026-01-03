import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './views/Auth';
import { Landing } from './views/Landing';
import { TargetAudience } from './components/TargetAudience'; // ✅ Correct Import
import { Subscription } from './components/Subscription'; // ✅ Correct Import
import { MemberDashboard } from './views/MemberDashboard';
import { ManagerDashboard } from './views/ManagerDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { NotificationBanner } from './components/NotificationBanner';
import { LeadAlert } from './components/LeadAlert';
import { useAuth } from './auth/useAuth';
import { supabase } from './supabaseClient';
import { User as CustomUser } from './types';
import { Loader2 } from 'lucide-react';

// ✅ LEGAL PAGES
import { TermsOfService } from './views/legal/TermsOfService';
import { PrivacyPolicy } from './views/legal/PrivacyPolicy';
import { RefundPolicy } from './views/legal/RefundPolicy';
import { ShippingPolicy } from './views/legal/ShippingPolicy';
import { ContactUs } from './views/legal/ContactUs';

// ✅ Service Worker Keep Alive
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

  // Initialize Service Worker
  useEffect(() => {
    initServiceWorkerKeepAlive();
  }, []);

  // Fetch User Profile
  useEffect(() => {
    const getProfile = async () => {
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          setFullProfile(data as CustomUser);
        }
      }
      setProfileLoading(false);
    };
    getProfile();
  }, [session]);

  if (loading || (session && profileLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Dashboard Role Logic
  const getDashboard = () => {
    if (!fullProfile) return <div>Error loading profile. Please refresh.</div>;
    const role = fullProfile.role?.toLowerCase().trim();
    switch (role) {
      case 'admin': return <AdminDashboard />;
      case 'manager': return <ManagerDashboard />;
      default: return (
        <Layout>
          <MemberDashboard />
        </Layout>
      );
    }
  };

  return (
    <BrowserRouter>
      {/* Notifications */}
      {session && fullProfile && (
        <>
          <NotificationBanner />
          <LeadAlert />
        </>
      )}

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />
        <Route path="/landing" element={<Landing />} />
        
        {/* Main Dashboard */}
        <Route path="/" element={session ? getDashboard() : <Landing />} />

        {/* Protected Member Routes */}
        {session && fullProfile && (
          <>
            {/* ✅ Target Audience Route Linked */}
            <Route path="/target" element={
              <Layout>
                <TargetAudience />
              </Layout>
            } />
            
            {/* ✅ Subscription Route Linked */}
            <Route path="/subscription" element={
              <Layout>
                <Subscription onClose={() => window.history.back()} />
              </Layout>
            } />
          </>
        )}

        {/* Legal Pages */}
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
