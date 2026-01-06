/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - useAuth.tsx v6.0                              ║
 * ║  Locked Date: January 6, 2025                              ║
 * ║  Status: STABLE - CRITICAL AUTH & REFRESH LOGIC            ║
 * ║                                                            ║
 * ║  Features:                                                 ║
 * ║  - ✅ Raw Fetch implementation (No 406 Error)              ║
 * ║  - ✅ Cache-Busting Refresh (Fixed stale data)             ║
 * ║  - ✅ Auto-Refresh Timer                                   ║
 * ║  - ✅ Session Persistence                                  ║
 * ║                                                            ║
 * ║  ⚠️  DO NOT REMOVE TIMESTAMP FROM FETCH URL                ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode
} from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { User } from "../types";
import { ENV } from "../config/env";

const SHEET_CREATOR_URL = "https://script.google.com/macros/s/AKfycbzLDTaYagAacas6-Jy5nLSpLv8hVzCrlIC-dZ7l-zWso8suYeFzajrQLnyBA_X9gVs4/exec";

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (params: {
    email: string;
    password: string;
    name: string;
    role?: string;
    teamCode?: string;
    managerId?: string;
  }) => Promise<void>;
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const processingSignIn = useRef(false);

  const isAuthenticated = !!session && !!profile;

  // ✅ FIXED: Use raw fetch with timestamp to avoid caching (Race Condition Fix)
  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const response = await fetch(
        `${ENV.SUPABASE_URL}/rest/v1/users?id=eq.${userId}&t=${Date.now()}`, // Added timestamp to bust cache
        {
          method: 'GET',
          headers: {
            'apikey': ENV.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${ENV.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Prefer': 'return=representation',
            'Cache-Control': 'no-cache, no-store, must-revalidate' // Additional headers
          }
        }
      );

      if (!response.ok) {
        console.error('Fetch failed:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        console.warn('No user found');
        return null;
      }

      console.log('✅ Profile fetched:', data[0].name);
      return data[0] as User;
      
    } catch (err) {
      console.error('Fetch exception:', err);
      return null;
    }
  }, []);

  const createTempProfile = useCallback((user: SupabaseUser): User => ({
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || "User",
    role: user.user_metadata?.role || "member",
    sheet_url: "",
    payment_status: "inactive",
    valid_until: null,
    filters: {},
    daily_limit: 0,
    leads_today: 0,
    total_leads_received: 0,
    is_active: true,
    days_extended: 0,
    total_leads_promised: 50,
    created_at: new Date().toISOString(),
  }), []);

  const loadUserProfile = useCallback(async (user: SupabaseUser): Promise<void> => {
    if (!mountedRef.current) return;

    try {
      console.log('🔍 Loading profile for:', user.email);
      
      // Wait for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let userProfile = await fetchProfile(user.id);

      if (!mountedRef.current) return;

      // Retry once if not found
      if (!userProfile) {
        console.warn('Retrying profile fetch...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        userProfile = await fetchProfile(user.id);
      }

      if (mountedRef.current) {
        if (userProfile) {
          console.log('✅ Profile loaded:', userProfile.name);
          setProfile(userProfile);
        } else {
          console.warn('⚠️ Using temp profile');
          setProfile(createTempProfile(user));
        }
      }
    } catch (err) {
      console.error('Load error:', err);
      if (mountedRef.current) {
        setProfile(createTempProfile(user));
      }
    }
  }, [fetchProfile, createTempProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      console.log('🔄 Force refreshing profile...');
      const updated = await fetchProfile(session.user.id);
      if (updated && mountedRef.current) {
        setProfile(updated);
      }
    }
  }, [session, fetchProfile]);

  const createUserSheetBackground = useCallback(async (
    userId: string,
    email: string,
    name: string
  ): Promise<void> => {
    try {
      fetch(SHEET_CREATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'createSheet', userId, email, name })
      }).catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (currentSession?.user) {
          setSession(currentSession);
          await loadUserProfile(currentSession.user);
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_IN') {
        if (processingSignIn.current) return;
        
        processingSignIn.current = true;
        
        if (newSession?.user) {
          setSession(newSession);
          setLoading(true);
          await loadUserProfile(newSession.user);
          if (mountedRef.current) {
            setLoading(false);
          }
        }
        
        setTimeout(() => {
          processingSignIn.current = false;
        }, 2000);
      }

      if (event === 'SIGNED_OUT') {
        processingSignIn.current = false;
        setSession(null);
        setProfile(null);
        setLoading(false);
      }

      if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
      }
    });

    authSubscription = data.subscription;
    initializeAuth();

    return () => {
      mountedRef.current = false;
      processingSignIn.current = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [loadUserProfile]);

  useEffect(() => {
    if (!session?.user) return;

    const interval = setInterval(() => {
      if (mountedRef.current) {
        refreshProfile();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session, refreshProfile]);

  const signUp = useCallback(async ({
    email,
    password,
    name,
    role = 'member',
    teamCode,
    managerId
  }: {
    email: string;
    password: string;
    name: string;
    role?: string;
    teamCode?: string;
    managerId?: string;
  }) => {
    setLoading(true);

    try {
      let resolvedManagerId: string | null = managerId || null;
      let resolvedTeamCode: string | null = teamCode?.trim().toUpperCase() || null;

      // For Members - resolve manager
      if (role === 'member' && resolvedTeamCode && !resolvedManagerId) {
        const { data: managerData } = await supabase
          .from('users')
          .select('id, name')
          .eq('team_code', resolvedTeamCode)
          .eq('role', 'manager')
          .maybeSingle();

        if (!managerData) {
          setLoading(false);
          throw new Error("Invalid team code");
        }
        resolvedManagerId = managerData.id;
      }

      // For Managers - check code availability
      if (role === 'manager' && resolvedTeamCode) {
        const { data: existingCode } = await supabase
          .from('users')
          .select('id')
          .eq('team_code', resolvedTeamCode)
          .maybeSingle();

        if (existingCode) {
          setLoading(false);
          throw new Error("Team code already taken");
        }
        resolvedManagerId = null;
      }

      // Create Auth User
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            role,
            team_code: resolvedTeamCode,
            manager_id: resolvedManagerId
          }
        }
      });

      if (error) {
        setLoading(false);
        throw error;
      }

      if (!data.user) {
        setLoading(false);
        throw new Error("Signup failed");
      }

      // Create Sheet
      if (role === 'member') {
        createUserSheetBackground(data.user.id, email, name);
      }

      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, [createUserSheetBackground]);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        setLoading(false);
        throw error;
      }

    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    setProfile(null);
    setLoading(false);

    try {
      await supabase.auth.signOut();
    } catch {}
  }, []);

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
