import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Layout ko hum hata rahe hain Dashboard ke liye
// import { Layout } from './components/Layout'; 
import { Auth } from './views/Auth';
import { Landing } from './views/Landing';
import { Subscription } from './views/Subscription';

// Direct Imports
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

  // 👇 Role-Based Logic
  const renderDashboard = () => {
    switch (fullProfile?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'member':
      default:
        // Member Dashboard
        return <MemberDashboard />;
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Public Routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />
        
        {/* 2. PROTECTED DASHBOARD ROUTES (No Layout Wrapper = No Burger Menu) */}
        <Route 
          path="/" 
          element={
            session ? renderDashboard() : <Navigate to="/login" replace />
          } 
        />

        {/* 3. Subscription Route (Members ke liye alag se rakh sakte hain) */}
        <Route 
          path="/subscription" 
          element={
            session ? <Subscription user={fullProfile!} onPaymentSuccess={() => {}} /> : <Navigate to="/login" />
          } 
        />

        {/* Catch All - Redirect to Home */}
        <Route path="*" element={<Navigate to={session ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
