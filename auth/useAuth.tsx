/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 SIMPLIFIED - useAuth.tsx v3.2                          ║
 * ║  Removed timeouts - let Supabase handle it                 ║
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

  const isAuthenticated = !!session && !!profile;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 FETCH PROFILE (SIMPLE)
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
        console.error('❌ Profile error:', error.message);
        return null;
      }
      
      if (!data) {
        console.log('⚠️ No profile found');
        return null;
      }

      console.log('✅ Profile loaded:', data.email);
      return data as User;
    } catch (err: any) {
      console.error('❌ fetchProfile error:', err.message);
      return null;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚀 INITIALIZE AUTH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    mountedRef.current = true;
    console.log('🚀 Initializing auth...');

    const init = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (!mountedRef.current) return;

        if (currentSession?.user) {
          console.log('✅ Session found:', currentSession.user.email);
          setSession(currentSession);
          
          const userProfile = await fetchProfile(currentSession.user.id);
          if (mountedRef.current) {
            setProfile(userProfile);
          }
        } else {
          console.log('ℹ️ No session');
        }
      } catch (err) {
        console.error('❌ Init error:', err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          console.log('✅ Auth complete');
        }
      }
    };

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔔 Auth event:', event);
      
      if (!mountedRef.current) return;

      if (event === 'SIGNED_IN' && newSession?.user) {
        setSession(newSession);
        const userProfile = await fetchProfile(newSession.user.id);
        if (mountedRef.current) {
          setProfile(userProfile);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setLoading(false);
      }
    });

    init();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔄 REFRESH PROFILE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const userProfile = await fetchProfile(session.user.id);
      if (userProfile) setProfile(userProfile);
    }
  }, [session, fetchProfile]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 SIGN UP
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signUp = useCallback(async ({ email, password, name, role = 'member', teamCode, managerId }: any) => {
    console.log('📝 SignUp:', email);
    setLoading(true);
    
    try {
      let resolvedManagerId = managerId || null;
      const resolvedTeamCode = teamCode?.trim().toUpperCase() || null;

      if (role === 'member' && resolvedTeamCode && !resolvedManagerId) {
        const { data: managerData } = await supabase
          .from('users')
          .select('id')
          .eq('team_code', resolvedTeamCode)
          .eq('role', 'manager')
          .maybeSingle();

        if (!managerData) throw new Error("Invalid team code");
        resolvedManagerId = managerData.id;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: name.trim(), role, team_code: resolvedTeamCode, manager_id: resolvedManagerId } }
      });

      if (error) throw error;
      if (!data.user) throw new Error("Signup failed");

      // Create profile
      await supabase.from('users').upsert({
        id: data.user.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        team_code: resolvedTeamCode,
        manager_id: resolvedManagerId,
        payment_status: 'inactive',
        is_active: true,
        created_at: new Date().toISOString()
      });

      console.log('✅ SignUp complete');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔓 SIGN IN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    console.log('🔓 SignIn:', email);
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
    setSession(null);
    setProfile(null);
    await supabase.auth.signOut();
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
