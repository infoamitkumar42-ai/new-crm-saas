import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./auth/useAuth";
import { Landing } from "./views/Landing";
import { Layout as MainLayout } from "./components/Layout";
import { Dashboard } from "./views/Dashboard";
import { FilterSettings } from "./views/FilterSettings";
import { Subscription } from "./views/Subscription";
import { AdminDashboard } from "./views/AdminDashboard";
import { FilterConfig } from "./types";
import { supabase } from "./supabaseClient";

// TabId mein se 'settings' hata diya hai, ab sirf 'filters' (Target Audience) rahega
type TabId = "dashboard" | "filters" | "subscription" | "admin";

const AppInner = () => {
  const { session, profile, loading, signOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [showAuth, setShowAuth] = useState(false);
  
  // State for handling stuck setup
  const [setupElapsed, setSetupElapsed] = useState(0);

  // Timer to track setup duration and poll profile
  useEffect(() => {
    let timer: any;
    if (session && !profile) {
       timer = setInterval(() => {
         setSetupElapsed(prev => prev + 1);
         // Poll profile every 3 seconds
         if (setupElapsed > 0 && setupElapsed % 3 === 0) {
             refreshProfile();
         }
       }, 1000);
    } else {
        setSetupElapsed(0);
    }
    return () => clearInterval(timer);
  }, [session, profile, refreshProfile, setupElapsed]);

  // 1. Global Loading
  if (loading) {
      return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50">
         <div className="flex flex-col items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-2"></div>
             <div className="text-slate-500 text-sm">Loading LeadFlow...</div>
         </div>
       </div>
     );
  }

  // 2. Not Logged In -> Landing Page
  if (!session) {
    return (
      <Landing
        showAuth={showAuth}
        onStart={() => setShowAuth(true)}
      />
    );
  }

  // 3. Logged In BUT No Profile (Stuck in Setup)
  if (session && !profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center max-w-md text-center px-4 bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-4"></div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Setting up your dashboard</h2>
              <p className="text-slate-500 text-sm mb-6">
                  We are creating your account profile. This usually takes a few seconds.
              </p>
              
              {setupElapsed > 5 && (
                  <div className="w-full space-y-4 animate-in fade-in duration-500">
                      <p className="text-amber-700 text-xs bg-amber-50 p-2 rounded">
                          Taking longer than expected? 
                      </p>
                      <button 
                          onClick={() => window.location.reload()}
                          className="w-full py-2 px-4 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                      >
                          Reload Page
                      </button>
                      <button 
                        onClick={signOut}
                        className="text-slate-400 text-xs hover:text-slate-600 underline block w-full"
                      >
                        Sign Out
                      </button>
                  </div>
              )}
          </div>
        </div>
      );
  }
   
  // 4. MAIN APP (Profile Exists)
  const isAdmin = profile?.role === "admin";

  const updateFilters = async (filters: FilterConfig, dailyLimit?: number) => {
    if (!profile) return;
    try {
        const updates: any = { filters };
        if (dailyLimit !== undefined) updates.daily_limit = dailyLimit;

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', profile.id);
            
        if (error) throw error;
        await refreshProfile(); 
    } catch (e) {
        console.error("Failed to update filters", e);
        alert('Failed to save settings.');
    }
  };

  const handlePaymentSuccess = (planId: string, paymentId: string) => {
      alert('Payment processed! Your account status will update shortly.');
      window.location.reload();
  };

  return (
    // MainLayout mein hum Navigation Logic Custom pass kar rahe hain
    // Taaki 'Settings' button hat jaye aur 'Target Audience' aa jaye
    <div className="min-h-screen bg-slate-50 flex">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">LeadFlow</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {/* Dashboard */}
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            <span>Dashboard</span>
          </button>

          {/* Target Audience (Filters) */}
          <button 
            onClick={() => setActiveTab('filters')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'filters' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
            <span>Target Audience</span>
          </button>

          {/* Plans & Billing */}
          <button 
            onClick={() => setActiveTab('subscription')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'subscription' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span>Plans & Billing</span>
          </button>

          {/* Admin (Only if role is admin) */}
          {isAdmin && (
             <button 
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'admin' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span>Admin Panel</span>
            </button>
          )}

          {/* Logout */}
          <button 
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-lg transition-colors mt-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white z-50 px-4 py-3 flex justify-between items-center">
         <span className="font-bold">LeadFlow</span>
         <button onClick={signOut} className="text-sm text-red-400">Sign Out</button>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mt-12 md:mt-0">
        {/* Warning Banner */}
        {!profile.sheet_url && (
           <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <span className="font-bold">Setup Incomplete:</span> Your Google Sheet could not be created automatically. 
                    Please click the <strong>"Retry Connection"</strong> button in your dashboard below.
                  </p>
                </div>
              </div>
           </div>
        )}

        {activeTab === "dashboard" && <Dashboard user={profile!} />}
        
        {/* Targeting & Filters (Settings Merged) */}
        {activeTab === "filters" && (
            <FilterSettings 
              user={profile!} 
              onUpdate={async (f, l) => updateFilters(f, l)} 
            />
        )}
        
        {activeTab === "subscription" && (
          <Subscription user={profile!} onPaymentSuccess={handlePaymentSuccess} />
        )}
        
        {activeTab === "admin" && isAdmin && (
           <AdminDashboard user={profile!} />
        )}
        {activeTab === "admin" && !isAdmin && (
            <div className="p-6 text-sm text-red-600">
              Access denied. Admins only.
            </div>
        )}
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
};

export default App;
