// src/auth/useAuth.tsx

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from "react";
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
  
  // ✅ Ref to track initialization status to prevent double-firing
  const isInitializing = useRef(false);

  const isAuthenticated = !!session && !!profile;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 FETCH PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      console.log("📥 Fetching profile for:", userId);
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Profile fetch error:", error);
        return null;
      }

      if (data) {
        console.log("✅ Profile loaded:", data.email);
        return data as User;
      }

      return null;
    } catch (err) {
      console.error("❌ Profile fetch exception:", err);
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 LOAD USER PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadUserProfile = useCallback(async (user: SupabaseUser) => {
    // 1. Set minimal profile immediately to stop loading spinner
    const tempProfile: User = {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || "User",
      role: "member",
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

    // ✅ Set state immediately
    setProfile(tempProfile);
    setLoading(false); // Stop loading here!

    // 2. Then fetch full profile in background
    const fullProfile = await fetchProfile(user.id);
    
    if (fullProfile) {
      setProfile(fullProfile); // Update with real data
    } else {
      // Create missing user entry if needed
      const userData = { ...tempProfile, updated_at: new Date().toISOString() };
      await supabase.from("users").upsert(userData);
    }
  }, [fetchProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 INITIALIZE AUTH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    let mounted = true;

    const initializeAuth = async () => {
      console.log("🔐 Initializing auth...");
      
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (currentSession?.user && mounted) {
          console.log("✅ Session found:", currentSession.user.email);
          setSession(currentSession);
          await loadUserProfile(currentSession.user);
        } else {
          console.log("ℹ️ No active session");
          if (mounted) {
            setSession(null);
            setProfile(null);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("❌ Auth init error:", err);
        if (mounted) {
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    // Force stop loading after 2 seconds (Safety Net)
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("⚠️ Safety timeout - forcing load complete");
        setLoading(false);
      }
    }, 2000);

    initializeAuth();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log("🔔 Auth event:", event);

        if (event === 'SIGNED_IN' && newSession?.user) {
          setSession(newSession);
          await loadUserProfile(newSession.user);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setProfile(null);
          setLoading(false);
          localStorage.removeItem('leadflow-auth-session');
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array is correct here

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 REFRESH PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const fullProfile = await fetchProfile(session.user.id);
      if (fullProfile) {
        setProfile(fullProfile);
      }
    }
  }, [session, fetchProfile]);

  // Actions
  const signUp = async (params: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: { data: { name: params.name } }
    });
    if (error) throw error;
    
    // Create sheet in background
    if (params.role === 'member' && data.user) {
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
    setLoading(true);
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
