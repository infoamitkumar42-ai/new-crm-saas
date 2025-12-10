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
  
  // ✅ MOBILE MENU STATE (Jo pehle gayab ho gaya tha)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [setupElapsed, setSetupElapsed] = useState(0);

  useEffect(() => {
    let timer: any;
    if (session && !profile) {
       timer = setInterval(() => {
         setSetupElapsed(prev => prev + 1);
         if (setupElapsed > 0 && setupElapsed % 3 === 0) {
             refreshProfile();
         }
       }, 1000);
    } else {
        setSetupElapsed(0);
    }
    return () => clearInterval(timer);
  }, [session, profile, refreshProfile, setupElapsed]);

  // Loading & Setup Screens...
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  if (!session) return <Landing showAuth={showAuth} onStart={() => setShowAuth(true)} />;
  if (session && !profile) return <div className="min-h-screen flex items-center justify-center">Setting up...</div>;

  const isAdmin = profile?.role === "admin";

  const updateFilters = async (filters: FilterConfig, dailyLimit?: number) => {
    if (!profile) return;
    try {
        const updates: any = { filters };
        if (dailyLimit !== undefined) updates.daily_limit = dailyLimit;
        const { error } = await supabase.from('users').update(updates).eq('id', profile.id);
        if (error) throw error;
        await refreshProfile(); 
    } catch (e) { alert('Failed to save settings.'); }
  };

  const handlePaymentSuccess = () => {
      alert('Payment processed! Account updating...');
      window.location.reload();
  };

  // Helper to close menu on click
  const handleTabChange = (tab: TabId) => {
      setActiveTab(tab);
      setMobileMenuOpen(false); // Menu band kar do click ke baad
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* --- MOBILE HEADER (FIXED) --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white z-50 px-4 py-3 flex justify-between items-center shadow-md">
         <span className="font-bold text-lg">LeadFlow</span>
         
         {/* Hamburger Button */}
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
            {mobileMenuOpen ? (
                // Close Icon (X)
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
                // Menu Icon (3 Lines)
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            )}
         </button>
      </div>

      {/* --- MOBILE MENU OVERLAY --- */}
      {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-900/95 pt-20 px-6">
              <nav className="space-y-4">
                  <button onClick={() => handleTabChange('dashboard')} className={`w-full text-left py-3 px-4 rounded-lg text-lg font-medium ${activeTab === 'dashboard' ? 'bg-brand-600 text-white' : 'text-slate-300'}`}>
                      Dashboard
                  </button>
                  <button onClick={() => handleTabChange('filters')} className={`w-full text-left py-3 px-4 rounded-lg text-lg font-medium ${activeTab === 'filters' ? 'bg-brand-600 text-white' : 'text-slate-300'}`}>
                      Target Audience
                  </button>
                  <button onClick={() => handleTabChange('subscription')} className={`w-full text-left py-3 px-4 rounded-lg text-lg font-medium ${activeTab === 'subscription' ? 'bg-brand-600 text-white' : 'text-slate-300'}`}>
                      Plans & Billing
                  </button>
                  {isAdmin && (
                      <button onClick={() => handleTabChange('admin')} className="w-full text-left py-3 px-4 rounded-lg text-lg font-medium text-slate-300">
                          Admin Panel
                      </button>
                  )}
                  <div className="h-px bg-slate-700 my-4"></div>
                  <button onClick={signOut} className="w-full text-left py-3 px-4 rounded-lg text-lg font-medium text-red-400">
                      Sign Out
                  </button>
              </nav>
          </div>
      )}

      {/* --- DESKTOP SIDEBAR (UNCHANGED) --- */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">LeadFlow</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <span>Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('filters')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'filters' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <span>Target Audience</span>
          </button>
          <button onClick={() => setActiveTab('subscription')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'subscription' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <span>Plans & Billing</span>
          </button>
          {isAdmin && (
             <button onClick={() => setActiveTab('admin')} className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg">
               <span>Admin Panel</span>
             </button>
          )}
          <button onClick={signOut} className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-lg transition-colors mt-auto">
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mt-16 md:mt-0">
        {/* Setup Warning */}
        {!profile.sheet_url && (
           <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <p className="text-sm text-red-700 font-bold">⚠️ Setup Incomplete. Click 'Retry Connection' below.</p>
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
