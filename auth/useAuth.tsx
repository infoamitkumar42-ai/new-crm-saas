import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, logEvent } from "../supabaseClient";
import { User } from "../types";

// 🔗 Google Apps Script Web App URL
const SHEET_CREATOR_URL = "https://script.google.com/macros/s/AKfycbzLDTaYagAacas6-Jy5nLSpLv8hVzCrlIC-dZ7l-zWso8suYeFzajrQLnyBA_X9gVs4/exec";

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (params: any) => Promise<void>;
  signIn: (params: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!session && !!profile;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 HELPER: FETCH PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fetchProfileData = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as User;
    } catch (err) {
      console.error("Profile fetch error:", err);
      return null;
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 MAIN LOAD LOGIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadSessionAndProfile = useCallback(async () => {
    try {
      // 1. Get Session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(currentSession);

      // 2. Optimistic Profile (Fast Load)
      const user = currentSession.user;
      const tempProfile: User = {
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.name || "User",
        role: "member", // Default
        sheet_url: "",
        payment_status: "inactive",
        valid_until: null,
        filters: {},
        daily_limit: 0,
        leads_today: 0,
        total_leads_received: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      // Set temp data immediately so UI shows up
      setProfile(tempProfile); 
      
      // 3. Fetch Real Profile
      const realProfile = await fetchProfileData(user.id);
      
      if (realProfile) {
        setProfile(realProfile);
      } else {
        // If missing in DB, insert temp profile
        const userData = { ...tempProfile, updated_at: new Date().toISOString() };
        await supabase.from("users").upsert(userData);
      }

    } catch (err) {
      console.error("Auth Load Error:", err);
    } finally {
      // ✅ GUARANTEE: Loading always becomes false
      setLoading(false);
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 EFFECT: INITIALIZE ONCE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    let mounted = true;

    // Run load logic
    loadSessionAndProfile();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        console.log(`🔔 Auth Event: ${event}`);

        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession);
          // Re-fetch profile on sign in
          const p = await fetchProfileData(newSession.user.id);
          if (p) setProfile(p);
        } 
        else if (event === 'SIGNED_OUT') {
          setSession(null);
          setProfile(null);
          setLoading(false);
          localStorage.removeItem('leadflow-auth-session');
        }
        else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadSessionAndProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 ACTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const refreshProfile = async () => {
    if (session?.user) {
      const p = await fetchProfileData(session.user.id);
      if (p) setProfile(p);
    }
  };

  const signUp = async (params: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: { data: { name: params.name } }
    });
    if (error) throw error;

    if (params.role === 'member' && data.user) {
      // Fire and forget sheet creation
      fetch(SHEET_CREATOR_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'createSheet',
          userId: data.user.id,
          email: params.email,
          name: params.name
        })
      }).catch(console.warn);
    }
  };

  const signIn = async (params: any) => {
    const { error } = await supabase.auth.signInWithPassword(params);
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      isAuthenticated,
      signUp,
      signIn,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default useAuth;
