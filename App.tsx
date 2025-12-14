import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 👇 Layout ko wapis import karein (Member ke liye)
import { Layout } from './components/Layout'; 

import { Auth } from './views/Auth';
import { Landing } from './views/Landing';
import { FilterSettings } from './views/FilterSettings'; // Target Audience Page
import { Subscription } from './views/Subscription';

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
        .then(({ data }) => {
          if (data) setFullProfile(data as CustomUser);
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

  // 👇 The Main Logic Fix: Only Member gets Layout
  const renderDashboard = () => {
    switch (fullProfile?.role) {
      case 'admin':
        return <AdminDashboard />; // Clean Full Screen
      case 'manager':
        return <ManagerDashboard />; // Clean Full Screen
      case 'member':
      default:
        // ✅ Member ko Burger Menu (Layout) ke andar dikhao
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
        {/* Public Routes */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />
        
        {/* Main Dashboard Route */}
        <Route 
          path="/" 
          element={session ? renderDashboard() : <Navigate to="/login" replace />} 
        />

        {/* 👇 Member Specific Pages (Wrapped in Layout) */}
        {session && (
          <>
            <Route path="/target" element={
              <Layout>
                <FilterSettings user={fullProfile!} onUpdate={() => {}} />
              </Layout>
            } />
            
            <Route path="/subscription" element={
              <Layout>
                <Subscription user={fullProfile!} onPaymentSuccess={() => {}} />
              </Layout>
            } />
          </>
        )}

        {/* Catch All */}
        <Route path="*" element={<Navigate to={session ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
