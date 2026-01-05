import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from "react";
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
  
  // Prevent double firing in Strict Mode
  const initialized = useRef(false);

  const isAuthenticated = !!session && !!profile;

  // 1. Helper to fetch DB Profile
  const fetchProfileFromDB = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as User;
    } catch (err) {
      console.error("Profile Fetch Error:", err);
      return null;
    }
  };

  // 2. Main Setup Function
  const setupUser = async (currentSession: Session) => {
    try {
      const user = currentSession.user;
      setSession(currentSession);

      // Create a basic profile immediately so UI doesn't break
      const fallbackProfile: User = {
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

      // Try to get real profile
      const dbProfile = await fetchProfileFromDB(user.id);

      if (dbProfile) {
        setProfile(dbProfile);
      } else {
        // If not in DB, set fallback and create in DB background
        setProfile(fallbackProfile);
        await supabase.from("users").upsert({ 
          ...fallbackProfile, 
          updated_at: new Date().toISOString() 
        });
      }
    } catch (error) {
      console.error("Setup User Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      console.log("🔐 Starting Auth Check...");
      
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession) {
          console.log("✅ Session Found");
          await setupUser(initialSession);
        } else {
          console.log("ℹ️ No Session");
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth Init Failed:", err);
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`🔔 Auth Event: ${event}`);
      
      if (event === 'SIGNED_IN' && newSession) {
        // Only run setup if we don't have a profile yet to avoid loops
        setSession(newSession);
        await setupUser(newSession);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setLoading(false);
        localStorage.removeItem('leadflow-auth-session');
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Actions
  const signUp = async (params: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: { data: { name: params.name } }
    });
    if (error) throw error;
    
    // Background Sheet Creation
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
      const p = await fetchProfileFromDB(session.user.id);
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
