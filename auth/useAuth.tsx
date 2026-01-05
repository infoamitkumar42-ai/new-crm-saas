import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, logEvent } from "../supabaseClient";
import { User } from "../types";

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

  const fetchProfileData = async (userId: string): Promise<User | null> => {
    try {
      const { data } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
      return data as User;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // 1. Get Session
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession?.user) {
          if (mounted) setSession(currentSession);

          // 2. Set Temp Profile (Instant Load)
          const tempProfile: User = {
            id: currentSession.user.id,
            email: currentSession.user.email || "",
            name: currentSession.user.user_metadata?.name || "User",
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

          if (mounted) setProfile(tempProfile);

          // 3. Stop Loading IMMEDIATELY
          if (mounted) setLoading(false);

          // 4. Fetch Real Data in Background
          const realProfile = await fetchProfileData(currentSession.user.id);
          if (realProfile && mounted) {
            setProfile(realProfile);
          } else {
            // Create user if missing
            await supabase.from("users").upsert({ ...tempProfile, updated_at: new Date().toISOString() });
          }

        } else {
          // No Session
          if (mounted) {
            setSession(null);
            setProfile(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Auth Init Error:", error);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession);
        // Refresh profile quietly
        const p = await fetchProfileData(newSession.user.id);
        if (p) setProfile(p);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setLoading(false);
        localStorage.removeItem('leadflow-auth-session');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (params: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: { data: { name: params.name } }
    });
    if (error) throw error;
    
    if (params.role === 'member' && data.user) {
      fetch(SHEET_CREATOR_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'createSheet', userId: data.user.id, email: params.email, name: params.name })
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

  const refreshProfile = async () => {
    if (session?.user) {
      const p = await fetchProfileData(session.user.id);
      if (p) setProfile(p);
    }
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, isAuthenticated, signUp, signIn, signOut, refreshProfile }}>
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
