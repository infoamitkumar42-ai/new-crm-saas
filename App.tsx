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
import { useAuth } from './auth/useAuth';
import { supabase } from './supabaseClient';
import { User as CustomUser } from './types';
import { Loader2 } from 'lucide-react';

function App() {
  const { session, loading } = useAuth();
  const [fullProfile, setFullProfile] = useState<CustomUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
        if (session?.user) {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (data) {
                console.log("User Role Found:", data.role);
                setFullProfile(data as CustomUser);
            }
        }
        setProfileLoading(false);
    };
    getProfile();
  }, [session]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

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
      {/* 👇 ALL logged-in users के लिए Notification Banner */}
      {session && fullProfile && <NotificationBanner />}

      <Routes>
        <Route 
          path="/" 
          element={session ? getDashboard() : <Landing />} 
        />

        <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />
        <Route path="/landing" element={<Landing />} />
        
        {session && fullProfile && (
            <>
                <Route path="/target" element={
                    <Layout>
                        <FilterSettings user={fullProfile} onUpdate={() => {}} />
                    </Layout>
                } />
                <Route path="/subscription" element={
                    <Layout>
                        <Subscription user={fullProfile} onPaymentSuccess={() => {}} />
                    </Layout>
                } />
            </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
