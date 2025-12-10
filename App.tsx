import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./auth/useAuth";
import { Landing } from "./views/Landing";
import { Layout as MainLayout } from "./components/Layout";
import { Dashboard } from "./views/Dashboard";
import { FilterSettings } from "./views/FilterSettings";
import { Subscription } from "./views/Subscription";
import { Settings } from "./views/Settings"; // ✅ Naya Import
import { AdminDashboard } from "./views/AdminDashboard";
import { FilterConfig } from "./types";
import { supabase } from "./supabaseClient";

// ✅ 'settings' ko TabId mein add kiya
type TabId = "dashboard" | "filters" | "subscription" | "admin" | "settings";

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
        // Prepare update object
        const updates: any = { filters };
        if (dailyLimit !== undefined) updates.daily_limit = dailyLimit;

        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', profile.id);
            
        if (error) throw error;
        await refreshProfile(); // UI Update karo
        // alert('Settings saved successfully!'); // Alert settings page khud handle karega
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
    <MainLayout
      user={profile!}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as TabId)}
      onLogout={signOut}
      showAdminTab={isAdmin}
    >
      {/* --- WARNING BANNER --- */}
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

      {/* --- TABS LOGIC --- */}
      {activeTab === "dashboard" && <Dashboard user={profile!} />}
      
      {activeTab === "filters" && (
          <FilterSettings 
            user={profile!} 
            onUpdate={async (f, l) => updateFilters(f, l)} 
          />
      )}
      
      {/* ✅ NEW: Settings Tab Link */}
      {activeTab === "settings" && (
          <Settings 
            user={profile!} 
            onUpdate={async (f) => updateFilters(f)} 
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
    </MainLayout>
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
