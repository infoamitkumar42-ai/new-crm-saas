// src/auth/useAuth.tsx v4.0 (FINAL WORKING)

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { User } from "../types";

// Context Type Definition
interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (params: { email: string; password: string }) => Promise<void>;
  signUp: (params: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // 📥 Fetch Profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('📥 Fetching profile:', userId);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) console.error('❌ Profile Error:', error.message);
      return data;
    } catch (err) {
      console.error('❌ Exception:', err);
      return null;
    }
  }, []);

  // 🚀 Initialize
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
        if (mountedRef.current) setProfile(userProfile);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
      }
    });

    init();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // 🔓 Sign In Function
  const signIn = async ({ email, password }: { email: string; password: string }) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  };

  // 📝 Sign Up Function
  const signUp = async (params: any) => {
    try {
      const { email, password, name, role, teamCode, managerId } = params;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role, team_code: teamCode, manager_id: managerId } }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile in DB
        await supabase.from('users').insert({
          id: data.user.id,
          email,
          name,
          role: role || 'member',
          team_code: teamCode,
          manager_id: managerId,
          is_active: true
        });
      }
    } catch (error) {
      console.error('Signup Error:', error);
      throw error;
    }
  };

  // 👋 Sign Out Function
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
      signIn,
      signUp,
      signOut
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
