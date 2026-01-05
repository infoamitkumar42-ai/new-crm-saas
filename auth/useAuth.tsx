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
  
  // ✅ Ref to prevent double execution
  const initRef = useRef(false);

  const isAuthenticated = !!session && !!profile;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 FETCH PROFILE (Optimized)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as User;
    } catch (err) {
      console.warn("Profile fetch issue:", err);
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 LOAD USER (Core Logic)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadUser = useCallback(async (user: SupabaseUser) => {
    console.log("🔄 Loading user:", user.email);

    // 1. Create temporary profile for instant UI
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

    // 2. Set state IMMEDIATELY to unblock UI
    setProfile(tempProfile);
    setLoading(false); // 🔴 Key Fix: Stop loading instantly

    // 3. Fetch real data in background
    const dbProfile = await fetchProfile(user.id);
    
    if (dbProfile) {
      setProfile(dbProfile); // Update with real data
    } else {
      // If no profile exists, create it silently
      const userData = { ...tempProfile, updated_at: new Date().toISOString() };
      await supabase.from("users").upsert(userData);
    }
  }, [fetchProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔐 INITIALIZATION EFFECT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let mounted = true;

    const init = async () => {
      console.log("🔐 Auth Init...");
      
      try {
        // 1. Get Session
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession?.user && mounted) {
          console.log("✅ Session Found");
          setSession(currentSession);
          await loadUser(currentSession.user);
        } else {
          console.log("ℹ️ No Session");
          if (mounted) setLoading(false);
        }
      } catch (err) {
        console.error("Auth Error:", err);
        if (mounted) setLoading(false);
      }
    };

    init();

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        
        console.log(`🔔 Event: ${event}`);

        if (event === 'SIGNED_IN' && newSession?.user) {
          setSession(newSession);
          await loadUser(newSession.user);
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
  }, []); // Run ONCE

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🛡️ SAFETY TIMEOUT (Last Resort)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ Safety Timeout: Force stopping loading");
        setLoading(false);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎮 ACTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      const p = await fetchProfile(session.user.id);
      if (p) setProfile(p);
    }
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
