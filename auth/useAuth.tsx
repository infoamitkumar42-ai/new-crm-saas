/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - useAuth.tsx v6.2 (PERFORMANCE)               ║
 * ║  Locked Date: March 10, 2026                              ║
 * ║  Status: STABLE - NETWORK-AWARE + CACHE TIMESTAMP         ║
 * ║                                                            ║
 * ║  Changes from v6.1:                                        ║
 * ║  - ✅ Network-aware dynamic timeout (15s-45s)              ║
 * ║  - ✅ Stale cache fallback on network failure              ║
 * ║  - ✅ Cache timestamp tracking (_cachedAt)                 ║
 * ║  - ✅ Enhanced Sentry tags (network_type, rtt)             ║
 * ║  - ✅ Offline detection before retry                       ║
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
import { supabase, supabaseRealtime } from "../supabaseClient";
import * as Sentry from "@sentry/react";
import { User } from "../types";
import { ENV } from "../config/env";

const SHEET_CREATOR_URL = "https://script.google.com/macros/s/AKfycbzq4iBT3_Cdcj2OO8XY8B5IXNSIHa0AJdYYTGCx1lGJFPbVt1RmDvF5gel0JD-12TDI/exec";

// ═══════════════════════════════════════════════════════════
// 🌐 NETWORK-AWARE UTILITIES (Added for Sentry Timeout Fix)
// ═══════════════════════════════════════════════════════════

/** Get current network info for Sentry debugging */
const getNetworkInfo = () => {
  const conn = (navigator as any).connection;
  return {
    online: navigator.onLine,
    type: conn?.effectiveType || 'unknown',
    downlink: conn?.downlink || 'unknown',
    rtt: conn?.rtt || 'unknown',
    saveData: conn?.saveData || false,
  };
};

/** Dynamic timeout based on network quality */
const getTimeoutForNetwork = (): number => {
  const conn = (navigator as any).connection;
  const type = conn?.effectiveType;
  switch (type) {
    case 'slow-2g':
    case '2g':
      return 45000;
    case '3g':
      return 30000;
    case '4g':
      return 15000;
    default:
      return 20000; // iPhone Safari doesn't expose connection API
  }
};

/** Write profile to cache with timestamp */
const writeProfileCache = (userId: string, data: any) => {
  try {
    const cacheEntry = {
      ...data,
      _cachedAt: Date.now(),
    };
    localStorage.setItem('leadflow-profile-cache', JSON.stringify(cacheEntry));
  } catch {
    // localStorage full or unavailable — silent fail
  }
};

/** Check if cached profile is fresh (< 10 min old) */
const isCacheFresh = (cachedProfile: any): boolean => {
  if (!cachedProfile?._cachedAt) return false;
  const age = Date.now() - cachedProfile._cachedAt;
  return age < 10 * 60 * 1000;
};

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
      const cachedStr = localStorage.getItem('leadflow-profile-cache');
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr);
        // 🧹 PURGE LEGACY DUMMY PROFILE
        if (parsed && parsed.daily_limit === 0 && parsed.leads_today === 0 && parsed.total_leads_received === 0 && parsed.payment_status === 'inactive') {
          console.warn("🧹 Wiping legacy dummy profile from cache to force live DB fetch!");
          localStorage.removeItem('leadflow-profile-cache');
          return null;
        }
        return parsed;
      }
      return null;
    } catch { return null; }
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNetworkError, setIsNetworkError] = useState(false);

  const mountedRef = useRef(true);
  const processingSignIn = useRef(false);
  const loadingProfileFor = useRef<string | null>(null);
  const profileFailCount = useRef(0);
  const isRefreshing = useRef(false);

  const isAuthenticated = !!session && !!profile;

  // 🛡️ SAFE getSession wrapper
  const getSessionSafe = useCallback(async () => {
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('SESSION_TIMEOUT')), 15000)
        )
      ]);
      return result;
    } catch (err: any) {
      if (err.message === 'SESSION_TIMEOUT') {
        console.warn('⚡ getSession() timed out after 15s — Attempting localStorage fallback...');

        const storageKey = 'leadflow-auth-v2';
        const rawSession = localStorage.getItem(storageKey) || localStorage.getItem('leadflow-auth');

        if (rawSession) {
          try {
            const cachedSession = JSON.parse(rawSession);
            if (cachedSession?.user && cachedSession?.access_token) {
              console.log('✅ Recovered session from localStorage after timeout. Proceeding optimistically.');
              return { data: { session: cachedSession }, error: null };
            }
          } catch (e) {
            console.error('❌ Failed to parse cached session:', e);
          }
        }

        supabase.removeAllChannels();
        supabaseRealtime.removeAllChannels();
      }
      return { data: { session: null }, error: err };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // 🔥 fetchProfile v6.2 — Network-Aware + Stale Cache Fallback
  // ═══════════════════════════════════════════════════════════
  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<User | null> => {
    try {
      // ✅ Check if user is offline before wasting a request
      if (!navigator.onLine && retryCount > 0) {
        console.warn('📴 User offline — skipping retry, checking stale cache...');
        const staleCache = localStorage.getItem('leadflow-profile-cache');
        if (staleCache) {
          try {
            const parsed = JSON.parse(staleCache);
            if (parsed?.id === userId) {
              Sentry.addBreadcrumb({
                message: 'Used stale cache — user offline during fetchProfile retry',
                level: 'info',
                data: { userId, retryCount },
              });
              return parsed as User;
            }
          } catch { }
        }
      }

      // ✅ Dynamic timeout based on network quality
      const timeoutMs = getTimeoutForNetwork();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
      );

      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) throw error;

      if (mountedRef.current) {
        // ✅ Write to cache on successful fetch (with timestamp)
        writeProfileCache(userId, data);
        return data as User;
      }
      return null;

    } catch (err: any) {
      const status = typeof err === 'object' ? (err.status || err.code) : '';

      const isNetworkErr =
        err.message?.includes('Failed to fetch') ||
        err.name === 'TypeError' ||
        err.message === 'TIMEOUT' ||
        err.message?.includes('Load failed') ||
        err.message?.includes('Network error');

      // 🔄 RETRY LOGIC for Network Errors (Max 3 retries)
      if (isNetworkErr && retryCount < 3) {
        // ✅ Don't retry if offline — use cache instead
        if (!navigator.onLine) {
          console.warn('📴 User offline — stopping retries early');
          const staleCache = localStorage.getItem('leadflow-profile-cache');
          if (staleCache) {
            try {
              const parsed = JSON.parse(staleCache);
              if (parsed?.id === userId) return parsed as User;
            } catch { }
          }
        }

        const delay = 1000 * (retryCount + 1);
        console.warn(`🌐 Profile Fetch Failed (Network). Retrying in ${delay}ms... (Attempt ${retryCount + 1}/3)`);
        await new Promise(r => setTimeout(r, delay));
        return fetchProfile(userId, retryCount + 1);
      }

      // 🛑 HANDLE 403/401
      if (status === 403 || status === 401 || err.message?.includes('Forbidden')) {
        console.warn("⛔ Supabase Access Forbidden (401/403). Return null for silent fallback.");
        return null;
      }

      // ✅ Enhanced Sentry with network details
      const errorMsg = err.message || err.error_description || 'Unknown Supabase Error';
      const networkInfo = getNetworkInfo();

      Sentry.captureException(isNetworkErr ? new Error(`Network Error: ${errorMsg}`) : err, {
        level: isNetworkErr ? 'warning' : 'error',
        tags: {
          context: 'fetchProfile',
          error_category: isNetworkErr ? 'network' : 'database',
          error_code: String(status),
          is_retry: String(retryCount > 0),
          network_type: String(networkInfo.type),
          is_online: String(networkInfo.online),
        },
        extra: {
          attempts: retryCount + 1,
          network: networkInfo,
          timeout_used_ms: getTimeoutForNetwork(),
          device_memory: (navigator as any).deviceMemory || 'unknown',
          full_err: err,
        }
      });

      // ✅ Last resort — return stale cache instead of null
      if (isNetworkErr) {
        const staleCache = localStorage.getItem('leadflow-profile-cache');
        if (staleCache) {
          try {
            const parsed = JSON.parse(staleCache);
            if (parsed?.id === userId) {
              console.warn('🛡️ All retries failed — returning stale cached profile');
              Sentry.addBreadcrumb({
                message: 'Returned stale cache after all fetchProfile retries failed',
                level: 'warning',
                data: { userId, retryCount, networkType: networkInfo.type },
              });
              return parsed as User;
            }
          } catch { }
        }
      }

      console.error("Auth Load Error:", err.message);
      return null;
    }
  }, []);

  const createTempProfile = useCallback((user: SupabaseUser): User => {
    const userEmailRaw = user.email || '';
    const userEmailLower = userEmailRaw.toLowerCase().trim();

    const isAdminEmail = [
      'info.amitkumar42@gmail.com',
      'amitdemo1@gmail.com'
    ].includes(userEmailLower);

    return {
      id: user.id,
      email: userEmailRaw,
      name: user.user_metadata?.name || "User",
      role: isAdminEmail ? 'admin' : (user.user_metadata?.role || "member"),
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

    const MAX_RETRIES = 1;

    if (loadingProfileFor.current === user.id && retryCount === 0) {
      return;
    }

    if (retryCount > MAX_RETRIES) {
      if (mountedRef.current) {
        profileFailCount.current += 1;
        console.warn(`⚠️ Profile fetch retries exhausted (fail #${profileFailCount.current}). Using stale cache.`);
        setLoading(false);
        loadingProfileFor.current = null;
        if (profileFailCount.current >= 3) {
          console.warn('🛑 CIRCUIT BREAKER: 3 consecutive profile failures. Stopping retries for 5 minutes.');
          setTimeout(() => { profileFailCount.current = 0; }, 5 * 60 * 1000);
        }
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
        profileFailCount.current = 0;
        // ✅ v6.2: Use writeProfileCache with timestamp
        writeProfileCache(userProfile.id, userProfile);
      } else if (retryCount < MAX_RETRIES) {
        const backoffMs = 1500 * (retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, backoffMs));

        if (!mountedRef.current) return;
        await loadUserProfile(user, retryCount + 1);
      } else {
        profileFailCount.current += 1;
        console.warn(`⚠️ Profile fetch failed permanently (fail #${profileFailCount.current}). Using stale cache.`);
        setLoading(false);
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
          profileFailCount.current += 1;
          console.warn(`⚠️ Profile catch: using stale cache (fail #${profileFailCount.current}).`);
          setLoading(false);
          loadingProfileFor.current = null;
        }
      }
    }
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (isRefreshing.current || profileFailCount.current >= 3 || !session?.user) return;
    isRefreshing.current = true;
    try {
      const updated = await fetchProfile(session.user.id);
      if (updated && mountedRef.current) {
        setProfile(updated);
        profileFailCount.current = 0;
        // ✅ v6.2: Use writeProfileCache with timestamp
        writeProfileCache(updated.id, updated);
      }
    } finally {
      isRefreshing.current = false;
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
      if (window.location.search.includes('reset=done')) {
        console.warn("☢️ Reset parameter detected. Purging local state...");
        localStorage.clear();
        sessionStorage.clear();
        setProfile(null);
        setSession(null);
        window.history.replaceState({}, document.title, "/login");
      }

      const timeout = setTimeout(async () => {
        if (mountedRef.current && loading) {
          console.warn("🕒 Auth Init Timeout (12s): Forcing release...");
          setLoading(false);
          await supabase.removeAllChannels();
          await supabaseRealtime.removeAllChannels();
        }
      }, 12000);

      try {
        const { data: { session: currentSession }, error } = await getSessionSafe();

        if (!mountedRef.current) return;

        if (error && error.message !== 'SESSION_TIMEOUT') {
          console.warn("🌐 Genuine network error during session fetch. Triggering offline mode.");
          setIsNetworkError(true);
          setLoading(false);
          return;
        }

        if (error?.message === 'SESSION_TIMEOUT') {
          console.warn("🕒 Session fetch timed out with no local cache. Proceeding to login.");
        }

        if (currentSession?.user) {
          setSession(currentSession);
          setIsNetworkError(false);

          try {
            const expiresAt = currentSession.expires_at;
            if (expiresAt) {
              const nowSec = Math.floor(Date.now() / 1000);
              const timeLeftSec = expiresAt - nowSec;
              if (timeLeftSec < 600) {
                console.log(`🔑 Token expires in ${timeLeftSec}s — refreshing manually via proxy...`);
                const { data: refreshData } = await supabase.auth.refreshSession();
                if (refreshData?.session) {
                  setSession(refreshData.session);
                  console.log('✅ Token refreshed successfully via proxy.');
                }
              }
            }
          } catch (refreshErr) {
            console.warn('⚠️ Manual token refresh failed, using existing session:', refreshErr);
          }

          const cachedProfileStr = localStorage.getItem('leadflow-profile-cache');
          const cachedProfile = cachedProfileStr ? JSON.parse(cachedProfileStr) : null;

          if (cachedProfile && cachedProfile.id === currentSession.user.id) {
            console.log("⚡ Optimistic Load: Showing cached profile. Rehydrating in background...");
            setProfile(cachedProfile);
            setLoading(false);
            loadUserProfile(currentSession.user, 0);
          } else {
            await loadUserProfile(currentSession.user);
          }
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || err.message?.includes('aborted')) return;
        console.error("Init error:", err);
      } finally {
        clearTimeout(timeout);
        if (mountedRef.current) {
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
    const emergencyRelease = setTimeout(() => {
      if (loading && isInitialized) {
        console.warn("🚨 EMERGENCY RELEASE: Auth took too long (>15s). Forcing UI release.");
        setLoading(false);
      }
    }, 15000);

    return () => clearTimeout(emergencyRelease);
  }, [loading, isInitialized]);

  useEffect(() => {
    if (!session?.user) return;

    const interval = setInterval(() => {
      if (mountedRef.current && profileFailCount.current < 3) {
        refreshProfile();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

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

    const withAuthRetry = async <T,>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
      let lastError: any;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (err: any) {
          lastError = err;
          const errString = String(err).toLowerCase();
          const errName = (err.name || '').toLowerCase();
          const errMsg = (err.message || '').toLowerCase();

          const isNetError =
            errMsg.includes('failed to fetch') ||
            errString.includes('authretryablefetcherror') ||
            errName === 'authretryablefetcherror' ||
            errName === 'typeerror' ||
            errMsg.includes('network error') ||
            errMsg.includes('timeout');

          if (isNetError && attempt < maxRetries) {
            const delay = 1000 * (attempt + 1);
            console.warn(`🌐 Auth Operation Failed (Network). Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    };

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

      const { data, error } = await withAuthRetry(() => supabase.auth.signUp({
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
      }));

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
      const isNetError =
        err.message?.includes('Failed to fetch') ||
        err.name === 'AuthRetryableFetchError' ||
        err.name === 'TypeError' ||
        err.message?.includes('Network error');

      if (isNetError) setIsNetworkError(true);

      Sentry.captureException(err, {
        level: isNetError ? 'warning' : 'error',
        tags: { action: 'signUp', role, error_category: isNetError ? 'network' : 'auth' }
      });
      throw err;
    }
  }, [createUserSheetBackground]);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);

    const withAuthRetry = async <T,>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
      let lastError: any;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (err: any) {
          lastError = err;
          const errString = String(err).toLowerCase();
          const errName = (err.name || '').toLowerCase();
          const errMsg = (err.message || '').toLowerCase();

          const isNetError =
            errMsg.includes('failed to fetch') ||
            errString.includes('authretryablefetcherror') ||
            errName === 'authretryablefetcherror' ||
            errName === 'typeerror' ||
            errMsg.includes('network error') ||
            errMsg.includes('timeout');

          if (isNetError && attempt < maxRetries) {
            const delay = 1000 * (attempt + 1);
            console.warn(`🌐 Auth Operation Failed (Network). Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    };

    try {
      const { error } = await withAuthRetry(() => supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      }));

      if (error) {
        setLoading(false);
        throw error;
      }

    } catch (err: any) {
      setLoading(false);
      const isNetError =
        err.message?.includes('Failed to fetch') ||
        err.name === 'AuthRetryableFetchError' ||
        err.name === 'TypeError' ||
        err.message?.includes('Network error');

      if (isNetError) setIsNetworkError(true);

      Sentry.captureException(err, {
        level: isNetError ? 'warning' : 'error',
        tags: { action: 'signIn', error_category: isNetError ? 'network' : 'auth' }
      });
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
