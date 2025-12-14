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
            // Data fetch karte waqt thoda wait logic
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (data) {
                console.log("User Role Found:", data.role); // 👈 Console mein check krne ke liye
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

  // 👇 Improved Dashboard Logic (Case Insensitive)
  const getDashboard = () => {
    if (!fullProfile) return <div>Error loading profile. Please Refresh.</div>;

    // Role ko small letters mein convert karke check karo
    const userRole = fullProfile.role?.toLowerCase().trim(); 

    // 👇 DEBUGGER: Agar mobile pe galti ho rahi hai, to ye upar dikhega
    // (Launch ke baad ise hata dena)
    // return <div>Role Detected: {userRole}</div>; 

    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'member':
      default:
        // Agar role kuch ajeeb hai ya 'member' hai, tabhi ye khulega
        return (
            <Layout>
                <MemberDashboard />
            </Layout>
        );
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        
        {/* Main Route Logic */}
        <Route 
          path="/" 
          element={session ? getDashboard() : <Landing />} 
        />

        <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />
        <Route path="/landing" element={<Landing />} />
        
        {/* Protected Routes */}
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
