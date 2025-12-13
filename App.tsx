import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Auth } from './views/Auth';
import { Dashboard } from './views/Dashboard';
import { Landing } from './views/Landing';
import { FilterSettings } from './views/FilterSettings';
import { Subscription } from './views/Subscription';
import { AdminDashboard } from './views/AdminDashboard';
import { useAuth } from './auth/useAuth';
import { supabase } from './supabaseClient';
import { User as CustomUser } from './types';

function App() {
  const { session, profile, loading } = useAuth();
  const [fullProfile, setFullProfile] = useState<CustomUser | null>(null);

  useEffect(() => {
    if (session?.user && profile) {
      supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(({ data, error }) => {
          if (data) {
            setFullProfile({
              id: data.id,
              email: data.email,
              name: data.name || 'User',
              sheet_url: data.sheet_url || '',
              payment_status: data.payment_status || 'inactive',
              valid_until: data.valid_until || null,
              filters: data.filters || {},
              daily_limit: data.daily_limit || 0,
              role: data.role || 'user',
            });
          }
        });
    }
  }, [session, profile]);

  const handleFilterUpdate = async (filters: any) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('users')
      .update({ filters })
      .eq('id', session.user.id);
    
    if (!error && fullProfile) {
      setFullProfile({ ...fullProfile, filters });
    }
  };

  const handlePaymentSuccess = async () => {
    if (session?.user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (data) setFullProfile(data as CustomUser);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={!session ? <Auth /> : <Navigate to="/" replace />} />
        
        <Route element={session ? <Layout /> : <Navigate to="/login" replace />}>
          <Route 
            path="/" 
            element={
              fullProfile?.role === 'admin' 
                ? <AdminDashboard user={fullProfile} />
                : <Dashboard />
            } 
          />
          
          <Route 
            path="/target" 
            element={
              fullProfile ? (
                <FilterSettings 
                  user={fullProfile} 
                  onUpdate={handleFilterUpdate} 
                />
              ) : (
                <div className="p-8">Loading profile...</div>
              )
            } 
          />
          
          <Route 
            path="/subscription" 
            element={
              fullProfile ? (
                <Subscription 
                  user={fullProfile} 
                  onPaymentSuccess={handlePaymentSuccess} 
                />
              ) : (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading...</p>
                </div>
              )
            } 
          />
        </Route>

        <Route path="*" element={<Navigate to={session ? "/" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
