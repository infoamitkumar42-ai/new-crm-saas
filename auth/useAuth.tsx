// src/auth/useAuth.tsx

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { User } from "../types";

const AuthContext = createContext<any>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // 📥 Fetch Profile Function
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

  // 🚀 Initialize Auth
  useEffect(() => {
    mountedRef.current = true;
    console.log('🚀 Auth Init...');

    const init = async () => {
      try {
        // Get Session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mountedRef.current) {
          console.log('✅ Session found:', session.user.email);
          setSession(session);
          
          // Get Profile
          const userProfile = await fetchProfile(session.user.id);
          
          if (mountedRef.current) {
            if (userProfile) {
              console.log('✅ Profile loaded');
              setProfile(userProfile);
            } else {
              console.warn('⚠️ No profile found');
            }
          }
        }
      } catch (e) {
        console.error('❌ Init Failed:', e);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          console.log('🏁 Loading complete');
        }
      }
    };

    // Auth Listener
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

  // 📝 Sign Up
  const signUp = async (params: any) => {
    const { email, password, name, role = 'member', teamCode, managerId } = params;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role, team_code: teamCode, manager_id: managerId } }
      });
      
      if (error) throw error;
      if (data.user) {
        // Create Profile Immediately
        await supabase.from('users').insert({
          id: data.user.id,
          email,
          name,
          role,
          team_code: teamCode,
          manager_id: managerId,
          is_active: true
        });
      }
    } catch (error) {
      console.error('Sign Up Error:', error);
      throw error;
    }
  };

  // 🔓 Sign In
  const signIn = async ({ email, password }: any) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
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
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default useAuth;
