/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - useAuth.tsx v3.1                              ║
 * ║  Locked Date: January 6, 2025                              ║
 * ║  Status: STABLE - DO NOT MODIFY                            ║
 * ║                                                            ║
 * ║  Features:                                                 ║
 * ║  - ✅ Persistent session (survives refresh/close)          ║
 * ║  - ✅ No login blocking (sheet creation separate)          ║
 * ║  - ✅ Fast profile fetch                                   ║
 * ║  - ✅ Proper error handling                                ║
 * ║                                                            ║
 * ║  ⚠️  TO UNLOCK: Say "UNLOCK useAuth for [reason]"          ║
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

// 🔗 Google Apps Script Web App URL (for background sheet creation)
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
  const initDoneRef = useRef(false);

  const isAuthenticated = !!session && !!profile;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 FETCH PROFILE (Fast & Simple)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Profile fetch error:", error.message);
        return null;
      }

      if (!data) {
        console.log("⚠️ No profile found for:", userId);
        return null;
      }

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
    } catch (err) {
      console.error("❌ fetchProfile exception:", err);
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚡ CREATE TEMP PROFILE (Fallback)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 LOAD USER PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadUserProfile = useCallback(async (user: SupabaseUser): Promise<void> => {
    if (!mountedRef.current) return;

    try {
      let userProfile = await fetchProfile(user.id);

      if (!mountedRef.current) return;

      // If no profile exists, create one
      if (!userProfile) {
        const userData = {
          id: user.id,
          email: user.email?.toLowerCase(),
          name: user.user_metadata?.name || "User",
          role: user.user_metadata?.role || "member",
          team_code: user.user_metadata?.team_code || null,
          manager_id: user.user_metadata?.manager_id || null,
          payment_status: "inactive",
          plan_name: "none",
          daily_limit: 0,
          leads_today: 0,
          filters: { pan_india: true },
          is_active: true,
          days_extended: 0,
          total_leads_promised: 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await supabase.from("users").upsert(userData);

        if (mountedRef.current) {
          userProfile = await fetchProfile(user.id);
        }
      }

      if (mountedRef.current) {
        setProfile(userProfile || createTempProfile(user));
      }
    } catch (err) {
      console.error("❌ loadUserProfile error:", err);
      if (mountedRef.current) {
        setProfile(createTempProfile(user));
      }
    }
  }, [fetchProfile, createTempProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 REFRESH PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const updated = await fetchProfile(session.user.id);
      if (updated && mountedRef.current) {
        setProfile(updated);
      }
    }
  }, [session, fetchProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 CREATE SHEET (Background - Non-blocking)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const createUserSheetBackground = useCallback(async (
    userId: string,
    email: string,
    name: string
  ): Promise<void> => {
    try {
      // Fire and forget - don't wait for response
      fetch(SHEET_CREATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'createSheet', userId, email, name })
      }).catch(() => {
        // Silent fail - sheet creation will be retried by hourly trigger
      });
    } catch {
      // Silent fail
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 INITIALIZE AUTH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    mountedRef.current = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      if (initDoneRef.current) return;
      initDoneRef.current = true;

      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error || !currentSession?.user) {
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setSession(currentSession);
        await loadUserProfile(currentSession.user);

      } catch (err) {
        console.error("❌ Init error:", err);
        setSession(null);
        setProfile(null);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mountedRef.current) return;

      switch (event) {
        case 'SIGNED_IN':
          if (newSession?.user) {
            setSession(newSession);
            setLoading(true);
            await loadUserProfile(newSession.user);
            if (mountedRef.current) {
              setLoading(false);
            }
          }
          break;

        case 'SIGNED_OUT':
          setSession(null);
          setProfile(null);
          setLoading(false);
          break;

        case 'TOKEN_REFRESHED':
          if (newSession) {
            setSession(newSession);
          }
          break;

        case 'USER_UPDATED':
          if (newSession?.user) {
            setSession(newSession);
            const updated = await fetchProfile(newSession.user.id);
            if (updated && mountedRef.current) {
              setProfile(updated);
            }
          }
          break;
      }
    });

    authSubscription = data.subscription;
    initializeAuth();

    return () => {
      mountedRef.current = false;
      initDoneRef.current = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [loadUserProfile, fetchProfile]);

  // Auto refresh profile every 5 mins
  useEffect(() => {
    if (!session?.user) return;

    const interval = setInterval(() => {
      if (mountedRef.current) {
        refreshProfile();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session, refreshProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 SIGN UP
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

      const userId = data.user.id;

      // Save to Database
      const userData = {
        id: userId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        team_code: resolvedTeamCode,
        manager_id: resolvedManagerId,
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

      await supabase.from('users').upsert(userData);

      // Create Sheet in Background (non-blocking)
      if (role === 'member') {
        createUserSheetBackground(userId, email, name);
      }

      // Loading will be set to false by onAuthStateChange

    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, [createUserSheetBackground]);

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

      if (error) {
        setLoading(false);
        throw error;
      }

      // Loading will be set to false by onAuthStateChange SIGNED_IN event

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
    } catch {
      // Silent fail
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎁 CONTEXT VALUE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
