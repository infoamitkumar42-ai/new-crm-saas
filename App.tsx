
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
  
  // State for handling stuck setup
  const [setupElapsed, setSetupElapsed] = useState(0);
  const [isManualSetup, setIsManualSetup] = useState(false);

  // Timer to track setup duration and poll profile
  useEffect(() => {
    let timer: any;
    if (session && !profile) {
       timer = setInterval(() => {
         setSetupElapsed(prev => prev + 1);
         // Poll profile every 3 seconds in case the backend finished silently
         if (setupElapsed > 0 && setupElapsed % 3 === 0) {
             refreshProfile();
         }
       }, 1000);
    } else {
        setSetupElapsed(0);
    }
    return () => clearInterval(timer);
  }, [session, profile, refreshProfile, setupElapsed]);

  const handleManualSetup = async () => {
    setIsManualSetup(true);
    try {
        if (!session?.user) return;
        
        console.log("Retrying setup manually...");

        // 1. Retry Creating Sheet
        // We pass the existing user details
        const createSheetResp = await fetch("/api/create-sheet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                email: session.user.email, 
                name: session.user.user_metadata?.name || "User" 
            }),
        });
        const sheetData = await createSheetResp.json();
        
        if (!sheetData.sheetUrl) {
             throw new Error("Could not generate Google Sheet. Service might be busy.");
        }

        // 2. Retry Init User
        const initResp = await fetch("/api/init-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: session.user.email,
                name: session.user.user_metadata?.name || "User",
                sheetUrl: sheetData.sheetUrl,
                id: session.user.id
            }),
        });
        
        if (!initResp.ok) {
            throw new Error("Failed to save profile.");
        }

        // 3. Final Refresh
        await refreshProfile();
        
    } catch (e: any) {
        console.error("Manual Setup Error:", e);
        alert(`Setup failed: ${e.message || "Unknown error"}. Please try signing out and back in.`);
    } finally {
        setIsManualSetup(false);
    }
  };

  // 1. Global Loading (Initial Session Check)
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
              {isManualSetup ? (
                 <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-4"></div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Finalizing Setup</h2>
                    <p className="text-slate-600 text-sm">Retrying connection to Google Sheets...</p>
                 </>
              ) : (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-4"></div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Setting up your dashboard</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        We are generating your Google Sheet and finalizing your account. This usually takes 5-10 seconds.
                    </p>
                    
                    {setupElapsed > 10 && (
                        <div className="w-full space-y-4 animate-in fade-in duration-500">
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-left">
                                <p className="text-amber-800 text-xs font-medium mb-1">Taking longer than expected?</p>
                                <p className="text-amber-700 text-xs">
                                    Google Apps Script can sometimes be slow to respond. If it's stuck, try retrying below.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button 
                                    onClick={handleManualSetup}
                                    className="w-full py-2 px-4 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                                >
                                    Retry Setup Manually
                                </button>
                                <button 
                                    onClick={signOut}
                                    className="text-slate-400 text-xs hover:text-slate-600 underline"
                                >
                                    Cancel & Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                  </>
              )}
          </div>
        </div>
      );
  }
  
  // 4. Critical Error State: Profile exists but Sheet URL is missing
  if (session && profile && !profile.sheet_url) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
           <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-md text-center">
              <div className="text-red-500 text-xl font-bold mb-2">Setup Error</div>
              <p className="text-slate-600 mb-6">
                Your account was created, but we couldn't generate your personal Google Sheet.
              </p>
              <button 
                onClick={signOut}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Sign Out & Try Again
              </button>
           </div>
        </div>
     );
  }

  // 5. Logged In & Profile Loaded -> Main App
  const isAdmin = profile?.role === "admin";

  const updateFilters = async (filters: FilterConfig, dailyLimit: number) => {
    if (!profile) return;
    try {
        const { error } = await supabase
            .from('users')
            .update({ filters, daily_limit: dailyLimit })
            .eq('id', profile.id);
            
        if (error) throw error;
        alert('Settings saved successfully!');
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
      {activeTab === "dashboard" && <Dashboard user={profile!} />}
      {activeTab === "filters" && <FilterSettings user={profile!} onUpdate={updateFilters} />}
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
