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

type TabId = "dashboard" | "filters" | "subscription" | "admin";

const AppInner = () => {
  const { session, profile, loading, signOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [showAuth, setShowAuth] = useState(false);
  
  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // State to track how long we are stuck in setup
  const [setupElapsed, setSetupElapsed] = useState(0);

  // 🛡️ SMART RECOVERY LOGIC
  useEffect(() => {
    let timer: any;
    
    // Sirf tab chalega jab Session hai lekin Profile load nahi ho pa raha
    if (session && !profile) {
       timer = setInterval(async () => {
         setSetupElapsed(prev => prev + 1);
         
         // Har 2 second mein database check karo
         if (setupElapsed % 2 === 0) {
             await refreshProfile();
         }
       }, 1000);
    } else {
        // Reset counter when profile is found
        setSetupElapsed(0);
    }
    return () => clearInterval(timer);
  }, [session, profile, refreshProfile, setupElapsed]);

  // 1. Global Loading (App Start)
  if (loading) {
      return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50">
         <div className="flex flex-col items-center animate-pulse">
             <div className="h-10 w-10 bg-brand-200 rounded-full mb-3"></div>
             <div className="text-slate-400 text-sm font-medium">Starting LeadFlow...</div>
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

  // 3. Logged In BUT No Profile (STUCK STATE HANDLER)
  if (session && !profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-8 max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-slate-900">Finalizing Setup...</h2>
              <p className="text-slate-500 text-sm mt-2 mb-6">
                We are preparing your dashboard. <br/>This usually takes 2-3 seconds.
              </p>
              
              {/* Agar 5 second se jyada lage, to ye button dikhao */}
              {setupElapsed > 5 && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-amber-600 text-xs bg-amber-50 p-2 rounded border border-amber-100">
                        Taking longer than expected?
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                    >
                        Click to Fix & Reload
                    </button>
                    <button 
                        onClick={signOut}
                        className="block w-full text-slate-400 text-xs hover:text-slate-600 mt-2"
                    >
                        Log Out
                    </button>
                  </div>
              )}
          </div>
        </div>
      );
  }

  // 4. MAIN APP (System Healthy ✅)
  const isAdmin = profile?.role === "admin";

  const updateFilters = async (filters: FilterConfig, dailyLimit?: number) => {
    if (!profile) return;
    try {
        const updates: any = { filters };
        if (dailyLimit !== undefined) updates.daily_limit = dailyLimit;

        const { error } = await supabase.from('users').update(updates).eq('id', profile.id);
        if (error) throw error;
        await refreshProfile(); 
    } catch (e) {
        alert('Failed to save settings. Please check your connection.');
    }
  };

  const handlePaymentSuccess = () => {
      alert('Payment processed! Updating account...');
      window.location.reload();
  };

  const handleTabChange = (tab: TabId) => {
      setActiveTab(tab);
      setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white z-50 px-4 py-3 flex justify-between items-center shadow-lg">
         <span className="font-bold text-lg tracking-tight">LeadFlow</span>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 active:bg-slate-800 rounded-lg">
            {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            )}
         </button>
      </div>

      {/* --- MOBILE MENU OVERLAY --- */}
      {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-900/98 pt-20 px-6 backdrop-blur-sm animate-in fade-in slide-in-from-top-5 duration-200">
              <nav className="space-y-3">
                  <button onClick={() => handleTabChange('dashboard')} className={`w-full text-left py-4 px-4 rounded-xl text-lg font-medium transition-all ${activeTab === 'dashboard' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-slate-300 hover:bg-slate-800'}`}>
                      Dashboard
                  </button>
                  <button onClick={() => handleTabChange('filters')} className={`w-full text-left py-4 px-4 rounded-xl text-lg font-medium transition-all ${activeTab === 'filters' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-slate-300 hover:bg-slate-800'}`}>
                      Target Audience
                  </button>
                  <button onClick={() => handleTabChange('subscription')} className={`w-full text-left py-4 px-4 rounded-xl text-lg font-medium transition-all ${activeTab === 'subscription' ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20' : 'text-slate-300 hover:bg-slate-800'}`}>
                      Plans & Billing
                  </button>
                  {isAdmin && (
                      <button onClick={() => handleTabChange('admin')} className="w-full text-left py-4 px-4 rounded-xl text-lg font-medium text-amber-400 hover:bg-slate-800">
                          Admin Panel
                      </button>
                  )}
                  <div className="h-px bg-slate-800 my-4"></div>
                  <button onClick={signOut} className="w-full text-left py-4 px-4 rounded-xl text-lg font-medium text-red-400 hover:bg-red-900/10">
                      Sign Out
                  </button>
              </nav>
          </div>
      )}

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col h-screen sticky top-0 border-r border-slate-800">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight text-white">LeadFlow</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            <span>Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('filters')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'filters' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
            <span>Target Audience</span>
          </button>
          <button onClick={() => setActiveTab('subscription')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'subscription' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <span>Plans & Billing</span>
          </button>
          
          <button onClick={signOut} className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-slate-800/50 rounded-lg transition-colors mt-auto group">
            <svg className="w-5 h-5 group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            <span className="group-hover:text-red-300 transition-colors">Sign Out</span>
          </button>
        </nav>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mt-16 md:mt-0">
        {!profile.sheet_url && (
           <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <span className="font-bold">Setup Incomplete:</span> Please click <strong>"Retry Connection"</strong> in the dashboard below.
                  </p>
                </div>
              </div>
           </div>
        )}

        {activeTab === "dashboard" && <Dashboard user={profile!} />}
        {activeTab === "filters" && <FilterSettings user={profile!} onUpdate={async (f, l) => updateFilters(f, l)} />}
        {activeTab === "subscription" && <Subscription user={profile!} onPaymentSuccess={handlePaymentSuccess} />}
        {activeTab === "admin" && isAdmin && <AdminDashboard user={profile!} />}
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
