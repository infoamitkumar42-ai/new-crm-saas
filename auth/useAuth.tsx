/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - useAuth.tsx v6.1 (FIXED)                      ║
 * ║  Locked Date: January 6, 2025                              ║
 * ║  Status: STABLE - FIXED 400 ERROR                          ║
 * ║                                                            ║
 * ║  Features:                                                 ║
 * ║  - ✅ Removed Invalid 't' Parameter (Fixes 400 Error)      ║
 * ║  - ✅ Strict Cache-Control Headers                         ║
 * ║  - ✅ Auto-Refresh Timer                                   ║
 * ║  - ✅ Session Persistence                                  ║
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
import * as Sentry from "@sentry/react";
import { User } from "../types";
import { ENV } from "../config/env";

const SHEET_CREATOR_URL = "https://script.google.com/macros/s/AKfycbzq4iBT3_Cdcj2OO8XY8B5IXNSIHa0AJdYYTGCx1lGJFPbVt1RmDvF5gel0JD-12TDI/exec";

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  isNetworkError: boolean;
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
  const [profile, setProfile] = useState<User | null>(() => {
    // 🔥 INSTANT CACHE: Load from LocalStorage (Permanent) for zero-wait UI
    try {
      const cached = localStorage.getItem('leadflow-profile-cache');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  // ⚠️ CRITICAL FIX: Distinguish between "data loading" and "initial boot"
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true); // Always start loading to protect routes
  const [isNetworkError, setIsNetworkError] = useState(false);

  const mountedRef = useRef(true);
  const processingSignIn = useRef(false);
  const loadingProfileFor = useRef<string | null>(null); // 🔥 Prevents parallel loads

  const isAuthenticated = !!session && !!profile;

  // 🛡️ SAFE getSession wrapper — prevents indefinite hang on slow/unstable mobile networks
  const getSessionSafe = useCallback(async () => {
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) =>
          // 🚀 INCREASED TIMEOUT: 20s (from 5s) to support slow 3G/Mobile internet
          setTimeout(() => reject(new Error('SESSION_TIMEOUT')), 20000)
        )
      ]);
      return result;
    } catch (err: any) {
      if (err.message === 'SESSION_TIMEOUT') {
        console.warn('⚡ getSession() timed out after 20s — treating as UNKNOWN session');
      }
      // Return a special error instead of null to prevent accidental logout
      return { data: { session: null }, error: err };
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<User | null> => {
    try {
      // 1. Define Timeout Promise
      // 🚀 INCREASED TIMEOUT: 20s (from 15s) for extremely slow mobile networks
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 20000)
      );

      // 2. Define Fetch Promise
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // 3. Race!
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) throw error;

      if (mountedRef.current) {
        return data as User;
      }
      return null;

    } catch (err: any) {
      const status = typeof err === 'object' ? (err.status || err.code) : '';

      // 🌐 IDENTIFY NETWORK ERRORS
      const isNetworkError =
        err.message?.includes('Failed to fetch') ||
        err.name === 'TypeError' ||
        err.message === 'TIMEOUT' ||
        err.message?.includes('Load failed') ||
        err.message?.includes('Network error');

      // 🔄 RETRY LOGIC for Network Errors (Max 2 retries inside fetchProfile)
      if (isNetworkError && retryCount < 2) {
        const delay = 1000 * (retryCount + 1);
        console.warn(`🌐 Profile Fetch Failed (Network). Retrying in ${delay}ms... (Attempt ${retryCount + 1}/2)`);
        await new Promise(r => setTimeout(r, delay));
        return fetchProfile(userId, retryCount + 1);
      }

      // 🛑 HANDLE 403/401 (Auth Loop / Corrupted Session)
      if (status === 403 || status === 401 || err.message?.includes('Forbidden')) {
        console.warn("⛔ Supabase Access Forbidden (401/403). Token might be refreshing. Return null for silent fallback.");
        return null;
      }

      // 🛑 REPORT TO SENTRY
      const errorMsg = err.message || err.error_description || 'Unknown Supabase Error';

      Sentry.captureException(isNetworkError ? new Error(`Network Error: ${errorMsg}`) : err, {
        level: isNetworkError ? 'warning' : 'error', // 🚀 Downgrade network errors to Warning
        tags: {
          context: 'fetchProfile',
          error_category: isNetworkError ? 'network' : 'database',
          error_code: status,
          is_retry: retryCount > 0
        },
        extra: {
          attempts: retryCount + 1,
          full_err: err
        }
      });

      console.error("Auth Load Error:", err.message);
      return null;
    }
  }, []);

  const createTempProfile = useCallback((user: SupabaseUser): User => {
    const userEmailRaw = user.email || '';
    const userEmailLower = userEmailRaw.toLowerCase().trim();

    // 🛡️ FALLBACK: Force Admin for specific emails (Case Insensitive)
    const isAdminEmail = [
      'info.amitkumar42@gmail.com',
      'amitdemo1@gmail.com'
    ].includes(userEmailLower);

    return {
      id: user.id,
      email: userEmailRaw,
      name: user.user_metadata?.name || "User",
      role: isAdminEmail ? 'admin' : (user.user_metadata?.role || "member"), // 🔥 Force match
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
    };
  }, []);

  const loadUserProfile = useCallback(async (user: SupabaseUser, retryCount = 0): Promise<void> => {
    if (!mountedRef.current) return;

    // 🛑 CIRCUIT BREAKER: Stop after 2 failed retries
    const MAX_RETRIES = 2;

    // Prevent parallel loads for same user
    if (loadingProfileFor.current === user.id && retryCount === 0) {
      return;
    }

    if (retryCount > MAX_RETRIES) {
      if (mountedRef.current) {
        // Use temp profile as last resort to allow UI to render
        setProfile(createTempProfile(user));
        setLoading(false);
      }
      return;
    }

    try {
      if (retryCount === 0) loadingProfileFor.current = user.id;

      let userProfile = await fetchProfile(user.id);

      if (!mountedRef.current) return;

      if (userProfile) {
        setProfile(userProfile);
        setLoading(false);
        loadingProfileFor.current = null;
        // 🔥 SAVE TO CACHE (LocalStorage now)
        try {
          localStorage.setItem('leadflow-profile-cache', JSON.stringify(userProfile));
        } catch { }
      } else if (retryCount < MAX_RETRIES) {
        // Retry with exponential backoff
        const backoffMs = 1000 * (retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, backoffMs));

        if (!mountedRef.current) return;
        await loadUserProfile(user, retryCount + 1);
      } else {
        // Max retries reached, use temp profile
        setProfile(createTempProfile(user));
        setLoading(false); // 🔥 FIX: Release UI even if fetch fails permanently
        loadingProfileFor.current = null;
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.warn('⚠️ Request aborted (ignoring)');
        return;
      }

      console.error('❌ Load error:', err);

      if (mountedRef.current) {
        if (retryCount < MAX_RETRIES) {
          const backoffMs = 500 * (retryCount + 1);
          await new Promise(resolve => setTimeout(resolve, backoffMs));

          if (!mountedRef.current) return;
          await loadUserProfile(user, retryCount + 1);
        } else {
          setProfile(createTempProfile(user));
          setLoading(false);
          loadingProfileFor.current = null;
        }
      }
    }
  }, [fetchProfile, createTempProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      console.log('🔄 Force refreshing profile...');
      const updated = await fetchProfile(session.user.id);
      if (updated && mountedRef.current) {
        setProfile(updated);
        try {
          localStorage.setItem('leadflow-profile-cache', JSON.stringify(updated));
        } catch { }
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
      }).catch(() => { });
    } catch { }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      // 🚀 NUCLEAR RESET HANDLER (From Repair Button)
      if (window.location.search.includes('reset=done')) {
        console.warn("☢️ Reset parameter detected. Purging local state...");
        localStorage.clear();
        sessionStorage.clear();
        setProfile(null);
        setSession(null);
        // Remove the parameter without refreshing to avoid infinite reset loops
        window.history.replaceState({}, document.title, "/login");
      }

      // 🛡️ LOADING CIRCUIT BREAKER: Force end loading after 8s no matter what
      // Reduced from 15s → 8s for faster recovery on slow mobile / PWA
      const timeout = setTimeout(() => {
        if (mountedRef.current && loading) {
          console.warn("🕒 Auth Init Timeout (8s): Forcing release...");
          setLoading(false);
        }
      }, 8000);

      try {
        const { data: { session: currentSession }, error } = await getSessionSafe();

        if (!mountedRef.current) return;

        if (error) {
          console.warn("🌐 Network error during session fetch. Triggering offline mode.");
          setIsNetworkError(true);
          setLoading(false); // 🔥 FIX: Release UI so Network error screen can show
          return;
        }

        if (currentSession?.user) {
          setSession(currentSession);
          setIsNetworkError(false);

          // 🚀 AGGRESSIVE RELEASE: If we have a cached profile, release UI immediately
          // Check if cached profile matches current user
          if (profile && profile.id === currentSession.user.id) {
            setLoading(false);
            // Refresh logic in background (Silent Update)
            console.log("⚡ Optimistic Load: Showing cached profile while validating...");
            loadUserProfile(currentSession.user, 0);
          } else {
            // No cache or wrong user? We must wait
            await loadUserProfile(currentSession.user);
          }
        } else {
          // No session
          setLoading(false);
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
        console.error("Init error:", err);
      } finally {
        clearTimeout(timeout);
        if (mountedRef.current) {
          // ensure loading is off if we are done
          if (!session && !profile) setLoading(false);
          setIsInitialized(true);
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
          // 🚀 AGGRESSIVE RELEASE: Don't set loading(true) if we already have a profile
          // This prevents the 1-minute hang during background refreshes.
          if (!profile) setLoading(true);

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
        localStorage.removeItem('leadflow-profile-cache');
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
    // 🛡️ EMERGENCY RELEASE TIMER: If app is stuck on 'loading' for > 12s, release it.
    // This is the ultimate safety net for any hidden auth hangs.
    const emergencyRelease = setTimeout(() => {
      if (loading && isInitialized) {
        console.warn("🚨 EMERGENCY RELEASE: Auth took too long (>12s). Forcing UI release.");
        setLoading(false);
      }
    }, 12000);

    return () => clearTimeout(emergencyRelease);
  }, [loading, isInitialized]);

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

      if (role === 'member') {
        createUserSheetBackground(data.user.id, email, name);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (err: any) {
      setLoading(false);
      Sentry.captureException(err, { tags: { action: 'signUp', role } });
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

    } catch (err: any) {
      setLoading(false);
      Sentry.captureException(err, { tags: { action: 'signIn' } });
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
    setProfile(null);
    setLoading(false);

    try {
      await supabase.auth.signOut();
    } catch { }
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      isInitialized,
      isAuthenticated,
      isNetworkError,
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
