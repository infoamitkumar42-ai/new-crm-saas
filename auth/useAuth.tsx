/**
 * ╔════════════════════════════════════════════════════════════╗
 * ║  🔒 LOCKED - useAuth.tsx v4.0 (FINAL FAST LOGIN)           ║
 * ║  Fix: Removed Sheet Creation from Login Flow               ║
 * ╚════════════════════════════════════════════════════════════╝
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { User } from "../types";

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (params: any) => Promise<void>;
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

  // 📥 Fetch Profile (Simple & Fast)
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('📥 Fetching profile:', userId);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Profile Error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error('❌ Exception:', err);
      return null;
    }
  }, []);

  // 🔄 Refresh Profile Helper
  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      const data = await fetchProfile(session.user.id);
      if (data && mountedRef.current) setProfile(data);
    }
  }, [session, fetchProfile]);

  // 🚀 Initialize Auth
  useEffect(() => {
    mountedRef.current = true;
    console.log('🚀 Auth Init...');

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && mountedRef.current) {
        console.log('✅ Session found');
        setSession(session);
        const userProfile = await fetchProfile(session.user.id);
        if (mountedRef.current) setProfile(userProfile);
      }
      
      if (mountedRef.current) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔔 Auth Event:', event);
      if (!mountedRef.current) return;

      if (event === 'SIGNED_IN' && newSession?.user) {
        setSession(newSession);
        const userProfile = await fetchProfile(newSession.user.id);
        if (mountedRef.current) {
          setProfile(userProfile);
          setLoading(false); // Stop loading immediately
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

  // 📝 Sign Up
  const signUp = async (params: any) => {
    setLoading(true);
    const { email, password, name, role, teamCode, managerId } = params;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role, team_code: teamCode, manager_id: managerId } }
      });

      if (error) throw error;

      if (data.user) {
        // Create DB Entry
        await supabase.from('users').insert({
          id: data.user.id,
          email,
          name,
          role: role || 'member',
          team_code: teamCode,
          manager_id: managerId,
          is_active: true,
          created_at: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('Sign Up Error:', error);
      throw error;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // 🔓 Sign In
  const signIn = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      console.error('Login Error:', error);
      setLoading(false);
      throw error;
    }
  };

  // 👋 Sign Out
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      profile, 
      loading, 
      isAuthenticated: !!session,
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
