/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - useAuth.tsx v3.0                              ║
 * ║  Last Updated: January 5, 2025                             ║
 * ║  Features:                                                 ║
 * ║  - ✅ Persistent session (survives refresh/close)          ║
 * ║  - ✅ No "Checking session..." stuck                       ║
 * ║  - ✅ Fast session hydration                               ║
 * ║  - ✅ Auto token refresh                                   ║
 * ║  - ✅ Error recovery                                       ║
 * ║                                                            ║
 * ║  ⚠️  DO NOT MODIFY WITHOUT TESTING                         ║
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
  const [initialized, setInitialized] = useState(false);

  const mountedRef = useRef(true);
  const currentUserIdRef = useRef<string | null>(null);

  const isAuthenticated = !!session && !!profile;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 FETCH PROFILE FROM DATABASE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    try {
      console.log('📥 Fetching profile for:', userId);
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Profile fetch error:', error.message);
        return null;
      }
      
      if (!data) {
        console.log('⚠️ No profile found for:', userId);
        return null;
      }

      console.log('✅ Profile loaded:', data.email);

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
    } catch (err) {
      console.error('❌ fetchProfile exception:', err);
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
    created_at: new Date().toISOString(),
  }), []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 LOAD USER PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const loadUserProfile = useCallback(async (user: SupabaseUser): Promise<void> => {
    if (!mountedRef.current) return;

    console.log('🔄 Loading profile for:', user.email);
    currentUserIdRef.current = user.id;

    try {
      let fullProfile = await fetchProfile(user.id);
      
      if (!mountedRef.current) return;

      // If no profile exists, create one
      if (!fullProfile) {
        console.log('📝 Creating new profile...');
        
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
        
        const { error } = await supabase.from("users").upsert(userData);
        
        if (error) {
          console.error('❌ Profile creation error:', error.message);
        }
        
        if (mountedRef.current) {
          fullProfile = await fetchProfile(user.id);
        }
      }

      if (mountedRef.current) {
        setProfile(fullProfile || createTempProfile(user));
      }
    } catch (err) {
      console.error('❌ loadUserProfile error:', err);
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
      console.log('📊 Creating sheet for:', email);
      
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
            console.log('✅ Sheet created:', result.sheetUrl);
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

      console.log('⚠️ Sheet creation failed');
      return null;
    } catch (err) {
      console.error('❌ Sheet creation error:', err);
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 INITIALIZE AUTH (FIXED - No Race Condition)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    mountedRef.current = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      console.log('🚀 Initializing auth...');

      try {
        // ✅ Step 1: Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (error) {
          console.error('❌ getSession error:', error.message);
          setSession(null);
          setProfile(null);
          setLoading(false);
          setInitialized(true);
          return;
        }

        if (currentSession?.user) {
          console.log('✅ Session found:', currentSession.user.email);
          setSession(currentSession);
          await loadUserProfile(currentSession.user);
        } else {
          console.log('ℹ️ No active session');
          setSession(null);
          setProfile(null);
        }

      } catch (err) {
        console.error('❌ Init error:', err);
        setSession(null);
        setProfile(null);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setInitialized(true);
          console.log('✅ Auth initialization complete');
        }
      }
    };

    // ✅ Step 2: Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔔 Auth event:', event);
      
      if (!mountedRef.current) return;

      switch (event) {
        case 'SIGNED_IN':
          if (newSession?.user) {
            console.log('✅ SIGNED_IN:', newSession.user.email);
            setSession(newSession);
            setLoading(true);
            await loadUserProfile(newSession.user);
            if (mountedRef.current) {
              setLoading(false);
            }
          }
          break;

        case 'SIGNED_OUT':
          console.log('👋 SIGNED_OUT');
          currentUserIdRef.current = null;
          setSession(null);
          setProfile(null);
          setLoading(false);
          break;

        case 'TOKEN_REFRESHED':
          console.log('🔄 Token refreshed');
          if (newSession) {
            setSession(newSession);
          }
          break;

        case 'USER_UPDATED':
          console.log('👤 User updated');
          if (newSession?.user) {
            setSession(newSession);
            const updatedProfile = await fetchProfile(newSession.user.id);
            if (updatedProfile && mountedRef.current) {
              setProfile(updatedProfile);
            }
          }
          break;

        case 'INITIAL_SESSION':
          // Handled in initializeAuth()
          break;
      }
    });

    authSubscription = data.subscription;

    // ✅ Step 3: Start initialization
    initializeAuth();

    // ✅ Cleanup
    return () => {
      console.log('🧹 Cleaning up auth...');
      mountedRef.current = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [loadUserProfile, fetchProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 AUTO REFRESH PROFILE (Every 5 mins)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    if (!session?.user || !initialized) return;
    
    const interval = setInterval(() => {
      if (mountedRef.current) {
        refreshProfile();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [session, initialized, refreshProfile]);

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
    console.log('📝 SignUp started:', email, role);
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
      console.log('✅ Auth user created:', userId);

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
        console.error('⚠️ DB insert error, trying update:', dbError.message);
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

      console.log('✅ SignUp complete');
      // Loading will be set to false by onAuthStateChange SIGNED_IN event
      
    } catch (err) {
      console.error('❌ SignUp error:', err);
      setLoading(false);
      throw err;
    }
  }, [createUserSheet]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔓 SIGN IN (FIXED)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    console.log('🔓 SignIn started:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        console.error('❌ SignIn error:', error.message);
        setLoading(false);
        throw error;
      }

      console.log('✅ SignIn successful, waiting for profile...');
      // Loading will be set to false by onAuthStateChange SIGNED_IN event
      
    } catch (err) {
      console.error('❌ SignIn exception:', err);
      setLoading(false);
      throw err;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👋 SIGN OUT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signOut = useCallback(async () => {
    console.log('👋 SignOut started');
    currentUserIdRef.current = null;
    setSession(null);
    setProfile(null);
    setLoading(false);
    
    try {
      await supabase.auth.signOut();
      console.log('✅ SignOut complete');
    } catch (err) {
      console.error('⚠️ SignOut error:', err);
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
