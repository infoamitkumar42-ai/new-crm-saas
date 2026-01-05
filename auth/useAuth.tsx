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

  const mountedRef = useRef(true);
  const initCompletedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const processingRef = useRef(false);

  const isAuthenticated = !!session && !!profile;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 FETCH PROFILE FROM DATABASE
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
    created_at: new Date().toISOString(),
  }), []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 LOAD USER PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadUserProfile = useCallback(async (user: SupabaseUser): Promise<boolean> => {
    if (currentUserIdRef.current === user.id && processingRef.current) {
      return false;
    }

    processingRef.current = true;
    currentUserIdRef.current = user.id;

    try {
      let fullProfile = await fetchProfile(user.id);
      
      if (!mountedRef.current) {
        processingRef.current = false;
        return false;
      }

      if (!fullProfile) {
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await supabase.from("users").upsert(userData);
        
        if (mountedRef.current) {
          fullProfile = await fetchProfile(user.id);
        }
      }

      if (mountedRef.current) {
        setProfile(fullProfile || createTempProfile(user));
        processingRef.current = false;
        return true;
      }
      
      processingRef.current = false;
      return false;
    } catch {
      if (mountedRef.current) {
        setProfile(createTempProfile(user));
      }
      processingRef.current = false;
      return true;
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
  // 📊 CREATE GOOGLE SHEET
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const createUserSheet = useCallback(async (
    userId: string, 
    email: string, 
    name: string
  ): Promise<string | null> => {
    try {
      const response = await fetch(SHEET_CREATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'createSheet', userId, email, name })
      });

      if (response.ok) {
        const text = await response.text();
        try {
          const result = JSON.parse(text);
          if (result.success && result.sheetUrl) {
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
    } catch {
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 INITIALIZE AUTH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    mountedRef.current = true;

    let authSubscription: { unsubscribe: () => void } | null = null;
    let safetyTimer: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      if (initCompletedRef.current) return;

      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error || !currentSession?.user) {
          setSession(null);
          setProfile(null);
          setLoading(false);
          initCompletedRef.current = true;
          return;
        }

        setSession(currentSession);
        await loadUserProfile(currentSession.user);
        
        if (mountedRef.current) {
          setLoading(false);
          initCompletedRef.current = true;
        }
      } catch {
        if (mountedRef.current) {
          setSession(null);
          setProfile(null);
          setLoading(false);
          initCompletedRef.current = true;
        }
      }
    };

    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mountedRef.current) return;
      if (!initCompletedRef.current && event === 'INITIAL_SESSION') return;

      switch (event) {
        case 'SIGNED_IN':
          if (newSession?.user) {
            const isDifferentUser = currentUserIdRef.current !== newSession.user.id;
            if (isDifferentUser || !initCompletedRef.current) {
              setSession(newSession);
              setLoading(true);
              await loadUserProfile(newSession.user);
              if (mountedRef.current) setLoading(false);
            } else {
              setSession(newSession);
            }
          }
          break;

        case 'SIGNED_OUT':
          currentUserIdRef.current = null;
          processingRef.current = false;
          setSession(null);
          setProfile(null);
          setLoading(false);
          localStorage.removeItem('leadflow-auth-session');
          break;

        case 'TOKEN_REFRESHED':
          if (newSession) setSession(newSession);
          break;

        case 'USER_UPDATED':
          if (newSession?.user) {
            setSession(newSession);
            const updatedProfile = await fetchProfile(newSession.user.id);
            if (updatedProfile && mountedRef.current) setProfile(updatedProfile);
          }
          break;
      }
    });

    authSubscription = data.subscription;

    safetyTimer = setTimeout(() => {
      if (mountedRef.current && loading && !initCompletedRef.current) {
        setLoading(false);
        initCompletedRef.current = true;
      }
    }, 8000);

    initializeAuth();

    return () => {
      mountedRef.current = false;
      if (safetyTimer) clearTimeout(safetyTimer);
      if (authSubscription) authSubscription.unsubscribe();
      initCompletedRef.current = false;
      processingRef.current = false;
    };
  }, []);

  // Auto refresh every 5 mins
  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(() => {
      if (mountedRef.current) refreshProfile();
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
      // Prepare values
      let resolvedManagerId: string | null = managerId || null;
      let resolvedTeamCode: string | null = teamCode?.trim().toUpperCase() || null;

      // For Members - resolve manager if not passed
      if (role === 'member' && resolvedTeamCode && !resolvedManagerId) {
        const { data: managerData } = await supabase
          .from('users')
          .select('id, name')
          .eq('team_code', resolvedTeamCode)
          .eq('role', 'manager')
          .maybeSingle();

        if (!managerData) {
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

      if (error) throw error;
      if (!data.user) throw new Error("Signup failed");

      const userId = data.user.id;

      // Wait for auth to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create Sheet (Members only)
      let sheetUrl: string | null = null;
      if (role === 'member') {
        sheetUrl = await createUserSheet(userId, email, name);
      }

      // Save to Database
      const userData = {
        id: userId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        team_code: resolvedTeamCode,
        manager_id: resolvedManagerId,
        sheet_url: sheetUrl,
        payment_status: 'inactive',
        plan_name: 'none',
        plan_weight: 1,
        daily_limit: 0,
        leads_today: 0,
        total_leads_received: 0,
        filters: { pan_india: true },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase.from('users').upsert(userData);

      if (dbError) {
        // Try update instead
        await supabase
          .from('users')
          .update({
            name: name.trim(),
            role,
            team_code: resolvedTeamCode,
            manager_id: resolvedManagerId,
            sheet_url: sheetUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }

      // Verify manager_id was saved (for members)
      if (role === 'member' && resolvedManagerId) {
        const { data: verifyData } = await supabase
          .from('users')
          .select('manager_id')
          .eq('id', userId)
          .single();

        if (!verifyData?.manager_id) {
          await supabase
            .from('users')
            .update({ manager_id: resolvedManagerId, team_code: resolvedTeamCode })
            .eq('id', userId);
        }
      }
      
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, [createUserSheet]);

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
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👋 SIGN OUT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signOut = useCallback(async () => {
    currentUserIdRef.current = null;
    processingRef.current = false;
    setSession(null);
    setProfile(null);
    localStorage.removeItem('leadflow-auth-session');
    
    try {
      await supabase.auth.signOut();
    } catch {}
    
    setLoading(false);
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
