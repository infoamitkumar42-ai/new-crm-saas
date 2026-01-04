// src/auth/useAuth.tsx

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, logEvent } from "../supabaseClient";
import { User } from "../types";

// 🔗 Google Apps Script Web App URL - Sheet Creator
const SHEET_CREATOR_URL = "https://script.google.com/macros/s/AKfycbzLDTaYagAacas6-Jy5nLSpLv8hVzCrlIC-dZ7l-zWso8suYeFzajrQLnyBA_X9gVs4/exec";

// ============================================================
// 📦 AUTH CONTEXT TYPE
// ============================================================
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
    managerId?: string 
  }) => Promise<void>;
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================
// 🔐 AUTH PROVIDER COMPONENT
// ============================================================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Check if authenticated
  const isAuthenticated = !!session && !!profile;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 FETCH FULL PROFILE FROM DATABASE
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
        console.error("Profile fetch error:", error);
        return null;
      }

      if (data) {
        console.log("✅ Profile loaded:", data.email);
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
          created_at: data.created_at,
          updated_at: data.updated_at,
        } as User;
      }

      return null;
    } catch (err) {
      console.error("Profile fetch exception:", err);
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚡ CREATE TEMP PROFILE (INSTANT LOADING)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const createTempProfile = (user: SupabaseUser): User => ({
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
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 LOAD USER PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadUserProfile = useCallback(async (user: SupabaseUser) => {
    // Set temp profile immediately for fast UI
    const tempProfile = createTempProfile(user);
    setProfile(tempProfile);
    setLoading(false);

    // Fetch full profile in background
    const fullProfile = await fetchProfile(user.id);
    if (fullProfile) {
      setProfile(fullProfile);
    }
  }, [fetchProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 REFRESH PROFILE MANUALLY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const fullProfile = await fetchProfile(session.user.id);
      if (fullProfile) {
        setProfile(fullProfile);
      }
    }
  }, [session, fetchProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 CREATE GOOGLE SHEET FOR USER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const createUserSheet = async (userId: string, email: string, name: string): Promise<string | null> => {
    try {
      console.log("📊 Creating Google Sheet for:", email);
      
      // Try POST first
      const response = await fetch(SHEET_CREATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'createSheet',
          userId,
          email,
          name
        })
      });

      if (response.ok) {
        const text = await response.text();
        try {
          const result = JSON.parse(text);
          if (result.success && result.sheetUrl) {
            console.log("✅ Sheet created:", result.sheetUrl);
            return result.sheetUrl;
          }
        } catch {}
      }

      // Fallback to GET
      const getUrl = `${SHEET_CREATOR_URL}?action=createSheet&userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`;
      const getResponse = await fetch(getUrl);
      
      if (getResponse.ok) {
        const text = await getResponse.text();
        try {
          const result = JSON.parse(text);
          if (result.success && result.sheetUrl) {
            return result.sheetUrl;
          }
        } catch {}
      }

      return null;
    } catch (err) {
      console.warn("Sheet creation failed:", err);
      return null;
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 INITIALIZE AUTH ON MOUNT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("🔐 Initializing auth...");

        // Get current session from localStorage/storage
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn("Session error:", error.message);
          // Clear corrupted session
          await supabase.auth.signOut();
          if (mounted) {
            setSession(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        if (currentSession?.user && mounted) {
          console.log("✅ Session found:", currentSession.user.email);
          setSession(currentSession);
          await loadUserProfile(currentSession.user);
        } else {
          console.log("ℹ️ No active session");
          if (mounted) {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Safety timeout - never show loading forever
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("⚠️ Safety timeout triggered");
        setLoading(false);
      }
    }, 5000);

    initializeAuth();

    // ✅ Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log("🔔 Auth event:", event);

        switch (event) {
          case 'SIGNED_IN':
            if (newSession?.user) {
              setSession(newSession);
              await loadUserProfile(newSession.user);
              logEvent('user_signed_in', { email: newSession.user.email });
            }
            break;

          case 'SIGNED_OUT':
            setSession(null);
            setProfile(null);
            setLoading(false);
            // Clear local storage
            localStorage.removeItem('leadflow-auth-session');
            logEvent('user_signed_out', {});
            break;

          case 'TOKEN_REFRESHED':
            console.log("🔄 Token refreshed automatically");
            if (newSession) {
              setSession(newSession);
            }
            break;

          case 'USER_UPDATED':
            if (newSession?.user) {
              setSession(newSession);
              await refreshProfile();
            }
            break;

          case 'PASSWORD_RECOVERY':
            console.log("🔑 Password recovery mode");
            break;

          default:
            break;
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 AUTO REFRESH PROFILE EVERY 5 MINUTES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (!session?.user) return;

    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing profile...");
      refreshProfile();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [session, refreshProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 SIGN UP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signUp = async ({ 
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
    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim() }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error("Signup failed");

    // Create user in database
    const userData = {
      id: data.user.id,
      email: data.user.email?.toLowerCase(),
      name: name.trim(),
      role,
      team_code: role === 'manager' ? teamCode?.toUpperCase() : null,
      manager_id: managerId || null,
      payment_status: 'inactive',
      plan_name: 'none',
      daily_limit: 0,
      leads_today: 0,
      filters: { pan_india: true },
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: dbError } = await supabase.from('users').upsert(userData);
    if (dbError) {
      console.error("DB error:", dbError);
    }

    // Create Google Sheet for members (background task)
    if (role === 'member') {
      createUserSheet(data.user.id, email, name).then(sheetUrl => {
        if (sheetUrl) {
          supabase.from('users').update({ sheet_url: sheetUrl }).eq('id', data.user!.id);
        }
      }).catch(console.warn);
    }

    logEvent('user_signup', { email, role });
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔓 SIGN IN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signIn = async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) throw error;

    logEvent('user_login', { email });
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👋 SIGN OUT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signOut = async () => {
    console.log("👋 Signing out...");

    // Clear state first
    setSession(null);
    setProfile(null);

    // Clear localStorage
    localStorage.removeItem('leadflow-auth-session');

    // Sign out from Supabase
    await supabase.auth.signOut();

    setLoading(false);
    console.log("✅ Signed out");
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎁 PROVIDE CONTEXT
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🪝 USE AUTH HOOK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default useAuth;
