import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './views/Auth';
import { Landing } from './views/Landing';
import { FilterSettings } from './views/FilterSettings';
import { Subscription } from './views/Subscription';

// Direct Imports (No sub-folders needed if flat structure)
import { MemberDashboard } from './views/MemberDashboard';
import { ManagerDashboard } from './views/ManagerDashboard';
import { AdminDashboard } from './views/AdminDashboard';

import { useAuth } from './auth/useAuth';
import { supabase } from './supabaseClient';
import { User as CustomUser } from './types';

function App() {
  const { session, loading } = useAuth();
  const [fullProfile, setFullProfile] = useState<CustomUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (data) {
            setFullProfile(data as CustomUser);
          }
          setProfileLoading(false);
        });
    } else {
      setProfileLoading(false);
    }
  }, [session]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading LeadFlow...</p>
        </div>
      </div>
    );
  }

  // 👇 Role-Based Dashboard Switcher
  const getDashboardByRole = () => {
    switch (fullProfile?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'member':
      default:
        return <MemberDashboard />;
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />
        
        {/* Protected Routes (Wrapped in Layout) */}
        <Route element={session ? <Layout /> : <Navigate to="/login" replace />}>
          
          {/* Main Dashboard (Changes based on Role) */}
          <Route path="/" element={getDashboardByRole()} />
          
          <Route path="/target" element={<FilterSettings user={fullProfile!} onUpdate={() => {}} />} />
          <Route path="/subscription" element={<Subscription user={fullProfile!} onPaymentSuccess={() => {}} />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<Navigate to={session ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
