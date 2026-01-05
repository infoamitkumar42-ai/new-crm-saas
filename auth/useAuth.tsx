// src/auth/useAuth.tsx

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
    managerId?: string 
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔒 REFS TO PREVENT RACE CONDITIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const mountedRef = useRef(true);
  const initStartedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const loadingProfileRef = useRef(false);

  const isAuthenticated = !!session && !!profile;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 FETCH PROFILE FROM DATABASE
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

      console.log("⚠️ No profile found for user");
      return null;
    } catch (err) {
      console.error("❌ Profile fetch exception:", err);
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚡ CREATE TEMP PROFILE (for fallback only)
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
    created_at: new Date().toISOString(),
  }), []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 LOAD USER PROFILE (FIXED VERSION)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadUserProfile = useCallback(async (user: SupabaseUser): Promise<void> => {
    // Prevent duplicate loading for same user
    if (currentUserIdRef.current === user.id && loadingProfileRef.current) {
      console.log("⏭️ Already loading profile for this user, skipping");
      return;
    }

    currentUserIdRef.current = user.id;
    loadingProfileRef.current = true;

    console.log("🔄 Loading profile for:", user.email);
    
    try {
      // First try to fetch existing profile
      let fullProfile = await fetchProfile(user.id);
      
      if (!mountedRef.current) return;

      if (!fullProfile) {
        // User exists in auth but not in users table - create entry
        console.log("⚠️ Creating missing user entry...");
        
        const userData = {
          id: user.id,
          email: user.email?.toLowerCase(),
          name: user.user_metadata?.name || "User",
          role: "member",
          payment_status: "inactive",
          plan_name: "none",
          daily_limit: 0,
          leads_today: 0,
          filters: { pan_india: true },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase.from("users").upsert(userData);
        
        if (!mountedRef.current) return;
        
        if (!error) {
          fullProfile = await fetchProfile(user.id);
        }
        
        if (!mountedRef.current) return;
      }

      // Set profile (real or temp fallback)
      if (mountedRef.current) {
        if (fullProfile) {
          setProfile(fullProfile);
        } else {
          // Last resort: use temp profile
          console.log("⚠️ Using temp profile as fallback");
          setProfile(createTempProfile(user));
        }
        
        // ✅ KEY FIX: Only set loading false AFTER profile is set
        setLoading(false);
        console.log("✅ Profile loading complete");
      }
    } catch (err) {
      console.error("❌ loadUserProfile error:", err);
      if (mountedRef.current) {
        // Fallback to temp profile on error
        setProfile(createTempProfile(user));
        setLoading(false);
      }
    } finally {
      loadingProfileRef.current = false;
    }
  }, [fetchProfile, createTempProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 REFRESH PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const fullProfile = await fetchProfile(session.user.id);
      if (fullProfile && mountedRef.current) {
        setProfile(fullProfile);
      }
    }
  }, [session, fetchProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 CREATE GOOGLE SHEET (PRESERVED)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const createUserSheet = useCallback(async (
    userId: string, 
    email: string, 
    name: string
  ): Promise<string | null> => {
    try {
      console.log("📊 Creating sheet for:", email);
      
      // Try POST
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
        } catch {
          // Parse error, try GET fallback
        }
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
        } catch {
          // Parse error
        }
      }

      return null;
    } catch (err) {
      console.warn("Sheet creation failed:", err);
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 INITIALIZE AUTH (FIXED VERSION)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    // ✅ KEY FIX: Use ref to prevent double init in Strict Mode
    if (initStartedRef.current) {
      console.log("⏭️ Auth init already started, skipping duplicate");
      return;
    }
    initStartedRef.current = true;
    mountedRef.current = true;

    console.log("🔐 Auth Init starting...");

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error) {
          console.error("❌ Session error:", error.message);
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (currentSession?.user) {
          console.log("✅ Session found:", currentSession.user.email);
          setSession(currentSession);
          await loadUserProfile(currentSession.user);
        } else {
          console.log("ℹ️ No active session");
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Auth init error:", err);
        if (mountedRef.current) {
          setSession(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    // Safety timeout - ensures loading never stays stuck
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn("⚠️ Safety timeout triggered - forcing load complete");
        setLoading(false);
      }
    }, 5000); // 5 second max wait

    initializeAuth();

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mountedRef.current) return;

        console.log("🔔 Auth event:", event);

        switch (event) {
          case 'SIGNED_IN':
            if (newSession?.user) {
              // ✅ KEY FIX: Check if this is a different user
              if (currentUserIdRef.current !== newSession.user.id) {
                setSession(newSession);
                setLoading(true);
                await loadUserProfile(newSession.user);
              } else {
                // Same user, just update session
                setSession(newSession);
              }
            }
            break;

          case 'SIGNED_OUT':
            console.log("👋 User signed out via auth event");
            currentUserIdRef.current = null;
            setSession(null);
            setProfile(null);
            setLoading(false);
            localStorage.removeItem('leadflow-auth-session');
            break;

          case 'TOKEN_REFRESHED':
            if (newSession) {
              console.log("🔄 Token refreshed");
              setSession(newSession);
            }
            break;

          case 'USER_UPDATED':
            if (newSession?.user) {
              console.log("👤 User updated");
              setSession(newSession);
              // Refresh profile to get latest data
              const updatedProfile = await fetchProfile(newSession.user.id);
              if (updatedProfile && mountedRef.current) {
                setProfile(updatedProfile);
              }
            }
            break;

          default:
            // Handle INITIAL_SESSION if needed
            break;
        }
      }
    );

    // Cleanup function
    return () => {
      console.log("🧹 Auth cleanup");
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
      // ✅ Reset for Strict Mode remount
      initStartedRef.current = false;
    };
  }, []); // Empty deps - only run once

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⏰ AUTO REFRESH PROFILE EVERY 5 MINS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  // 📝 SIGN UP (PRESERVED)
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
    console.log("📝 Signing up:", email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: name.trim() } }
      });

      if (error) throw error;
      if (!data.user) throw new Error("Signup failed");

      // Create sheet for members
      let sheetUrl: string | null = null;
      if (role === 'member') {
        sheetUrl = await createUserSheet(data.user.id, email, name);
      }

      // Save to database
      const userData = {
        id: data.user.id,
        email: data.user.email?.toLowerCase(),
        name: name.trim(),
        role,
        team_code: role === 'manager' ? teamCode?.toUpperCase() : null,
        manager_id: managerId || null,
        sheet_url: sheetUrl,
        payment_status: 'inactive',
        plan_name: 'none',
        daily_limit: 0,
        leads_today: 0,
        filters: { pan_india: true },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await supabase.from('users').upsert(userData);
      
      console.log("✅ Signup complete");
      // Note: onAuthStateChange will handle the session
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, [createUserSheet]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔓 SIGN IN (PRESERVED)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signIn = useCallback(async ({ 
    email, 
    password 
  }: { 
    email: string; 
    password: string 
  }) => {
    console.log("🔓 Signing in:", email);
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
      
      console.log("✅ Sign in successful");
      // onAuthStateChange will handle the rest
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👋 SIGN OUT (PRESERVED)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signOut = useCallback(async () => {
    console.log("👋 Signing out...");
    
    // Clear state immediately
    currentUserIdRef.current = null;
    setSession(null);
    setProfile(null);
    localStorage.removeItem('leadflow-auth-session');
    
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    
    setLoading(false);
    console.log("✅ Signed out");
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎁 CONTEXT VALUE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const value: AuthContextValue = {
    session,
    profile,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
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
