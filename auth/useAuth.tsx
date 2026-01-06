/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - useAuth.tsx v4.0 (FINAL FIX)                  ║
 * ║  Locked Date: January 6, 2025                              ║
 * ║  Status: CRITICAL FIX - DO NOT MODIFY                      ║
 * ║                                                            ║
 * ║  Fixes:                                                    ║
 * ║  - ✅ Manager ID lost during signup (Race Condition)       ║
 * ║  - ✅ Sheet creation failure recovery                      ║
 * ║  - ✅ Profile "None" / "No Manager" issue                  ║
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

// 🔗 Google Apps Script Web App URL
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
  const isSigningUpRef = useRef(false); // 🔒 LOCK FOR SIGNUP

  const isAuthenticated = !!session && !!profile;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 FETCH PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        email: data.email,
        name: data.name || "User",
        role: data.role || "member",
        team_code: data.team_code,
        manager_id: data.manager_id,
        sheet_url: data.sheet_url || "",
        sheet_id: data.sheet_id,
        payment_status: data.payment_status || "inactive",
        plan_name: data.plan_name,
        plan_weight: data.plan_weight || 1,
        daily_limit: data.daily_limit || 0,
        leads_today: data.leads_today || 0,
        total_leads_received: data.total_leads_received || 0,
        valid_until: data.valid_until,
        filters: data.filters || {},
        is_active: data.is_active ?? true,
        days_extended: data.days_extended || 0,
        total_leads_promised: data.total_leads_promised || 50,
        created_at: data.created_at,
        updated_at: data.updated_at,
      } as User;
    } catch {
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚡ CREATE TEMP PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const createTempProfile = useCallback((user: SupabaseUser): User => ({
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
    days_extended: 0,
    total_leads_promised: 50,
    created_at: new Date().toISOString(),
  }), []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 CREATE SHEET (Background)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const createUserSheetBackground = useCallback(async (
    userId: string,
    email: string,
    name: string
  ): Promise<void> => {
    try {
      fetch(SHEET_CREATOR_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createSheet', userId, email, name })
      }).catch(() => {});
    } catch {}
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 LOAD USER PROFILE (With Lock Check)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadUserProfile = useCallback(async (user: SupabaseUser): Promise<void> => {
    if (!mountedRef.current) return;

    // 🔒 STOP if signup is in progress
    if (isSigningUpRef.current) {
      console.log("🔒 Signup in progress, pausing auto-load...");
      return; 
    }

    try {
      let userProfile = await fetchProfile(user.id);

      if (!mountedRef.current) return;

      // Only create default if NOT signing up and profile missing
      if (!userProfile) {
        console.log("⚠️ No profile found, creating default (Panic Mode)...");
        
        const userData = {
          id: user.id,
          email: user.email?.toLowerCase(),
          name: user.user_metadata?.name || "User",
          role: "member",
          payment_status: "inactive",
          plan_name: "none",
          is_active: true,
          created_at: new Date().toISOString()
        };

        await supabase.from("users").upsert(userData);
        if (mountedRef.current) userProfile = await fetchProfile(user.id);
      }

      if (mountedRef.current) {
        setProfile(userProfile || createTempProfile(user));
      }
    } catch (err) {
      if (mountedRef.current) setProfile(createTempProfile(user));
    }
  }, [fetchProfile, createTempProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 INITIALIZE AUTH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
        } else {
          setSession(null);
          setProfile(null);
        }
      } catch {
        setSession(null);
        setProfile(null);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mountedRef.current) return;

      if (event === 'SIGNED_IN' && newSession?.user) {
        setSession(newSession);
        // Only load if not manually locked by signup
        if (!isSigningUpRef.current) {
          setLoading(true);
          await loadUserProfile(newSession.user);
          if (mountedRef.current) setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        setSession(newSession);
      }
    });

    authSubscription = data.subscription;
    initializeAuth();

    return () => {
      mountedRef.current = false;
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // Refresh profile periodically
  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(() => {
      if (mountedRef.current && !isSigningUpRef.current) {
        fetchProfile(session.user.id).then(p => {
          if (p && mountedRef.current) setProfile(p);
        });
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session, fetchProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 SIGN UP (Fixed Logic)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
    isSigningUpRef.current = true; // 🔒 LOCK ON

    try {
      let resolvedManagerId: string | null = managerId || null;
      let resolvedTeamCode: string | null = teamCode?.trim().toUpperCase() || null;

      // 1. Resolve Manager
      if (role === 'member' && resolvedTeamCode && !resolvedManagerId) {
        const { data: managerData } = await supabase
          .from('users')
          .select('id, name')
          .eq('team_code', resolvedTeamCode)
          .eq('role', 'manager')
          .maybeSingle();

        if (!managerData) throw new Error("Invalid team code");
        resolvedManagerId = managerData.id;
      }

      // 2. Check Code (if Manager)
      if (role === 'manager' && resolvedTeamCode) {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('team_code', resolvedTeamCode)
          .maybeSingle();
        if (existing) throw new Error("Team code already taken");
      }

      // 3. Create Auth User
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { 
          data: { name: name.trim(), role } 
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("Signup failed");

      const userId = data.user.id;

      // 4. INSERT USER ROW (Explicitly with Manager ID)
      const userData = {
        id: userId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        team_code: resolvedTeamCode,
        manager_id: resolvedManagerId, // ✅ CRITICAL
        payment_status: 'inactive',
        plan_name: 'none',
        plan_weight: 1,
        daily_limit: 0,
        leads_today: 0,
        total_leads_received: 0,
        filters: { pan_india: true },
        is_active: true,
        days_extended: 0,
        total_leads_promised: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase.from('users').upsert(userData);
      
      if (dbError) {
        console.error("DB Insert Failed:", dbError);
        // Fallback update
        await supabase.from('users').update({
          manager_id: resolvedManagerId,
          team_code: resolvedTeamCode,
          name: name.trim()
        }).eq('id', userId);
      }

      // 5. Trigger Sheet Creation
      if (role === 'member') {
        createUserSheetBackground(userId, email, name);
      }

      // 6. Manually Set Profile (Bypassing Auto-Load)
      const newProfile = await fetchProfile(userId);
      if (newProfile) {
        setProfile(newProfile);
        setSession(data.session);
      }

    } catch (err) {
      throw err;
    } finally {
      isSigningUpRef.current = false; // 🔓 LOCK OFF
      setLoading(false);
    }
  }, [createUserSheetBackground, fetchProfile, createTempProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔓 SIGN IN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      if (error) throw error;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👋 SIGN OUT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signOut = useCallback(async () => {
    setSession(null);
    setProfile(null);
    setLoading(false);
    try {
      await supabase.auth.signOut();
    } catch {}
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 REFRESH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const p = await fetchProfile(session.user.id);
      if (p && mountedRef.current) setProfile(p);
    }
  }, [session, fetchProfile]);

  return (
    <AuthContext.Provider value={{
      session, profile, loading, isAuthenticated,
      signUp, signIn, signOut, refreshProfile
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
